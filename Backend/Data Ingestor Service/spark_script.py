from pyspark.sql.types import *
from pyspark.sql import *
from pyspark.sql import functions as F
from pyspark import SparkConf, SparkContext

import pandas as pd

import requests
import zipfile

import os
import sys
import argparse


def download_gtfs_file(url, file_path, chunk_size=128):
    r = requests.get(url, stream=True)
    with open(file_path, "wb") as save_file:
        for chunk in r.iter_content(chunk_size=chunk_size):
            save_file.write(chunk)


def extract_zip_file(file_path, target_dir):
    with zipfile.ZipFile(file_path, "r") as zip_ref:
        zip_ref.extractall(target_dir)


def load_gtfs_data(spark, dir_):
    ''' Load the GTFS data
        Note: all fields will have a String datatype
    '''
    trips = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        .load(os.path.join(dir_, "trips.txt"))
    )

    routes = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        .load(os.path.join(dir_, "routes.txt"))
    )

    shapes = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        .load(os.path.join(dir_, "shapes.txt"))
    )

    stops = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        .load(os.path.join(dir_, "stops.txt"))
    )

    stop_times = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        .load(os.path.join(dir_, "stop_times.txt"))
    )

    return trips, routes, shapes, stops, stop_times


def reduce_geocoordinates_precision(dataframe):
    def reduce_lat_long_precision(amount):
        return round(amount, 5)

    reduce_num_decimal_places_udf = F.udf(reduce_lat_long_precision, DoubleType())

    dataframe = dataframe.withColumn(
        "latitude", reduce_num_decimal_places_udf(dataframe.latitude)
    )
    dataframe = dataframe.withColumn(
        "longitude", reduce_num_decimal_places_udf(dataframe.longitude)
    )

    return dataframe


def rename_columns(dataframe, renamed_columns):
    for old_name, new_name in renamed_columns.items():
        dataframe = dataframe.withColumnRenamed(old_name, new_name)
    return dataframe


def normalize_data(routes, trips, shapes, stops, stop_times):
    # Remove the columns that we don't need further in the process
    trips = trips.select(
        "trip_id", "shape_id", "route_id", "trip_headsign", "trip_short_name"
    )
    routes = routes.select(
        "route_id", "route_short_name", "route_long_name", "route_type"
    )
    shapes = shapes.select(
        "shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence"
    )
    stops = stops.select("stop_id", "stop_name", "stop_lat", "stop_lon")
    stop_times = stop_times.select(
        "trip_id",
        "stop_id",
        "arrival_time",
        "departure_time",
        "stop_sequence",
        "stop_headsign",
    )

    # Rename columns
    shapes = rename_columns(
        shapes, {"shape_pt_lat": "latitude", "shape_pt_lon": "longitude"}
    )
    stops = rename_columns(stops, {"stop_lat": "latitude", "stop_lon": "longitude"})

    # Convert the sequence IDs to integers
    stop_times = stop_times.withColumn("stop_sequence", stop_times["stop_sequence"].cast(IntegerType()))
    shapes = shapes.withColumn("shape_pt_sequence", shapes["shape_pt_sequence"].cast(IntegerType()))

    # Convert latitude and longitude to doubles
    stops = stops.withColumn("latitude", stops["latitude"].cast(DoubleType()))
    stops = stops.withColumn("longitude", stops["longitude"].cast(DoubleType()))
    shapes = shapes.withColumn("latitude", shapes["latitude"].cast(DoubleType()))
    shapes = shapes.withColumn("longitude", shapes["longitude"].cast(DoubleType()))

    shapes.printSchema()
    routes.printSchema()
    stops.printSchema()
    stop_times.printSchema()
    trips.printSchema()

    # Reduce the number of decimal places in lat/long coordinates to 5
    stops = reduce_geocoordinates_precision(stops)
    shapes = reduce_geocoordinates_precision(shapes)

    # Change times to decimal format
    def convert_time_to_integer(time):
        splitted_time = time.split(":")

        if len(splitted_time) == 3:
            num_hrs_from_noon = int(splitted_time[0])
            num_min_from_hr = int(splitted_time[1])
            num_sec_from_min = int(splitted_time[2])

            return (
                num_sec_from_min + (num_min_from_hr * 60) + (num_hrs_from_noon * 3600)
            )

        else:
            return -1

    convert_time_to_integer_udf = F.udf(convert_time_to_integer, IntegerType())

    stop_times = stop_times.withColumn(
        "arrival_time", convert_time_to_integer_udf(stop_times.arrival_time)
    )
    stop_times = stop_times.withColumn(
        "departure_time", convert_time_to_integer_udf(stop_times.departure_time)
    )

    return routes, trips, shapes, stops, stop_times


def build_trips(trips, routes):
    trips = (
        trips.join(routes, on=["route_id"])
        .select(
            "trip_id",
            "shape_id",
            "trip_headsign",
            "trip_short_name",
            "route_short_name",
            "route_long_name",
            "route_type",
        )
        .withColumnRenamed("shape_id", "path_id")
        .withColumnRenamed("trip_headsign", "headsign")
        .withColumnRenamed("route_short_name", "short_name")
        .withColumnRenamed("route_long_name", "long_name")
        .withColumnRenamed("route_type", "type")
    )
    return trips


def build_paths(shapes):
    paths = (
        shapes.sort("shape_pt_sequence")
        .groupBy("shape_id")
        .agg(
            F.collect_list("latitude").alias("path_latitudes"),
            F.collect_list("longitude").alias("path_longitudes"),
        )
        .withColumnRenamed("shape_id", "path_id")
    )
    return paths


def remove_duplicate_stops(stops, stop_times):
    """ Given a stops dataframe, it will remove the duplicated stop locations in `stops` and update the `stop_times`
        with the non-duplicated stop locations
    """
    # Compute the hash of all paths
    stops = stops.withColumn(
        "hash",
        F.sha2(F.concat_ws("|", stops.stop_name, stops.latitude, stops.longitude), 256),
    )

    # Drop the duplicate stop locations
    unique_stops = stops.dropDuplicates(["hash"])

    # Make a map mapping old stop IDs to unique stop IDs
    stop_id_mappings = stops.join(
        unique_stops.withColumnRenamed("stop_id", "new_stop_id"),
        on=["hash"],
        how="leftouter",
    ).select("stop_id", "new_stop_id")

    # Update all references from duplicated stop locations to unique stop locations
    stop_times = stop_times.join(stop_id_mappings, on=["stop_id"], how="leftouter")
    stop_times = stop_times.withColumn("stop_id", stop_times.new_stop_id)

    # Remove the hash columns
    unique_stops = unique_stops.drop("hash")

    return unique_stops, stop_times


def remove_duplicated_paths(paths, trips):
    """ Given a paths dataframe, it will remove the duplicated paths in `paths` and update the `trips`
        with the non-duplicated paths
    """
    # Compute the hash of all paths
    hashed_paths = paths.withColumn(
        "hash",
        F.sha2(F.concat_ws("||", paths.path_latitudes, paths.path_longitudes), 256),
    )

    # Drop duplicated paths
    unique_paths = hashed_paths.dropDuplicates(["hash"])

    # Make a map mapping old path IDs to unique path IDs
    path_id_mappings = hashed_paths.join(
        unique_paths.withColumnRenamed("path_id", "new_path_id"),
        on=["hash"],
        how="leftouter",
    ).select("path_id", "new_path_id")

    # Update all references form duplicated paths to unique paths
    trips = trips.join(path_id_mappings, on=["path_id"], how="leftouter")
    trips = trips.withColumn("path_id", trips.new_path_id)

    # Remove the hash columns
    unique_paths = unique_paths.drop("hash")

    return unique_paths, trips


def build_schedule(stop_times):
    """ Combines the stop times with the same trip ID:
        {
            trip_id: <TRIP_ID>,
            stop_id: <STOP_LOCATION_ID>,
            arrival_time: <ARRIVAL_TIME>,
            departure_time: <DEPARTURE_TIME>,
            stop_sequence: <SEQUENCE>,
            stop_headsign: <HEADSIGN>
        }

        to a singular object:
        {
            trip_id: <TRIP_ID>,
            times: [ARRIVAL_TIME_1, ARRIVAL_TIME_2, ..., ARRIVAL_TIME_N],
            locations: [L1, L2, ..., Ln],
            headsigns: [H1, H2, ..., Hn],
            startTime: min(ARRIVAL_TIME_1, ARRIVAL_TIME_2, ..., ARRIVAL_TIME_N),
            endTime: max(ARRIVAL_TIME_1, ARRIVAL_TIME_2, ..., ARRIVAL_TIME_N)
        }

        where Ai is the arrival time, Di is the depart time,
        times[], locations[], and headsign[] are sorted by their sequence number.
    """

    schedules = (
        stop_times.sort("stop_sequence")
        .groupBy("trip_id")
        .agg(
            F.collect_list("arrival_time").alias("times"),
            F.min("arrival_time").alias("start_time"),
            F.max("arrival_time").alias("end_time"),
            F.collect_list("stop_id").alias("locations"),
            F.collect_list("stop_headsign").alias("headsigns"),
            F.collect_list("stop_sequence").alias("sequences"),
        )
    )

    return schedules


def remove_duplicate_trips(trips, schedules):
    # Compute the hash of all trips
    trips = trips.withColumn(
        "hash",
        F.concat_ws(
            "|",
            trips.path_id,
            trips.short_name,
            trips.long_name,
            trips.trip_short_name,
            trips.headsign,
            trips.type,
        ),
    )

    trips.repartition(1).write.csv("trips.csv")

    # Drop duplicated paths
    unique_trips = trips.dropDuplicates(["hash"])

    unique_trips.repartition(1).write.csv("unique_trips.csv")

    unique_trips.printSchema()
    trips.printSchema()

    # Make a map mapping old trip IDs to unique trip IDs
    trip_id_mappings = trips.join(
        unique_trips.withColumnRenamed("trip_id", "new_trip_id"),
        on=["hash"],
        how="leftouter",
    ).select("trip_id", "new_trip_id")

    trip_id_mappings.repartition(1).write.csv("trip_id_mappings.csv")
    schedules.repartition(1).select("trip_id").write.csv("schedules_tripid.csv")

    # Update all references form duplicated trips to unique trips
    schedules = schedules.join(trip_id_mappings, on=["trip_id"], how="leftouter")
    schedules = schedules.withColumn("trip_id", schedules.new_trip_id)

    print(schedules.count())

    # Remove the hash columns
    unique_trips = unique_trips.drop("hash")

    return unique_trips, schedules


def remove_duplicated_schedules(schedules):
    # Compute the hash of each stop item
    schedules = schedules.withColumn(
        "hash",
        F.sha2(
            F.concat_ws(
                "||",
                schedules.trip_id,
                schedules.times,
                schedules.start_time,
                schedules.end_time,
                schedules.locations,
                schedules.headsigns,
            ),
            256,
        ),
    )

    # Drop duplicated paths
    unique_schedules = schedules.dropDuplicates(["hash"])

    # Remove the hash columns
    unique_schedules = unique_schedules.drop("hash")

    return unique_schedules


def build_geospatial_paths(paths):
    """ Takes in a dataframe like:
        {
            path_id: <PATH_ID>,
            path_latitudes: [ <LAT_1>, <LAT_2>, ..., <LAT_N> ],
            path_longitudes: [ <LONG_1>, <LONG_2>, ..., <LONG_N> ]
        }

        and returns a new dataframe like:
        {
            path_id: <PATH_ID>,
            location: {
                type: "LineString",
                coordinates: [
                    [<LONG_1>, <LAT_1>],
                    [<LONG_2>, <LAT_2>],
                    ...
                    [<LONG_N>, <LAT_N>]
                ]
            }
        }

        This is for MongoDB's geospatial analysis
    """

    def path_location_builder(latitudes, longitudes):
        location = {
            "type": "LineString",
            "coordinates": [
                [longitudes[i], latitudes[i]] for i, _ in enumerate(latitudes)
            ],
        }
        return location

    LOCATION_RECORD = StructType(
        [
            StructField("type", StringType(), False),
            StructField(
                "coordinates", ArrayType(ArrayType(DoubleType(), False), False), False,
            ),
        ]
    )
    path_location_builder_udf = F.udf(path_location_builder, LOCATION_RECORD)
    paths = paths.withColumn(
        "location",
        path_location_builder_udf(paths.path_latitudes, paths.path_longitudes),
    )

    paths = paths.drop("path_latitudes").drop("path_longitudes")

    return paths


def save_to_database(trips, schedules, paths, stop_locations):
    print("Saving {} stop locations".format(stop_locations.count()))

    stop_locations.write.format("com.mongodb.spark.sql.DefaultSource").option(
        "collection", "stop_locations"
    ).mode("overwrite").save()

    print("Saved stop locations \nSaving {} paths".format(paths.count()))

    paths.write.format("com.mongodb.spark.sql.DefaultSource").option(
        "collection", "paths"
    ).mode("overwrite").save()

    print("Saved paths \nSaving {} schedules".format(schedules.count()))

    schedules.write.format("com.mongodb.spark.sql.DefaultSource").option(
        "collection", "schedules"
    ).mode("overwrite").save()

    print("Saved schedules \nSaving {} trips".format(trips.count()))

    trips.write.format("com.mongodb.spark.sql.DefaultSource").option(
        "collection", "trips"
    ).mode("overwrite").save()

    print("Saved trips")


if __name__ == "__main__":

    # Make the parser
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "gtfs_url", type=str, help="The download link to the GTFS file",
    )
    parser.add_argument(
        "mongodb_uri",
        type=str,
        help="The URI connection string to your MongoDB instance",
    )
    opts = parser.parse_args(sys.argv[1:])

    # Download and extract the GTFS data
    RAW_ZIPFILE_PATH = "data/raw_data/gtfs.zip"
    EXTRACTED_GTFS_FILEPATH = "data/extracted_data/gtfs"

    download_gtfs_file(opts.gtfs_url, RAW_ZIPFILE_PATH)
    extract_zip_file(RAW_ZIPFILE_PATH, EXTRACTED_GTFS_FILEPATH)

    print("== Loading data ==")
    spark = (
        SparkSession.builder.master("local")
        .appName("My App")
        .config("spark.mongodb.output.uri", opts.mongodb_uri)
        .config(
            "spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.11:2.3.1"
        )
        .getOrCreate()
    )
    spark.catalog.clearCache()

    trips, routes, shapes, stops, stop_times = load_gtfs_data(
        spark, EXTRACTED_GTFS_FILEPATH
    )

    print("== Loaded data == \n== Starting Step 0 ==")

    routes, trips, shapes, stops, stop_times = normalize_data(
        routes, trips, shapes, stops, stop_times
    )

    print("== Finished Step 0 == \n== Starting Step 1 ==")

    trips = build_trips(trips, routes)
    paths = build_paths(shapes)

    print("== Finished Step 1 == \n== Starting Step 2 ==")

    # stops, stop_times = remove_duplicate_stops(stops, stop_times)
    # paths, trips = remove_duplicated_paths(paths, trips)

    print("== Finished Step 2 == \n== Starting Step 3 ==")

    schedules = build_schedule(stop_times)

    print("== Finished Step 3 == \n== Starting Step 4 ==")

    # trips, schedules = remove_duplicate_trips(trips, schedules)
    # schedules = remove_duplicated_schedules(schedules)

    print("== Finished Step 4 == \n== Starting Step 5 ==")

    paths = build_geospatial_paths(paths)

    print("== Finished Step 5 ==")

    save_to_database(trips, schedules, paths, stops)
