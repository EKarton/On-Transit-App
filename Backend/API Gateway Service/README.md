# On Transit App - API Gateway Service

### Description
This microservice is used to control the REST API requests to multiple microservices from one common endpoint. It routes traffic to the appropriate microservices.

### Table of Contents
- Installation
- Usage
- Credits
- License

### Installation

##### Required Programs and Tools:
- Linux / Unix machine
- Node JS v8.0+ with NPM

##### Steps:
1. Open the terminal and run the command ```npm install```
2. Make a copy of ".env-template", name it ".env", and save it
3. Run the command ```npm start```

### Usage
Once the server is up, you are able to make many HTTP requests to the server, including:
* Getting trips based on GPS location
* Getting trip details
* Viewing the health of microservices

#### Getting trips based on GPS location:

* Request requirements:
    * URL:
        * Format: ```api/v1/trips?lat=LATITUDE&long=LONGITUDE&time=TIME&radius=RADIUS```
        * Example: ```http://localhost:5000/api/v1/trips?lat=43.656864&long=-79.399697&time=10:30:00&radius=1```
    * Method:
        * GET
    * URL Query Params:
        * lat=[double],
        * long=[double], 
        * radius=[double], 
        * time=[HH:mm:ss]

* Sample Success Response with Nearby Trips:
    ```json
    {
        "status": "success",
        "data": {
            "5ed1e9d7ffe1942ce10ffea6": {
                "name": "TTC GTFS",
                "trips": {
                    "40150630": {
                        "shortname": "510",
                        "longname": "SPADINA",
                        "headsign": "SOUTH - 510B SPADINA towards QUEENS QUAY",
                        "type": "0",
                        "schedules": [
                            "5ed1f624f3f68636608e4d6e",
                            "5ed1f627f3f68636608eaeb1"
                        ]
                    },
                    "40150637": {
                        "shortname": "510",
                        "longname": "SPADINA",
                        "headsign": "SOUTH - 510A SPADINA towards UNION STATION",
                        "type": "0",
                        "schedules": [
                            "5ed1f625f3f68636608e613f",
                            "5ed1f625f3f68636608e6d61",
                            "5ed1f62af3f68636608f12c2"
                        ]
                    },
                    "40150824": {
                        "shortname": "510",
                        "longname": "SPADINA",
                        "headsign": "NORTH - 510 SPADINA towards SPADINA STATION",
                        "type": "0",
                        "schedules": [
                            "5ed1f625f3f68636608e68f7",
                            "5ed1f625f3f68636608e71fe"
                        ]
                    },
                    "40150828": {
                        "shortname": "510",
                        "longname": "SPADINA",
                        "headsign": "NORTH - 510 SPADINA towards SPADINA STATION",
                        "type": "0",
                        "schedules": [
                            "5ed1f628f3f68636608edfbc"
                        ]
                    },
                    "40150892": {
                        "shortname": "510",
                        "longname": "SPADINA",
                        "headsign": "NORTH - 510 SPADINA towards SPADINA STATION",
                        "type": "0",
                        "schedules": [
                            "5ed1f62af3f68636608f281e"
                        ]
                    }
                }
            }
        }
    }
    ```

* Sample Success Response with No Nearby Trips:
    ```json
    {
        "status": "success",
        "data": {}
    }
    ```

* Sample Failure Response:**
    ```json
    {
        "status": "failure",
        "message": "Cannot read property 'name' of null"
    }
    ```

#### Getting trip details:
* Request requirements:
    * URL:
        * Format: ```api/v1/transits/:transitID/trips/:tripID/schedules/:scheduleID```
        * Example: ```http://localhost:5000/api/v1/transits/5ed1ade90d819af6f62c22f2/trips/40150630/schedules/5ed1be3af3f6860e0d6bb7bc```
    * Method:
        * GET

* Sample Success Response:
    ```json
    {
        "status": "success",
        "data": {
            "transitName": "TTC GTFS",
            "shortName": "510",
            "longName": "SPADINA",
            "headSign": "SOUTH - 510B SPADINA towards QUEENS QUAY",
            "type": "0",
            "path": [
                {
                    "lat": 43.66735,
                    "long": -79.40315
                },
                ...
                {
                    "lat": 43.66721,
                    "long": -79.40389
                }
            ],
            "stops": [
                {
                    "lat": 43.66722,
                    "long": -79.40367,
                    "name": "SPADINA STATION",
                    "time": 35950
                }
                ...
                {
                    "lat": 43.63842,
                    "long": -79.39184,
                    "name": "QUEENS QUAY LOOP AT LOWER SPADINA AVE",
                    "time": 37277
                }
            ]
        }
    }
    ```

* Sample Failure Response:**
    ```json
    {
        "status": "failure",
        "message": "Trip is not found"
    }
    ```

#### Getting the health of current service and other microservices
* Request requirements:
    * URL:
        * Format: ```api/v1/trips?lat=LATITUDE&long=LONGITUDE&time=TIME&radius=RADIUS```
        * Example: ```http://localhost:5000/api/v1/trips?lat=43.656864&long=-79.399697&time=10:30:00&radius=1```
    * Method:
        * GET
    * URL Query Params:
        * lat=[double],
        * long=[double], 
        * radius=[double], 
        * time=[HH:mm:ss]

* Sample Success Response:
    ```
    OK
    ```

* Sample Failure Response:**
    ```
    FAILURE
    ```

### Deploying on Heroku
1. Authenticate with Heroku:
    ```
    heroku auth:login
    heroku container:login
    ```

2. Run the following:
    ```
    docker build -t api_gateway_service .
    docker tag api_gateway_service registry.heroku.com/on-transit-app-api-gateway/web
    docker push registry.heroku.com/on-transit-app-api-gateway/web
    heroku container:release web --app on-transit-app-api-gateway
    ```

### Credits
Emilio Kartono

### Licence
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.
This project is protected under the GNU Licence. Please refer to LICENCE.txt in the root directory of this repository for further details.