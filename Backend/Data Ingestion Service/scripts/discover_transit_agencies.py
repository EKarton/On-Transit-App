""" This script will add any transit services based on a particular location
"""

import os
import sys
import argparse
import json
import re

from dotenv import load_dotenv

import requests


def get_transit_feeds_api_key():
    return os.environ.get("TRANSIT_FEEDS_API_KEY")


def find_location_id(location_name):
    """ Finds the location ID from a location name by making
        an API request to transitfeeds.com

        If no location name is found, it will return an error
    """

    # Make an API request to get the supported countries
    url = "https://api.transitfeeds.com/v1/getLocations"
    params = {"key": get_transit_feeds_api_key()}

    response = requests.get(url=url, params=params)
    data = response.json()
    locations = data["results"]["locations"]

    # Capture the first instance that has the location name
    for location in locations:
        if location["t"] == location_name:
            return location["id"]

    raise ValueError("Unable to find the location ID of %s" % location_name)


def find_transit_agencies_by_location_id(location_id):
    """ Finds the available transit agencies by a location ID
        It will return a list of transit agencies, each with this format:
        {
            transit_id: <TRANSIT_ID>
            gtfs_url: <LINK-TO-GTFS-ZIP-FILE>,
            name: <NAME-OF-TRANSIT-AGENCY>,
            last_updated: <TIMESTAMP>
        }
    """

    # Make an API request to get the transit agencies
    max_pages = float("inf")
    cur_page = 1
    url = "https://api.transitfeeds.com/v1/getFeeds"
    params = {
        "key": get_transit_feeds_api_key(),
        "location": location_id,
        "descendants": 1,
        "page": 1,
        "limit": 10,
        "type": "gtfs",
    }

    # Go through pages of results
    transit_agencies = []
    while cur_page <= max_pages:
        response = requests.get(url=url, params=params)
        data = response.json()
        max_pages = data["results"]["numPages"]
        feeds = data["results"]["feeds"]

        for feed in feeds:
            transit_id = feed["id"] if "id" in feed else None
            name = feed["t"] if "t" in feed else None
            gtfs_url = feed["u"]["d"] if "u" in feed and "d" in feed["u"] else None
            last_updated = (
                feed["latest"]["ts"]
                if "latest" in feed and "ts" in feed["latest"]
                else None
            )

            transit_info = {
                "transit_id": transit_id,
                "name": name,
                "gtfs_url": gtfs_url,
                "last_updated": last_updated,
            }
            transit_agencies.append(transit_info)

        cur_page += 1

    return transit_agencies


if __name__ == "__main__":
    # Make the parser
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "location", type=str, help="The location",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default=None,
        help="The output filepath to store the JSON file",
    )
    opts = parser.parse_args(sys.argv[1:])

    # Load the environment variables
    load_dotenv()

    # Add entries based on a location
    location_id = find_location_id(opts.location)
    transit_agencies = find_transit_agencies_by_location_id(location_id)

    # Add the default mongo db instance
    for transit_agency in transit_agencies:
        database_name = re.sub('[\s\\/$."]', "_", transit_agency["name"])
        transit_agency["mongodb_uri"] = "mongodb://localhost:27017/{}".format(
            database_name
        )

    print(json.dumps(transit_agencies))
