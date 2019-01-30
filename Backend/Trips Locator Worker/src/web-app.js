const express = require("express");
const process = require("process");
const Config = require("./res/config");

/**
 * A class used to represent the entire application with handling and responding to 
 * HTTP requests.
 */
module.exports = {

    run(){
        let app = express();
        let server_port = process.env.YOUR_PORT || process.env.PORT || Config.WEB_APP_DEFAULT_PORT;
        let server_host = process.env.YOUR_HOST || '0.0.0.0';

        app.get("/api/v1/health", (req, res) => {
            res.status(200).send("OK");
        });

        app.listen(server_port, server_host, function() {
            console.log('Listening on port %d', server_port);
        });
    }
}

