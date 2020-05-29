""" This script will add any transit services based on a particular location
"""

import os
import sys
import argparse

from dotenv import load_dotenv

import pymongo
from pymongo import MongoClient


def get_mongodb_uri():
    return os.environ.get("MONGO_DB_TRANSITS_URI")


def does_transit_exist_in_database(database, transit_id):
    """ It checks if the database contains info on the transit ID
        Returns True if the database contains an entry with the same transit ID; 
        else false
    """
    return database["transits"].count_documents({"transit_id": transit_id}) > 0


def add_transit_details_to_database(database, transit_info):
    """ Adds a transit entry to the database

        The transit_info param should have the following requirements:
        {
            transit_id: <THE-TRANSIT-ID>,
            gtfs_url: <URL-TO-GTFS-ZIPFILE>,
            last_updated: <TIMESTAMP>
        }
    """
    database["transits"].insert_one(transit_info)


if __name__ == "__main__":
    # Make the parser
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "transit_id", type=str, help="The transit id",
    )
    parser.add_argument(
        "name", type=str, help="The name of the transit agency",
    )
    parser.add_argument(
        "gtfs_url", type=str, help="The URL to the GTFS file",
    )
    parser.add_argument(
        "last_updated",
        type=int,
        help="The timestamp to when the GTFS file was updated",
    )
    opts = parser.parse_args(sys.argv[1:])

    # Load the environment variables
    load_dotenv()

    # Make a connection to the MongoDB database
    parsed = pymongo.uri_parser.parse_uri(get_mongodb_uri())
    db_name = parsed["database"]

    with MongoClient(get_mongodb_uri()) as client:
        database = client[db_name]

        transit_info = {
            "transit_id": opts.transit_id,
            "name": opts.name,
            "gtfs_url": opts.gtfs_url,
            "last_updated": opts.last_updated,
        }

        if not does_transit_exist_in_database(database, transit_info["transit_id"]):
            print("Adding new transit %s" % transit_info["transit_id"])
            add_transit_details_to_database(database, transit_info)

            print("Added new transit %s" % transit_info["transit_id"])
