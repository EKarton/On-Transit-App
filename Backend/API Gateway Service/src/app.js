const express = require("express");
const request = require("request-promise-native");
const process = require("process");

const config = require("./res/config");

/**
 * A class used to represent the entire application with handling and responding to 
 * HTTP requests.
 */
class App{

    /**
     * Obtains the resource from a microservice through its url and 
     * sends the microservice's response to the client.
     * @param {express.Request} req The client's request object
     * @param {express.Response} res The client's response object
     * @param {string} uri The url to get the resource via microservices
     */
    _handleRequest(req, res, uri){
        request(uri)
            .then(message => {
                res.setHeader('Content-Type', 'application/json');
                res.send(message);  
            })
            .catch(error => {
                console.log(error);
                var responseBody = {
                    status: "failure",
                    data: {},
                    message: JSON.stringify(error)
                };

                response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify(responseBody));    
            });
    }

    _obtainServiceHealth(uri){
        let options = {
            method: "GET",
            uri: uri,
            resolveWithFullResponse: true
        };
        return request(options);
    }

    /**
     * Runs the application
     */
    run(){
        var app = express();
        var server_port = process.env.YOUR_PORT || process.env.PORT || config.DEFAULT_PORT;
        var server_host = process.env.YOUR_HOST || '0.0.0.0';

        // Enable cors from anywhere
        app.use(function(req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        /**
         * Returns a set of trip IDs that are close to a location by a certain radius
         * Example of HTTP GET request:
         * https://localhost:3000/api/v1/trips?lat=43&long=-73.6&time=17:50:00&radius=50
         */
        app.get("/api/v1/trips", (req, res) => {
            var latitude = req.query.lat;
            var longitude = req.query.long;
            var time = req.query.time;
            var radius = req.query.radius;

            console.log("API Gateway Service: Request for finding nearby trips received on process #", process.pid);
            console.log(`lat:${latitude},long:${longitude},time:${time},radius:${radius}`);

            var uri = `${config.TRIPS_LOCATOR_SERVICE_URL}/api/v1/trips?lat=${latitude}&long=${longitude}&time=${time}&radius=${radius}`;
            this._handleRequest(req, res, uri);
        });

        /**
        * Returns the trip details given its trip ID.
        * Example of HTTP GET request:
        * http://localhost:3000/api/v1/trips/123456
        */
        app.get("/api/v1/trips/:tripID/schedules/:scheduleID", (req, res) => {
            var tripID = req.params.tripID;
            var scheduleID = req.params.scheduleID;

            console.log("API Gateway Service: Request for getting trip details received on process #", process.pid);

            var uri = `${config.TRIP_DETAILS_SERVICE_URL}/api/v1/trips/${tripID}/schedules/${scheduleID}`;
            this._handleRequest(req, res, uri);
        });

        /**
         * Returns the vehicles and its position close to a location by a certain radius
         * Example of HTTP request:
         * http://localhost:3000/api/v1/vehicles?lat=43&long=-73.6&radius=40
         */
        app.get("/api/v1/vehicles", (req, res) => {
            var latitude = req.query.lat;
            var longitude = req.query.long;
            var radius = req.query.radius;

            console.log("API Gateway Service: Request for finding vehicle received on process #", process.pid);

            var uri = `${config.VEHICLES_LOCATOR_URL}/api/v1/vehicles?lat=${latitude}&long=${longitude}&radius=${radius}`;            
            this._handleRequest(req, res, uri);
        });

        app.get("/api/v1/health", (req, res) => {
            let tripsLocatorUrl = `${config.TRIPS_LOCATOR_SERVICE_URL}/api/v1/health`;
            let tripDetailsUrl = `${config.TRIP_DETAILS_SERVICE_URL}/api/v1/health`;

            let tripsLocatorRequest = this._obtainServiceHealth(tripsLocatorUrl);
            let tripDetailsRequest = this._obtainServiceHealth(tripDetailsUrl);
            Promise.all([tripsLocatorRequest, tripDetailsRequest])
                .then(results => {                    
                    let isTripsLocatorOk = results[0].statusCode == 200;
                    let isTripDetailsOk = results[1].statusCode == 200;

                    if (isTripsLocatorOk && isTripDetailsOk){
                        res.status(200).send("OK");
                    }
                    else{
                        res.status(501).send("FAILURE");
                    }
                })
                .catch(error => {
                    res.status(501).send("FAILURE");
                });
        });

        app.listen(server_port, server_host, function() {
            console.log('Listening on port %d', server_port);
        });
    }
}

module.exports = App;

