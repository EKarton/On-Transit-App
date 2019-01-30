const Cluster = require("cluster");
const OS = require("os");
const Process = require("process");
const worker = require("./trips-locator-worker");
const WebApp = require("./web-app");

if (Cluster.isMaster){

    // Make N copies of the same app with N being the number of CPUs
    let numCPUs = OS.cpus().length;
    for (let i = 0; i < numCPUs; i++){
        Cluster.fork();
    }

    // Fork the server again if it dies
    Cluster.on("exit", (worker) => {
        console.log("A worker has died! Relaunching app again!");
        Cluster.fork();
    });

    // Create a web api that will output the health of the application
    WebApp.run();
}
else{
    console.log("Child process #", Process.pid, " has spawned");
    worker.run();
}