""" This script will add any transit services based on a particular location
"""

import os
import sys
import argparse

import json

from dotenv import load_dotenv

import pymongo
from pymongo import MongoClient

import utils


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
            last_updated: <TIMESTAMP>,
            db_name: <DATABASE_NAME>,
        }
    """
    database["transits"].insert_one(transit_info)


if __name__ == "__main__":
    # Make the parser
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-i", "--input", type=str, help="The file path to the JSON file"
    )
    opts = parser.parse_args(sys.argv[1:])

    # Load the environment variables
    load_dotenv()

    # Make a connection to the MongoDB database
    with MongoClient(utils.get_mongodb_uri()) as client:
        database = client["transits"]

        # Read the file
        with open(opts.input) as feed_file:
            transit_agencies = json.load(feed_file)

            for transit_info in transit_agencies:
                if not does_transit_exist_in_database(
                    database, transit_info["transit_id"]
                ):
                    print("Adding new transit %s" % transit_info["transit_id"])
                    add_transit_details_to_database(database, transit_info)

                    print("Added new transit %s" % transit_info["transit_id"])
