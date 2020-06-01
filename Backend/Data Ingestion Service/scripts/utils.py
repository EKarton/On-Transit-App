import os
import json

import requests


def get_mongodb_uri():
    return os.environ.get("MONGO_DB_TRANSITS_URL")


def get_transit_feeds_api_key():
    return os.environ.get("TRANSIT_FEEDS_API_KEY")


def get_latest_transit_agency_info_by_transit_id(transit_id):
    # Make API request
    url = "https://api.transitfeeds.com/v1/getFeedVersions"
    params = {
        "key": get_transit_feeds_api_key(),
        "feed": transit_id,
    }

    response = requests.get(url=url, params=params)
    data = response.json()

    name = None
    gtfs_url = None
    last_updated = None

    # Get the first result
    if "results" in data and "versions" in data["results"]:
        versions = data["results"]["versions"]

        if len(versions) > 0:
            latest_version = versions[0]

            if "f" in latest_version:
                feed_info = latest_version["f"]

                name = feed_info["t"] if "t" in feed_info else None
                gtfs_url = latest_version["url"] if "url" in latest_version else None
                last_updated = latest_version["ts"] if "ts" in latest_version else None

    return {
        "transit_id": transit_id,
        "name": name,
        "gtfs_url": gtfs_url,
        "last_updated": last_updated,
    }
