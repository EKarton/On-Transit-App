const App = require("./app");
const process = require("process");

// Launch only one instance of the app.
var app = new App();
app.run();

// Shutdown the app when the user types CTRL-C
process.on('SIGINT', async function() {
    await app.shutdown();
    process.exit(-1);
});

process.on("exit", async function(){
    await app.shutdown();
});

