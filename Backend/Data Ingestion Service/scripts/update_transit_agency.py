''' What this script does:
    1. Look at the current transit feeds we have so far
    2. For each transit feed, compare the timestamp with the timestamp before it
    3. If there is a mismatch, run the spark_script.py
'''

def get_all_transit_ids_from_database(database):
    ''' Returns a list of all transit IDs in the database
    '''
    pass

def get_latest_transit_info_details(transit_id):
    ''' It fetches the latest transit info details given its transit ID

        It returns details like:
        {
            transit_id: <TRANSIT_ID>
            gtfs_url: <LINK-TO-GTFS-ZIP-FILE>,
            name: <NAME-OF-TRANSIT-AGENCY>,
            last_updated: <TIMESTAMP>
        }
    '''
    pass


def update_transit_info_details_in_database(transit_id, transit_info):
    pass

if __name__ == "__main__":
    pass
