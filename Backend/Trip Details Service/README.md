# On Transit App - Trip Details Service

### Description
This microservice is used to obtain the details of a trip, including its stop schedules, stop locations, the path that the public transportation vehicle will take, route numbers, and route names.

### Table of Contents
- Installation
- Usage
- Credits
- License

### Installation

##### Required Programs and Tools:
- Linux machine
- Node JS v8.0+ with NPM

##### Steps:
1. Open the terminal and run the command ```npm install```
2. Make a copy of ".env-template", name it ".env", and save it
3. Run the command ```npm start```

### Usage
Once the server is up, you are able to make many HTTP requests to the server, including:
* Getting trip details
* Viewing the health of microservices

#### Getting trip details:
* Request requirements:
    * URL:
        * Format: ```api/v1/transits/:transitID/trips/:tripID/schedules/:scheduleID```
        * Example: ```http://localhost:5002/api/v1/transits/5ed48f83fa6014f5944ae5ad/trips/20058455/schedules/5ed490a3b2dba619d463a1a8```
		* Note:
			* The ```:transitID```, ```:tripID```, and ```:scheduleID``` could be found from the ```api/v1/trips?``` endpoint [see more at Trips Locator Service](https://github.com/EKarton/On-Transit-App/tree/master/Backend/Trips%20Locator%20Service)
    * Method:
        * GET

* Sample Success Response:
    ```json
    {
		"status": "success",
		"data": {
			"transitName": "MiWay GTFS",
			"shortName": "45",
			"longName": "Winston Churchill",
			"headSign": "Northbound",
			"type": "3",
			"path": [
				{
					"lat": 43.51297,
					"long": -79.63313
				},
				...
				{
					"lat": 43.58379,
					"long": -79.75894
				}
			],
			"stops": [
				{
					"lat": 43.513,
					"long": -79.63313,
					"name": "Clarkson Go Station Platform 6",
					"time": 62880
				},
				...
				{
					"lat": 43.58378,
					"long": -79.75902,
					"name": "Meadowvale Town Centre Drop Off",
					"time": 65940
				}
			]
		}
	}
    ```
	Note:
	* The ```...``` means that there is more data (in the several hundreds)
	* Path locations and the stop locations are ordered in the direction of the bus / train's travel
	* Times are in 24-hour format
	* Times are encoded in HH * 3600 + MM * 60 + SS format in the local time of the transit agency
		* Ex: 19:10:01 = 19 * 3600 + 10 * 60 + 1 = 69001

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
        * Format: ```api/v1/health```
        * Example: ```http://localhost:5002/api/v1/health```
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