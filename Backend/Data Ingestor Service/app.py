from pyspark.sql.types import *
from pyspark.sql import *
from pyspark.sql import functions as F
from pyspark import SparkConf, SparkContext

import requests
import zipfile

import os


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
            StructField("tts_stop_name", StringType(), True),
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
            StructField("arrival_time", StringType(), True),
            StructField("departure_time", StringType(), True),
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
        .schema(TRIPS_RECORD)
        .load(os.path.join(dir_, "trips.txt"))
    )

    routes_data = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        .schema(ROUTES_RECORD)
        .load(os.path.join(dir_, "routes.txt"))
    )

    shapes_data = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        .schema(SHAPES_RECORD)
        .load(os.path.join(dir_, "shapes.txt"))
    )

    stops_data = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        .schema(STOPS_RECORD)
        .load(os.path.join(dir_, "stops.txt"))
    )

    stop_times_data = (
        spark.read.format("csv")
        .option("sep", ",")
        .option("header", "true")
        .schema(STOP_TIMES_RECORD)
        .load(os.path.join(dir_, "stop_times.txt"))
    )

    return trips_data, routes_data, shapes_data, stops_data, stop_times_data


if __name__ == "__main__":

    # Download and extract the GTFS data
    # download_gtfs_file(
    #     "https://www.miapp.ca/GTFS/google_transit.zip", "data/raw_data/miway_gtfs.zip"
    # )
    # extract_zip_file("data/raw_data/miway_gtfs.zip", "data/extracted_data/miway_gtfs")

    print("== Loading data ==")
    spark = SparkSession.builder.master("local").appName("My App").getOrCreate()

    # Load the GTFS data as Spark data frames
    trips_data, routes_data, shapes_data, stops_data, stop_times_data = load_gtfs_data(
        spark, "data/extracted_data/miway_gtfs"
    )

    trips_data.show()
    routes_data.show()
    shapes_data.show()
    stops_data.show()
    stop_times_data.show()

    print("== Loaded data ==")
    print("\n== Starting Step 1 ==")

    # Attach route information to each trip
    trips_data = trips_data.join(
        routes_data, trips_data.route_id == routes_data.route_id
    )

    # Combines path locations with the same shape ID
    shapes_data = (
        shapes_data.sort("shape_pt_sequence")
        .groupBy("shape_id")
        .agg(
            F.collect_list("shape_pt_lat"),
            F.collect_list("shape_pt_lon"),
            F.collect_list("shape_pt_sequence"),
            F.collect_list("shape_dist_traveled"),
        )
    )

    # Combine the start and end times of each stop location into a tuple
    stop_times_data

    # Combines stop times with the same trip ID from multiple objects to a singular object
    

    trips_data.show()
    trips_data.printSchema()

    shapes_data.show()
    shapes_data.printSchema()

    print("\n== Finished Step 1 ==")
