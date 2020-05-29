# On Transit App - Data Ingestion Service

### Description
This application is used to discover transit feeds, download, parse, and aggregate large GTFS data into a database. It utilizes Apache Spark to process the data efficiently. It also uses transitfeeds.com to discover transit feeds.

### Table of Contents
- Overview
- Installation
- Usage
- Credits
- License

### Overview
Below is a diagram of how data gets processed from the source to the data used in production.
Data moves from the source to production in order from left to right in the diagram below.


### Installation
Required Programs and Tools:
- Linux / Unix machine
- Python 3
- Pip3
- Apache Spark
- MongoDB (optional)

Steps:
1. Set up the environment
    * Run the commands:
        ```
        virtualenv -p python3 .
        pip3 install -r requirements.txt
        source bin/activate
        ```

2. Discover feeds based on a location
    * For example, if we want to find all feeds in Toronto, run the command:
        ```
        python3 discover_transit_agencies.py -o feeds.json
        ```
    * It will save the feeds to a file (in the example above, to a file named ```feeds.json```)

3. Add an entry to the transit agency
    * Run the command:
        ```
        python3 add_transit_agency.py -i feeds.json
        ```
    * It will add an entry to the database from the file ```feeds.json```

4. Download and parse GTFS data:
    * Run the command:
        ```
        python3 build_transit_data.py <TRANSIT_ID> <OUTPUT_MONGO_URL>
        ```

        where ```<TRANSIT_ID>``` is the ID of your transit agency, and ```<OUTPUT_MONGO_DB>``` is the mongo db uri to store the parsed GTFS data

    * Note: 
        * You can find the transit ID in the ```feeds.json``` file

5. Updating the transit data [optional]
    * Run the commands:
        ```
        python3 update_transit_agency.py <TRANSIT_ID>
        python3 build_transit_data.py <TRANSIT_ID> <OUTPUT_MONGO_URL>
        ```
        where ```<TRANSIT_ID>``` is the ID of your transit agency

    * Note:
        * You can find the transit ID in your database


### Usage
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.

### Credits
Emilio Kartono

### Licence
This project is protected under the GNU Licence. Please refer to LICENCE.txt for further details.