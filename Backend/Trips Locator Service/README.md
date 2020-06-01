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
        * Example: ```http://localhost:5001/api/v1/trips?lat=43.656864&long=-79.399697&time=10:30:00&radius=1```
    * Method:
        * GET
    * Required URL Query Params:
        * lat=[double],
        * long=[double], 
        * radius=[double], 
        * time=[HH:mm:ss]

* Sample Success Response with Nearby Trips:
    ```json
    {
        "status": "success",
        "data": {
            "5ed48f83fa6014f5944ae5ad": {
                "name": "MiWay GTFS",
                "trips": {
                    "20057802": {
                        "shortname": "34",
                        "longname": "Credit Valley",
                        "headsign": "Westbound",
                        "type": "3",
                        "schedules": [
                            "5ed490a2b2dba619d4638d59",
                            "5ed490a3b2dba619d463a490"
                        ]
                    },
                    "20058483": {
                        "shortname": "45",
                        "longname": "Winston Churchill",
                        "headsign": "Southbound",
                        "type": "3",
                        "schedules": [
                            "5ed490a2b2dba619d4639081",
                            "5ed490a4b2dba619d463aac0",
                            "5ed490a4b2dba619d463ada8",
                            "5ed490a5b2dba619d463bda5"
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
        * Format: ```api/v1/health```
        * Example: ```http://localhost:5001/api/v1/health```
    * Method:
        * GET

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
    ```bash
    heroku auth:login
    heroku container:login
    ```

2. Run the following:
    ```bash
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