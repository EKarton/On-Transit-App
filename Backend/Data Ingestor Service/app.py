from pyspark.sql.types import *
from pyspark.sql import *
from pyspark.sql import functions as F
from pyspark import SparkConf, SparkContext

import pandas as pd

import requests
import zipfile

import os

from transformations import reduce_geocoordinates_precision, rename_columns


def download_gtfs_file(url, file_path, chunk_size=128):
    r = requests.get(url, stream=True)
    with open(file_path, "wb") as save_file:
        for chunk in r.iter_content(chunk_size=chunk_size):
            save_file.write(chunk)


def extract_zip_file(file_path, target_dir):
    with zipfile.ZipFile(file_path, "r") as zip_ref:
        zip_ref.extractall(target_dir)


def load_gtfs_data(spark, dir_):

    # The schemas for the necessary GTFS file
    TRIPS_RECORD = StructType(
        [
            StructField("route_id", StringType(), False),
            StructField("service_id", StringType(), False),
            StructField("trip_id", StringType(), False),
            StructField("trip_headsign", StringType(), True),
            StructField("trip_short_name", StringType(), True),
            StructField("direction_id", StringType(), True),
            StructField("block_id", StringType(), True),
            StructField("shape_id", StringType(), True),
            StructField("wheelchair_accessible", StringType(), True),
            StructField("bikes_allowed", StringType(), True),
        ]
    )

    ROUTES_RECORD = StructType(
        [
            StructField("route_id", StringType(), False),
            StructField("agency_id", StringType(), True),
            StructField("route_short_name", StringType(), True),
            StructField("route_long_name", StringType(), True),
            StructField("route_desc", StringType(), True),
            StructField("route_type", StringType(), False),
            StructField("route_url", StringType(), True),
            StructField("route_color", StringType(), True),
            StructField("route_text_color", StringType(), True),
        ]
    )

    SHAPES_RECORD = StructType(
        [
            StructField("shape_id", StringType(), False),
            StructField("shape_pt_lat", DoubleType(), False),
            StructField("shape_pt_lon", DoubleType(), False),
            StructField("shape_pt_sequence", IntegerType(), False),
            StructField("shape_dist_traveled", DoubleType(), True),
        ]
    )

    STOPS_RECORD = StructType(
        [
            StructField("stop_id", StringType(), False),
            StructField("stop_code", StringType(), True),
            StructField("stop_name", StringType(), True),
            StructField("stop_desc", StringType(), True),
            StructField("stop_lat", DoubleType(), True),
            StructField("stop_lon", DoubleType(), True),
            StructField("zone_id", StringType(), True),
            StructField("stop_url", StringType(), True),
            StructField("location_type", StringType(), True),
            StructField("parent_station", StringType(), True),
            StructField("stop_timezone", StringType(), True),
            StructField("wheelchair_boarding", StringType(), True),
            StructField("level_id", StringType(), True),
            StructField("platform_code", StringType(), True),
        ]
    )

    STOP_TIMES_RECORD = StructType(
        [
            StructField("trip_id", StringType(), False),
            StructField("arrival_time", StringType(), False),
            StructField("departure_time", StringType(), False),
            StructField("stop_id", StringType(), False),
            StructField("stop_sequence", IntegerType(), False),
            StructField("stop_headsign", StringType(), True),
            StructField("pickup_type", StringType(), True),
            StructField("drop_off_type", StringType(), True),
            StructField("continuous_pickup", StringType(), True),
            StructField("continuous_drop_off", StringType(), True),
            StructField("shape_dist_traveled", DoubleType(), True),
            StructField("timepoint", StringType(), True),
        ]
    )

    # Load the dataframe
    trips_data = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        # .schema(TRIPS_RECORD)
        .option("inferSchema", "true")
        .load(os.path.join(dir_, "trips.txt"))
    )

    routes_data = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        # .schema(ROUTES_RECORD)
        .option("inferSchema", "true")
        .load(os.path.join(dir_, "routes.txt"))
    )

    shapes_data = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        # .schema(SHAPES_RECORD)
        .option("inferSchema", "true")
        .load(os.path.join(dir_, "shapes.txt"))
    )

    stops_data = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        # .schema(STOPS_RECORD)
        .option("inferSchema", "true")
        .load(os.path.join(dir_, "stops.txt"))
    )

    stop_times_data = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        # .schema(STOP_TIMES_RECORD)
        .option("inferSchema", "true")
        .load(os.path.join(dir_, "stop_times.txt"))
    )

    return trips_data, routes_data, shapes_data, stops_data, stop_times_data


if __name__ == "__main__":

    # URL = "https://www.miapp.ca/GTFS/google_transit.zip"
    # RAW_ZIPFILE_PATH = "data/raw_data/miway_gtfs.zip"
    # EXTRACTED_GTFS_FILEPATH = "data/extracted_data/miway_gtfs"
    # DATABASE_NAME = "miway"

    URL = "https://www.gotransit.com/static_files/gotransit/assets/Files/GO_GTFS.zip"
    RAW_ZIPFILE_PATH = "data/raw_data/go_transit_gtfs.zip"
    EXTRACTED_GTFS_FILEPATH = "data/extracted_data/go_transit_gtfs"
    DATABASE_NAME = "go_transit"

    # # Download and extract the GTFS data
    # download_gtfs_file(URL, RAW_ZIPFILE_PATH)
    # extract_zip_file(RAW_ZIPFILE_PATH, EXTRACTED_GTFS_FILEPATH)

    print("== Loading data ==")
    spark = (
        SparkSession.builder.master("local")
        .appName("My App")
        .config("spark.mongodb.input.uri", "mongodb://127.0.0.1/test.coll")
        .config("spark.mongodb.output.uri", "mongodb://127.0.0.1/test.coll")
        .config(
            "spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.11:2.3.1"
        )
        .getOrCreate()
    )

    # Load the GTFS data as Spark data frames
    trips, routes, shapes, stops, stop_times = load_gtfs_data(
        spark, EXTRACTED_GTFS_FILEPATH
    )

    trips.show()
    routes.show()
    shapes.show()
    stops.show()
    stop_times.show()

    print("== Loaded data ==")
    # =====================================================================================================================
    print("\n== Starting Step 0 ==")

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

    stop_times = stop_times.withColumn("arrival_time", convert_time_to_integer_udf(stop_times.arrival_time))
    stop_times = stop_times.withColumn("departure_time", convert_time_to_integer_udf(stop_times.departure_time))

    print("\n== Finished Step 0 ==")
    # =====================================================================================================================
    print("\n== Starting Step 1 ==")

    # Attach route information to each trip
    trips = (
        trips.join(routes, trips.route_id == routes.route_id)
        .withColumnRenamed("shape_id", "path_id")
        .select(
            "trip_id",
            "path_id",
            "trip_headsign",
            "trip_short_name",
            "route_short_name",
            "route_long_name",
            "route_type",
        )
        .withColumnRenamed("trip_headsign", "headsign")
        .withColumnRenamed("route_short_name", "short_name")
        .withColumnRenamed("route_long_name", "long_name")
        .withColumnRenamed("route_type", "type")
    )

    # Combines path locations with the same shape ID
    paths_data = (
        shapes.sort("shape_pt_sequence")
        .groupBy("shape_id")
        .agg(
            F.collect_list("latitude").alias("path_latitudes"),
            F.collect_list("longitude").alias("path_longitudes"),
        )
        .withColumnRenamed("shape_id", "path_id")
    )

    print("\n== Finished Step 1 ==")
    print("\n== Starting Step 2 ==")

    def remove_duplicate_stops(stops, stop_times):
        """ Given a stops dataframe, it will remove the duplicated stop locations in `stops` and update the `stop_times`
            with the non-duplicated stop locations
        """

        # Compute the hash code for each stop location
        def compute_hash(name, latitude, longitude):

            # Handle NoneType in strings
            name = name if type(name) == str else ""

            return "{},{},{}".format(
                name.strip(), str(latitude).strip(), str(longitude).strip(),
            )

        compute_hash_udf = F.udf(compute_hash, StringType())
        stops = stops.withColumn(
            "hash", compute_hash_udf(stops.stop_name, stops.latitude, stops.longitude,),
        )

        # Drop the duplicate stop locations
        unique_stops = stops.dropDuplicates(["hash"])

        # Make a map mapping old stop IDs to unique stop IDs
        stop_id_mappings = (
            stops.withColumnRenamed("stop_id", "old_stop_id")
            .join(unique_stops, stops.hash == unique_stops.hash)
            .withColumnRenamed("stop_id", "new_stop_id")
            .select("old_stop_id", "new_stop_id")
        )

        # Update all references from duplicated stop locations to unique stop locations
        stop_times = (
            stop_times.join(
                stop_id_mappings, stop_times.stop_id == stop_id_mappings.old_stop_id,
            )
            .drop("stop_id")
            .drop("old_stop_id")
            .withColumnRenamed("new_stop_id", "stop_id")
        )

        # Remove the hash columns
        unique_stops = unique_stops.drop("hash")

        return unique_stops, stop_times

    def remove_duplicated_paths(paths, trips):
        """ Given a paths dataframe, it will remove the duplicated paths in `paths` and update the `trips`
            with the non-duplicated paths
        """

        def compute_hash(latitudes, longitudes):
            hashed_locations = [
                str(latitudes[i]).strip() + "," + str(longitudes[i]).strip()
                for i, _ in enumerate(latitudes)
            ]

            return ",".join(hashed_locations)

        # Compute the hash of all paths
        compute_hash_udf = F.udf(compute_hash, StringType())
        paths = paths.withColumn(
            "hash", compute_hash_udf(paths.path_latitudes, paths.path_longitudes)
        )

        # Drop duplicated paths
        unique_paths = paths.dropDuplicates(["hash"])

        # Make a map mapping old path IDs to unique path IDs
        path_id_mappings = (
            paths.withColumnRenamed("path_id", "old_path_id")
            .join(unique_paths, paths.hash == unique_paths.hash)
            .withColumnRenamed("path_id", "new_path_id")
            .select("old_path_id", "new_path_id")
        )

        # Update all references form duplicated paths to unique paths
        trips = (
            trips.join(path_id_mappings, trips.path_id == path_id_mappings.old_path_id,)
            .drop("path_id")
            .drop("old_path_id")
            .withColumnRenamed("new_path_id", "path_id")
        )

        # Remove the hash columns
        unique_paths = unique_paths.drop("hash")

        return unique_paths, trips

    def remove_duplicate_trips(trips, stop_times):
        def compute_hash(
            path_id, short_name, long_name, trip_short_name, headsign, trip_type
        ):
            items = [
                path_id,
                short_name,
                long_name,
                trip_short_name,
                headsign,
                trip_type,
            ]
            hash_str = ",".join(
                item.strip() if type(item) is str else "" for item in items
            )

            return hash_str

        # Compute the hash of all trips
        compute_hash_udf = F.udf(compute_hash, StringType())
        trips = trips.withColumn(
            "hash",
            compute_hash_udf(
                trips.path_id,
                trips.short_name,
                trips.long_name,
                trips.trip_short_name,
                trips.headsign,
                trips.type,
            ),
        )

        # Drop duplicated paths
        unique_trips = trips.dropDuplicates(["hash"])

        # Make a map mapping old path IDs to unique path IDs
        trip_id_mappings = (
            trips.withColumnRenamed("trip_id", "old_trip_id")
            .join(unique_trips, trips.hash == unique_trips.hash)
            .withColumnRenamed("trip_id", "new_trip_id")
            .select("old_trip_id", "new_trip_id")
        )

        # Update all references form duplicated trips to unique trips
        stop_times = (
            stop_times.join(
                trip_id_mappings, stop_times.trip_id == trip_id_mappings.old_trip_id,
            )
            .drop("trip_id")
            .drop("old_trip_id")
            .withColumnRenamed("new_trip_id", "trip_id")
        )

        # Remove the hash columns
        unique_trips = unique_trips.drop("hash")

        return unique_trips, stop_times

    def remove_duplicated_stop_times(stop_times):
        def compute_hash(trip_id, stop_id, arrival_time, departure_time, stop_headsign):
            items = [
                trip_id,
                stop_id,
                arrival_time,
                departure_time,
                stop_headsign,
            ]
            hash_str = ",".join(
                item.strip() if type(item) is str else "" for item in items
            )

            return hash_str

        # Compute the hash of all trips
        compute_hash_udf = F.udf(compute_hash, StringType())
        stop_times = stop_times.withColumn(
            "hash",
            compute_hash_udf(
                stop_times.trip_id,
                stop_times.stop_id,
                stop_times.arrival_time,
                stop_times.departure_time,
                stop_times.stop_headsign,
            ),
        )

        # Drop duplicated paths
        unique_stop_times = stop_times.dropDuplicates(["hash"])

        # Remove the hash columns
        unique_stop_times = unique_stop_times.drop("hash")

        return unique_stop_times

    stops, stop_times = remove_duplicate_stops(stops, stop_times)
    paths_data, trips = remove_duplicated_paths(paths_data, trips)
    trips, stop_times = remove_duplicate_trips(trips, stop_times)
    stop_times = remove_duplicated_stop_times(stop_times)

    print("\n== Finished Step 2 ==")
    # =====================================================================================================================
    print("\n== Starting Step 3 ==")

    """
        Combines data with the same trip ID from multiple objects:
        {
            trip_id: <TRIP_ID>,
            stop_id: <STOP_LOCATION_ID>,
            time: [ <ARRIVAL_TIME>, <DEPARTURE_TIME> ]
            stop_sequence: <SEQUENCE>,
            stop_headsign: <HEADSIGN>
        }

        to a singular object:
        {
            trip_id: <TRIP_ID>,
            times: [(A1, D1), (A2, D2), ..., (An, Dn)],
            locations: [L1, L2, ..., Ln],
            headsigns: [H1, H2, ..., Hn],
            hash: <HASH_CODE>,
            startTime: <START_TIME>,
            endTime: <END_TIME>
        }

        where Ai is the arrival time, Di is the depart time,
        times[], locations[], and headsign[] are sorted by their sequence number.
    """
    # Combine the start and end times, and locations of each stop location into a tuple

    def make_tuple(start_time, end_time):
        return [start_time, end_time]

    make_tuple_udf = F.udf(make_tuple, ArrayType(IntegerType(), False))
    stop_times = (
        stop_times.withColumn(
            "time", make_tuple_udf(stop_times.arrival_time, stop_times.departure_time),
        )
        .drop("arrival_time")
        .drop("departure_time")
    )

    stop_times = (
        stop_times.sort("stop_sequence")
        .groupBy("trip_id")
        .agg(
            F.collect_list("time").alias("times"),
            F.collect_list("stop_id").alias("locations"),
            F.collect_list("stop_headsign").alias("headsigns"),
        )
    )

    print("\n== Finished Step 3 ==")
    # =====================================================================================================================
    print("\n== Starting Step 4 ==")

    def path_location_builder(latitudes, longitudes):
        location = {
            "type": "LineString",
            "coordinates": [
                [latitudes[i], longitudes[i]] for i, _ in enumerate(latitudes)
            ],
        }
        return location

    LOCATION_RECORD = StructType(
        [
            StructField("type", StringType(), False),
            StructField(
                "coordinates", ArrayType(ArrayType(DoubleType(), False), False), False
            ),
        ]
    )
    path_location_builder_udf = F.udf(path_location_builder, LOCATION_RECORD)
    paths_data = paths_data.withColumn(
        "location",
        path_location_builder_udf(
            paths_data.path_latitudes, paths_data.path_longitudes
        ),
    )

    paths_data = paths_data.drop("path_latitudes").drop("path_longitudes")

    print("\n== Finished Step 4 ==")
    # =====================================================================================================================

    stops.write.format("com.mongodb.spark.sql.DefaultSource").option(
        "database", DATABASE_NAME
    ).option("collection", "stop_locations").mode("append").save()

    stop_times.write.format("com.mongodb.spark.sql.DefaultSource").option(
        "database", DATABASE_NAME
    ).option("collection", "schedules").mode("append").save()

    paths_data.write.format("com.mongodb.spark.sql.DefaultSource").option(
        "database", DATABASE_NAME
    ).option("collection", "paths").mode("append").save()

    trips.write.format("com.mongodb.spark.sql.DefaultSource").option(
        "database", DATABASE_NAME
    ).option("collection", "trips").mode("append").save()
