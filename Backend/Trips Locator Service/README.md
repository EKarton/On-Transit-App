# On Transit App - Trips Locator Microservice

### Description
This microservice tries to find the most possible bus route a user could be based on the user's GPS location and time.

### Table of Contents
- How it works
- Installation
- Usage
- Deploying on Heroku
- Credits
- License

### How it works:
* Suppose we have the user's GPS location and time
* We first find all transit agencies the user could be based on the transit agencies' bounding box
* Next, for each transit agency, we find the nearest paths to the user
* For each nearest path, we find all the trip schedules associated with that path
    * We also find which two path locations the user could be based on the user's GPS location (by finding which line segment in the path yields the minimum projection to the user's GPS location)
* For each trip schedule, we try to find which two stops the user could be based on the user's time
* For the two stops, we find which two path locations each stop could be based on the stop's GPS location (similar to how we used it to the user's GPS location)
* Then, if the two path locations of the user's GPS location is sandwitched between the two path locations of their stops

### Installation

##### Required Programs and Tools:
- Linux / Unix machine
- Node JS v8.0+ with NPM

##### Steps:
1. Open the terminal and run the command ```npm install```
2. Make a copy of ```.env-template```, name it ```.env```, and save it
3. Change the parameters in ```.env``` file
4. Run the command ```npm start```

### Usage
Once the server is up, you are able to make many HTTP requests to the server, including:
* Getting trips based on GPS location
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
    docker build -t trips_locator_service .
    docker tag trips_locator_service registry.heroku.com/on-transit-app-trips-locator/web
    docker push registry.heroku.com/on-transit-app-trips-locator/web
    heroku container:release web --app on-transit-app-trips-locator
    ```

### Credits
Emilio Kartono

### Licence
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.
This project is protected under the GNU Licence. Please refer to LICENCE.txt in the root directory of this repository for further details.