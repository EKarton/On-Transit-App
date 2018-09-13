const Cluster = require("cluster");
const OS = require("os");
const Process = require("process");

const App = require("./app");

if (Cluster.isMaster){

    // Make N copies of the same app with N being the number of CPUs
    var numCPUs = OS.cpus().length;
    for (var i = 0; i < numCPUs; i++){
        Cluster.fork();
    }

    // Fork the server again if it dies
    Cluster.on("exit", (worker) => {
        console.log("A worker has died! Relaunching app again!");
        Cluster.fork();
    });
}
else{
    console.log("Child process #", Process.pid, " has spawned");
    
    // Start the application
    var app = new App();
    app.run();
}