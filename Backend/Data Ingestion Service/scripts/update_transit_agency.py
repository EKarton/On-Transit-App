""" What this script does:
    1. Look at the current transit feeds we have so far
    2. For each transit feed, compare the timestamp with the timestamp before it
    3. If there is a mismatch, run the spark_script.py
"""

import os
import sys
import argparse
import json
import re

from dotenv import load_dotenv

import requests

import pymongo
from pymongo import MongoClient

import utils


def get_all_transit_ids_from_database(database):
    """ Returns a list of all transit IDs in the database
    """
    return list(
        map(
            lambda item: item["transit_id"],
            list(database["transits"].find({}, {"transit_id": 1, "_id": 0})),
        )
    )


def get_transit_info_from_database(database, transit_id):
    results = list(database["transits"].find({"transit_id": transit_id}).limit(1))

    if len(results) == 0:
        raise ValueError("There no results for transit_id={}!".format(transit_id))

    elif len(results) == 1:
        return results[0]

    else:
        raise ValueError(
            "There are {} results for transit_id={}!".format(len(results), transit_id)
        )


def inject_default_mongodb_uri_to_transit_info(transit_info):
    # Add the default mongo db instance
    database_name = re.sub('[\s\\/$."]', "_", transit_info["name"])
    transit_info["db_name"] = database_name

    return transit_info


def update_transit_info_details_in_database(database, new_transit_info):
    database["transits"].update_one(
        {"transit_id": new_transit_info["transit_id"]}, {"$set": new_transit_info}
    )


def update_all_transit_info(database):
    print("Updating all transit agencies")

    transit_ids = get_all_transit_ids_from_database(database)

    for transit_id in transit_ids:
        current_transit_info = get_transit_info_from_database(database, transit_id)

        latest_transit_info = utils.get_latest_transit_info_details(transit_id)
        latest_transit_info = inject_default_mongodb_uri_to_transit_info(
            latest_transit_info
        )

        if current_transit_info["last_updated"] < latest_transit_info["last_updated"]:
            print("Transit ID {} requires GTFS data re-built!".format(transit_id))
            update_transit_info_details_in_database(database, latest_transit_info)

    print("Finished updating all transit agencies")


def update_transit_info(transit_id):
    print("Updating transit agency {}".format(transit_id))

    current_transit_info = get_transit_info_from_database(database, transit_id)

    latest_transit_info = utils.get_latest_transit_info_details(transit_id)
    latest_transit_info = inject_default_mongodb_uri_to_transit_info(
        latest_transit_info
    )

    if current_transit_info["last_updated"] < latest_transit_info["last_updated"]:
        print("Transit ID {} requires GTFS data re-built!".format(transit_id))
        update_transit_info_details_in_database(database, latest_transit_info)

    print("Finished updating transit agency")


if __name__ == "__main__":
    # Make the parser
    parser = argparse.ArgumentParser(description=__doc__)

    stopping = parser.add_mutually_exclusive_group()
    stopping.add_argument(
        "-a", "--all", action="store_true", help="Updates all transit agencies' info",
    )
    stopping.add_argument(
        "-t",
        "--transit-id",
        type=str,
        help="Update a particular transit agency's info",
    )

    opts = parser.parse_args(sys.argv[1:])

    # Load the environment variables
    load_dotenv()

    with MongoClient(utils.get_mongodb_uri()) as client:
        database = client["transits"]

        if opts.all:
            update_all_transit_info(database)

        else:
            update_transit_info(opts.transit_id)
