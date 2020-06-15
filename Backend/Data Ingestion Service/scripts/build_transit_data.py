from pyspark.sql.types import *
from pyspark.sql.window import Window
from pyspark.sql import *
from pyspark.sql import functions as F
from pyspark import SparkConf, SparkContext

import pandas as pd

import requests
import zipfile

import os
import sys
import argparse

import pymongo
from pymongo import MongoClient

from dotenv import load_dotenv


def get_mongodb_url():
    return os.environ.get("MONGO_DB_TRANSITS_URL")


def get_transit_info(transit_id, database):
    results = list(database["transits"].find({"transit_id": transit_id}).limit(1))

    if len(results) == 1:
        return results[0]
    elif len(results) > 1:
        raise ValueError("Transit id %s returned more than one document!" % transit_id)
    else:
        raise ValueError("Transit id %s returned no documents!" % transit_id)


def download_gtfs_file(url, file_path, chunk_size=128):
    r = requests.get(url, stream=True)
    with open(file_path, "wb") as save_file:
        for chunk in r.iter_content(chunk_size=chunk_size):
            save_file.write(chunk)


def extract_zip_file(file_path, target_dir):
    with zipfile.ZipFile(file_path, "r") as zip_ref:
        zip_ref.extractall(target_dir)


def load_gtfs_data(spark, dir_):
    """ Load the GTFS data
        Note: all fields will have a String datatype
    """
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

    # Cache the results
    trips.cache()
    routes.cache()
    shapes.cache()
    stops.cache()
    stop_times.cache()

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
    stop_times = stop_times.withColumn(
        "stop_sequence", stop_times["stop_sequence"].cast(IntegerType())
    )
    shapes = shapes.withColumn(
        "shape_pt_sequence", shapes["shape_pt_sequence"].cast(IntegerType())
    )

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


def build_bounding_box(shapes, transit_id):
    """ Given a list of path locations, it will return a bounding box 
        with this format:
        {
            transit_id: <TRANSIT_ID>,
            location: {
                type: "Polygon",
                coordinates: [
                    [
                        [<LONG_1>, <LAT_1>],
                        [<LONG_2>, <LAT_2>],
                        [<LONG_3>, <LAT_3>],
                        [<LONG_4>, <LAT_4>],
                        [<LONG_1>, <LAT_1>]
                    ]
                ]
            }
        }

        Note: The first and last coordinates match in order to close the bounding box
    """
    bounded_shapes = shapes.agg(
        F.min("latitude").alias("min_latitude"),
        F.max("latitude").alias("max_latitude"),
        F.min("longitude").alias("min_longitude"),
        F.max("longitude").alias("max_longitude"),
    )

    def build_bounding_box_helper(
        min_latitude, max_latitude, min_longitude, max_longitude
    ):
        location = {
            "type": "Polygon",
            "coordinates": [
                [
                    [min_longitude, min_latitude],
                    [max_longitude, min_latitude],
                    [max_longitude, max_latitude],
                    [min_longitude, max_latitude],
                    [min_longitude, min_latitude],
                ]
            ],
        }
        return location

    LOCATION_RECORD = StructType(
        [
            StructField("type", StringType(), False),
            StructField(
                "coordinates",
                ArrayType(ArrayType(ArrayType(DoubleType(), False), False), False),
                False,
            ),
        ]
    )
    build_bounding_box_udf = F.udf(build_bounding_box_helper, LOCATION_RECORD)
    bounding_box = bounded_shapes.withColumn(
        "location",
        build_bounding_box_udf(
            bounded_shapes.min_latitude,
            bounded_shapes.max_latitude,
            bounded_shapes.min_longitude,
            bounded_shapes.max_longitude,
        ),
    )

    # Add the transit ID to each record
    transit_info_df = spark.createDataFrame([(transit_id,)], ["transit_id"])

    bounding_box = bounding_box.withColumn("temp_key", F.lit(0))
    transit_info_df = transit_info_df.withColumn("temp_key", F.lit(0))
    bounding_box = bounding_box.crossJoin(transit_info_df).drop("temp_key")

    return bounding_box


def build_trips(trips, routes):
    new_trips = (
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
    return new_trips


def build_paths(shapes):
    """ Takes a shapes dataframe with each row of this format:
        {
            shape_id: <INT>
            shape_pt_sequence: <INT>,
            latitude: <DOUBLE>,
            longitude: <DOUBLE>
        }

        groups each row by shape_id, sorts each group by shape_pt_sequence, and 
        returns a new dataframe with each row of this format:
        {
            path_id: <INT>,
            path_latitudes: [ <DOUBLE>, ... ]
            path_longitude: [ <DOUBLE>, ... ]
        }
    """
    paths_window = Window.partitionBy(shapes.shape_id).orderBy(shapes.shape_pt_sequence)

    paths = (
        shapes.withColumn(
            "path_latitudes", F.collect_list("latitude").over(paths_window)
        )
        .withColumn("path_longitudes", F.collect_list("longitude").over(paths_window))
        .withColumn(
            "path_sequences", F.collect_list("shape_pt_sequence").over(paths_window)
        )
    )

    paths = (
        paths.groupBy("shape_id")
        .agg(
            F.max("path_latitudes").alias("path_latitudes"),
            F.max("path_longitudes").alias("path_longitudes"),
            F.max("path_sequences").alias("path_sequences"),
        )
        .withColumnRenamed("shape_id", "path_id")
    )

    return paths


def remove_duplicate_stops(stops, stop_times):
    """ Given a stops dataframe, it will remove the duplicated stop locations in `stops` and update the `stop_times`
        with the non-duplicated stop locations
    """
    old_stops_count = stops.count()
    old_stop_times_count = stop_times.count()

    # Group the stops that are the same
    similar_stops = stops.groupBy("stop_name", "latitude", "longitude").agg(
        F.min("stop_id").alias("new_stop_id"),
        F.collect_list("stop_id").alias("old_stop_ids"),
    )

    # Make a map of the old stop IDs to the new stop IDs
    # NOTE: the exploded column name is called 'col'
    stop_id_mappings = similar_stops.select("new_stop_id", F.explode("old_stop_ids"))

    stop_times = stop_times.join(
        stop_id_mappings, stop_times.stop_id == stop_id_mappings.col, how="leftouter"
    )
    stop_times = stop_times.withColumn("stop_id", stop_times.new_stop_id)

    # Get the unique stops
    unique_stops = (
        similar_stops.select("new_stop_id", "stop_name", "latitude", "longitude")
        .withColumnRenamed("new_stop_id", "stop_id")
        .drop("new_stop_id")
    )

    new_stops_count = stops.count()
    new_stop_times_count = stop_times.count()

    assert (
        new_stops_count <= old_stops_count
        and old_stop_times_count == new_stop_times_count
    )

    return unique_stops, stop_times


def remove_duplicated_paths(paths, trips):
    """ Given a paths dataframe, it will remove the duplicated paths in `paths` and update the `trips`
        with the non-duplicated paths
    """
    old_paths_count = paths.count()
    old_trips_count = trips.count()

    # Group the paths that are the same
    similar_paths = paths.groupBy("path_latitudes", "path_longitudes").agg(
        F.min("path_id").alias("new_path_id"),
        F.collect_list("path_id").alias("old_path_ids"),
    )

    # Make a map of the old path IDs to the new path IDs
    # NOTE: the exploded column name is called 'col'
    path_id_mappings = similar_paths.select("new_path_id", F.explode("old_path_ids"))

    # Update the trips' reference to path ids
    trips = trips.join(
        path_id_mappings, trips.path_id == path_id_mappings.col, how="leftouter"
    )
    trips = trips.withColumn("path_id", trips.new_path_id)

    # Grab the unique paths
    unique_paths = (
        similar_paths.select("new_path_id", "path_latitudes", "path_longitudes",)
        .withColumnRenamed("new_path_id", "path_id")
        .drop("new_path_id")
    )

    new_paths_count = unique_paths.count()
    new_trips_count = trips.count()

    assert new_paths_count <= old_paths_count and new_trips_count == old_trips_count

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

    schedules_window = Window.partitionBy(stop_times.trip_id).orderBy(
        stop_times.stop_sequence
    )

    schedules = (
        stop_times.withColumn(
            "times", F.collect_list("arrival_time").over(schedules_window)
        )
        .withColumn("locations", F.collect_list("stop_id").over(schedules_window))
        .withColumn("headsigns", F.collect_list("stop_headsign").over(schedules_window))
        .withColumn("sequences", F.collect_list("stop_sequence").over(schedules_window))
    )

    schedules = (
        schedules.groupBy("trip_id")
        .agg(
            F.max("times").alias("times"),
            F.max("locations").alias("locations"),
            F.max("headsigns").alias("headsigns"),
            F.max("sequences").alias("sequences"),
            F.min("times").alias("start_time"),
            F.max("times").alias("end_time"),
        )
    )

    return schedules


def remove_duplicate_trips(trips, schedules):
    old_trips_count = trips.count()
    old_schedules_count = schedules.count()

    # Group the stops that has the same hash value
    similar_trips = trips.groupBy(
        "path_id", "short_name", "long_name", "trip_short_name", "headsign", "type"
    ).agg(
        F.min("trip_id").alias("new_trip_id"),
        F.collect_list("trip_id").alias("old_trip_ids"),
    )

    # Make a map of the old trip IDs to the new trip IDs
    trip_id_mappings = similar_trips.select("new_trip_id", F.explode("old_trip_ids"))

    # Update all references form duplicated trips to unique trips
    schedules = schedules.join(
        trip_id_mappings, schedules.trip_id == trip_id_mappings.col, how="leftouter"
    )
    schedules = schedules.withColumn("trip_id", schedules.new_trip_id)

    # Grab the unique trips
    unique_trips = similar_trips.select(
        "new_trip_id",
        "path_id",
        "short_name",
        "long_name",
        "trip_short_name",
        "headsign",
        "type",
    ).withColumnRenamed("new_trip_id", "trip_id")

    new_trips_count = unique_trips.count()
    new_schedules_count = schedules.count()
    assert (
        new_trips_count <= old_trips_count
        and new_schedules_count == old_schedules_count
    )

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


def save_gtfs_to_database(trips, schedules, paths, stop_locations):
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


def save_bounding_box_to_database(bounding_box, database, transit_id):
    # Delete the old bounding box
    database["bounding_boxes"].remove({"transit_id": transit_id})

    # Save the new bounding box
    host, port = database.client.address
    db_uri = "mongodb://{}:{}/{}".format(host, port, database.name)

    bounding_box.write.format("com.mongodb.spark.sql.DefaultSource").option(
        "uri", db_uri
    ).option("collection", "bounding_boxes").mode("append").save()


def build_database_indexes(database):
    database.trips.create_index([("trip_id", pymongo.ASCENDING)])
    database.stop_locations.create_index([("stop_id", pymongo.ASCENDING)])
    database.schedules.create_index([("trip_id", pymongo.ASCENDING)])
    database.paths.create_index([("path_id", pymongo.ASCENDING)])
    database.paths.create_index([("location", pymongo.GEOSPHERE)])


if __name__ == "__main__":

    # Make the parser
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "transit_id", type=str, help="The transit ID",
    )
    opts = parser.parse_args(sys.argv[1:])

    # Load the environment variables
    load_dotenv()

    # Get the transit info
    transit_info = None
    with MongoClient(get_mongodb_url()) as client:
        database = client["transits"]
        transit_info = get_transit_info(opts.transit_id, database)

    print("Transit agency info to pre-process GTFS data:")
    print(transit_info, "\n")

    if transit_info["gtfs_url"] is None:
        raise ValueError('transit_info["gtfs_url"] cannot be NULL!')

    if transit_info["db_name"] is None:
        raise ValueError('transit_info["db_name"] cannot be NULL!')

    # Download and extract the GTFS data
    RAW_ZIPFILE_PATH = "data/raw_data/gtfs.zip"
    EXTRACTED_GTFS_FILEPATH = "data/extracted_data/gtfs"

    print(
        "Downloading {} to {}".format(transit_info["gtfs_url"], EXTRACTED_GTFS_FILEPATH)
    )
    download_gtfs_file(transit_info["gtfs_url"], RAW_ZIPFILE_PATH)

    print(
        "Finished downloading \nExtracting {} to {}".format(
            RAW_ZIPFILE_PATH, EXTRACTED_GTFS_FILEPATH
        )
    )

    extract_zip_file(RAW_ZIPFILE_PATH, EXTRACTED_GTFS_FILEPATH)
    print("Finished extracting")

    print("== Loading data ==")
    spark = (
        SparkSession.builder.master("local")
        .appName("My App")
        .config(
            "spark.mongodb.output.uri",
            "{}/{}".format(get_mongodb_url(), transit_info["db_name"]),
        )
        .config(
            "spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.11:2.3.1"
        )
        .getOrCreate()
    )

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
    bounding_box = build_bounding_box(shapes, transit_info["transit_id"])

    print("== Finished Step 1 == \n== Starting Step 2 ==")

    stops, stop_times = remove_duplicate_stops(stops, stop_times)
    paths, trips = remove_duplicated_paths(paths, trips)

    print("== Finished Step 2 == \n== Starting Step 3 ==")

    schedules = build_schedule(stop_times)

    print("== Finished Step 3 == \n== Starting Step 4 ==")

    trips, schedules = remove_duplicate_trips(trips, schedules)
    schedules = remove_duplicated_schedules(schedules)

    print("== Finished Step 4 == \n== Starting Step 5 ==")

    paths = build_geospatial_paths(paths)

    print("== Finished Step 5 ==")

    # Save the GTFS data to a database
    save_gtfs_to_database(trips, schedules, paths, stops)

    # Save the bounding box to a database
    with MongoClient(get_mongodb_url()) as client:
        database = client["transits"]

        save_bounding_box_to_database(
            bounding_box, database, transit_info["transit_id"]
        )

    # Create the indexes for the GTFS data
    with MongoClient(get_mongodb_url()) as client:
        database = client[transit_info["db_name"]]

        build_database_indexes(database)
