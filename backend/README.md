# On Transit Backend Service

### Description
The On Transit Backend Service is a server-facing service that performs heavy computations, routing analysis, data analysis, and client-facing API endpoints for delivering transit predictions to client-facing applications.

### Table of Contents:
- Walkthrough
- Tech
- Installation
- Usage
- Credits
- License

### Walkthrough
This project consists of several components, including

### Tech
The On Transit Backend Service uses a number of open source projects to work properly:
* [node.js] - evented I/O for the backend
* [Express] - fast node.js network app framework
* [fast-csv] - fast CSV file parsing
* [gtfs-realtime-bindings] - fast GTFS data parser
* [unzip] - library for extracting zip files
* [request] - library for making HTTP requests

### Installation
The On Transit Backend Service requires [Node.js](https://nodejs.org/) v8+ to run.
After installing Node.js, install the dependencies and the devDependencies, and start the server:
```
$ cd On-Transit-App/backend
$ npm install
$ npm start
```
To stop the server, type in the following command:
```
$ npm stop
```

### Usage
Once the server is up, you are able to make many HTTP requests to the server.

##### Getting routes based on GPS location:
* **URL**:    
    api/v1/routes
* **Method**: 
    GET
* **URL Query Params:**
    lat=[double],
    long=[double], 
    radius=[double], 

**Sample Success Response:**
```
{
	status: "success",
	data: {
		routeIDs: [
			12131321231,
			as132d1as1d,
			87987889789
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
$ curl http://localhost:3000/api/v1/routes?lat=43.5540929&long=-79.7220238&radius=10
```

##### Getting routes details:
* **URL**:    
    api/v1/routes/:routeID
* **Method**: 
    GET
* **URL Params:**
    routeID=[string]

**Sample Success Response:**
```
{
	status: "success",
	data: {
		id: 12131321231,
		shortName: "109",
		longName: "Meadowvale Express",
		stops: [
			{ lat: , long: , time: },
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
$ curl http://localhost:3000/api/v1/12131321231
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
				routeID: 46456456,
				type: 3
			},
			...
			{ 
				id: 123123165, 
				routeID: 98789787,
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

### Credits
This project was made by Emilio Kartono

License
----

MIT

[//]

   [dill]: <https://github.com/joemccann/dillinger>
   [git-repo-url]: <https://github.com/joemccann/dillinger.git>
   [john gruber]: <http://daringfireball.net>
   [df1]: <http://daringfireball.net/projects/markdown/>
   [markdown-it]: <https://github.com/markdown-it/markdown-it>
   [Ace Editor]: <http://ace.ajax.org>
   [node.js]: <http://nodejs.org>
   [Twitter Bootstrap]: <http://twitter.github.com/bootstrap/>
   [jQuery]: <http://jquery.com>
   [@tjholowaychuk]: <http://twitter.com/tjholowaychuk>
   [express]: <http://expressjs.com>
   [AngularJS]: <http://angularjs.org>
   [Gulp]: <http://gulpjs.com>

   [PlDb]: <https://github.com/joemccann/dillinger/tree/master/plugins/dropbox/README.md>
   [PlGh]: <https://github.com/joemccann/dillinger/tree/master/plugins/github/README.md>
   [PlGd]: <https://github.com/joemccann/dillinger/tree/master/plugins/googledrive/README.md>
   [PlOd]: <https://github.com/joemccann/dillinger/tree/master/plugins/onedrive/README.md>
   [PlMe]: <https://github.com/joemccann/dillinger/tree/master/plugins/medium/README.md>
   [PlGa]: <https://github.com/RahulHP/dillinger/blob/master/plugins/googleanalytics/README.md>
