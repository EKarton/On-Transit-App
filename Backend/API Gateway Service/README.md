# On Transit App - API Gateway Service

### Description
This microservice is used to control the REST API requests to multiple microservices from one common endpoint. It is used for increased security.

### Table of Contents
- Overview
- Installation
- Usage
- Credits
- License

### Overview
This microservice is comprised of several clusters that work together to make it very scalable.
<div width="100%">
    <p align="center">
<img src="https://raw.githubusercontent.com/EKarton/On-Transit-App/master/Backend/API%20Gateway%20Service/docs/API%20Gateway%20Architecture.png" width="600px"/>
    </p>
</div>

On startup, it will launch N clusters (with N being the number of CPUs on the current machine). Each cluster will be running an Express app that will handle client requests. More information can be found on https://nodejs.org/api/cluster.html.

### Installation

##### Required Programs and Tools:
- Linux machine
- Node JS v8.0+ with NPM

##### Step 1: Install the packages
1. Open up the terminal and change the directory to the folder "Backend/API Gateway Service" relative to the project directory.
2. Type the command `npm install`

##### Step 2: Set up the config file
1. Make a copy of the file "config_template.js" under the folder "Backend/API Gateway Service/src/res", name it "config.js", and save it in the same directory.
2. Open up "config.js" and edit the port number for the app to use. Note that the port must be free to use. By default, the port number is 3000.

##### Step 3: Run the app
1. In the "Backend/API Gateway Service" folder of the project directory, type in the command `npm start`. It should launch N processes; one process as the master process, and N - 1 child processes (with N being the number of CPUs on your machine).
2. It is done!

### Usage
Once the server is up, you are able to make many HTTP requests to the server.

##### Getting trips based on GPS location:
* **URL**:    
    api/v1/trips
* **Method**: 
    GET
* **URL Query Params:**
    lat=[double],
    long=[double], 
    radius=[double], 
	time=[HH:mm:ss]

**Sample Success Response:**
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

**Sample Failure Response:**
```
{
	status: "failure",
	data: {	}
	message: "<REASON_FOR_FAILURE>"
}
```
**Sample Call:**
```
$ curl http://localhost:3000/api/v1/trips?lat=43.5540929&long=-79.7220238&radius=10&time=11:50:00
```

##### Getting trip details:
* **URL**:    
    api/v1/trip/:tripID
* **Method**: 
    GET
* **URL Params:**
    tripID=[string]

**Sample Success Response:**
```
{
	status: "success",
	data: {
		id: 12131321231,
		shortName: "109",
		longName: "Meadowvale Express",
		stops: [
			{ lat: , long: , name: , time: },
			...
		],
		path: [
			{ lat: , long: },
			...
		]
	}
}
```

**Sample Failure Response:**
```
{
	status: "failure",
	data: {	}
	message: "<REASON_FOR_FAILURE>"
}
```
**Sample Call:**
```
$ curl http://localhost:3000/api/v1/trips/12131321231
```

##### Getting vehicles based on GPS location:
* **URL**:    
    api/v1/vehicles
* **Method**: 
    GET
* **URL Query Params:**
    lat=[double]
    long=[double]
    radius=[double]
    

**Sample Success Response:**
```
{
	status: "success",
	data: {
		vehicles: [
			{ 
				id: 105454545, 
				tripID: 46456456,
				type: 3
			},
			...
			{ 
				id: 123123165, 
				tripID: 98789787,
				type: 3
			}
		]
	}
}
```

**Sample Failure Response:**
```
{
	status: "failure",
	data: {	}
	message: "<REASON_FOR_FAILURE>"
}
```
**Sample Call:**
```
$ curl http://localhost:3000/api/v1/vehicles?lat=43.5540929&long=-79.7220238&radius=10
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
Emilio Kartono, the sole creator of this project.

### Licence
Please note that this project is used for educational purposes and is not to be used commercially. We are not liable for any damages or changes done by this project.
This project is protected under the GNU Licence. Please refer to LICENCE.txt for further details.