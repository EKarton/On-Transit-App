const Database = require("on-transit").Database;
const Config = require("../res/config");
const ScheduleCombiner = require("./schedules-combiner");

var db1 = null;
var db2 = null;

var closeConnections = async () => {
    await db1.closeDatabase();
    await db2.closeDatabase();
};

module.exports = function(){
    return new Promise(async (resolve, reject) => {
        try{
            db1 = new Database();
            db2 = new Database();
            await db1.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_2_DATABASE_NAME);
            await db2.connectToDatabase(Config.MONGODB_URL, Config.PROCESSED_STEP_3_DATABASE_NAME);

            let resolver1 = new ScheduleCombiner(db1, db2);
            await resolver1.processData();

            await closeConnections();
            resolve();
        }
        catch(error){
            await closeConnections();
            reject(error);
        }
    });
};

// Shutdown the app when the user types CTRL-C
process.on('SIGINT', async function() {
    await closeConnections();
    process.exit(-1);
});

process.on("exit", async function(){
    await closeConnections();
});
