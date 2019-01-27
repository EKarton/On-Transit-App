const Database = require("on-transit").Database;
const Config = require("../res/config");
const DuplicateSchedulesRemover = require("./duplicated-schedules-remover");
const DuplicatedTripsRemover = require("./duplicated-trips-remover");
const DuplicatedPathsRemover = require("./duplicated-paths-remover");

var oldDbs = [];
var newDbs = [];

var closeDatabaseConnections = async () => {
    for (let i = 0; i < 3; i++){
        await oldDbs[i].closeDatabase();
        await newDbs[i].closeDatabase();
    }
};

module.exports = function(){
    return new Promise(async (resolve, reject) => {
        try{
            for (let i = 0; i < 3; i++){
                let oldDb = new Database();
                await oldDb.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_1_DATABASE_NAME);
                oldDbs.push(oldDb);
            }

            for (let i = 0; i < 3; i++){
                let newDb = new Database();
                await newDb.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_2_DATABASE_NAME);
                newDbs.push(newDb);
            }

            let resolver1 = new DuplicateSchedulesRemover(oldDbs[0], newDbs[0]);
            let resolver2 = new DuplicatedPathsRemover(oldDbs[1], newDbs[1]);
            let resolver3 = new DuplicatedTripsRemover(oldDbs[2], newDbs[2]);

            await resolver1.processData();
            console.log("Finished removing duplicated schedules");

            await resolver2.processData();
            console.log("Finished removing duplicated paths");

            await resolver3.processData();
            console.log("Finished removing duplicated trips");

            await closeDatabaseConnections();
            resolve();
        }
        catch(error){
            await closeDatabaseConnections();
            console.error(error);
            reject(error);
        }
    });
};

// Shutdown the app when the user types CTRL-C
process.on('SIGINT', async function() {
    await closeDatabaseConnections();
    process.exit(-1);
});

process.on("exit", async function(){
    await closeDatabaseConnections();
});
