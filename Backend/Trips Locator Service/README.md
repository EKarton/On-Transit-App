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

##### Getting trips based on GPS location
Clients needs to make HTTP requests to the application in order to get the trips based on their GPS location and time

**URL**: api/v1/trips

**Method**: GET

**URL Query Params:** lat=[double], long=[double], radius=[double], time=[HH:mm:ss]

- Note that the format [HH:mm:ss] means to specify the time in 24-hour format.
For instance, "13:04:55" means 55 seconds after 1:04PM 

**Sample Success Response Code:**
- Status code: 200 (Ok)

**Sample Success Response Body:**
```
{
    status: "success",
    data: {
        "tripIDs": {
            "5c4e158f3b9294327663817b": {
                "shortname": "46",
                "longname": "Tenth Line-Osprey",
                "headsign": "Northbound",
                "type": "3",
                "schedules": [
                    "5c4e15153b92943276631d19",
                    "5c4e15153b92943276631d20",
                    "5c4e15153b92943276631d21"
                ]
            },
            "5c4e158f3b9294327663817f": {
                "shortname": "46",
                "longname": "Tenth Line-Osprey",
                "headsign": "Southbound",
                "type": "3",
                "schedules": [
                    "5c4e15163b92943276631dd1"
                ]
            }
        }
    }
}
```

- Note that a trip can contain multiple trip schedules. For instance, a trip is a route (such as route 109 Northbound) while a schedule for route 109 Northbound represents a bus on that route.

**Sample Bad Request Failure Response Code:**
- Status code: 400 (Server Error)

**Sample Bad Request Failure Response Body:**
```
{
	status: "failure",
	data: {	}
	message: "<REASON_FOR_FAILURE>"
}
```

**Sample Server Failure Response Code:**
- Status code: 500 (Server Error)

**Sample Server Failure Response Body:**
```
{
	status: "failure",
	data: {	}
	message: "<REASON_FOR_FAILURE>"
}
```
**Sample Call:**
```
$ curl http://localhost:3000/api/v1/trips?lat=43.5540929&long=-79.7220238&time=11:50:00&radius=10
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

### Deployment to Heroku

##### Required Programs and Tools:
- Unix machine
- Node JS v8.0+ with NPM
- Heroku CLI

##### Step 1: Create a new service on Heroku
1. On Heroku, make a new service with a new service name.

##### Step 2: Set up the config file
1. Make a copy of the file "Deploy-to-Heroku-Template.sh" under the folder "Backend/Trips Locator Service/scripts", name it "Deploy-to-Heroku.sh", and save it in the same directory.
2. Open up "Deploy-to-Heroku.sh", edit the Heroku App name to the name you specified to the new service, and the temp folder.
3. Save the file

##### Step 3: Deploy on Heroku
1. On the terminal, change the directory to "Backend/Trips Locator Service/scripts" and run the command ```./Deploy-To-Heroku.sh```.
2. Follow the instructions on the terminal, and you should be done.

### Usage
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.

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
This project is protected under the GNU Licence. Please refer to LICENCE.txt for further details.