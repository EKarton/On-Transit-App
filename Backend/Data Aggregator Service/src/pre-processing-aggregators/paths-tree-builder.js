const rtree = require("rbush");
const Database = require("on-transit").Database;

class PathsTreeBuilder{

    constructor(rawDatabase, processedDatabase){
        this._rawDatabase = rawDatabase;
        this._processedDatabase = processedDatabase;
    }

    async getRTree(trip){
        var shapeID = trip.shapeID;
        var cursor = await this._rawDatabase.getObjects("raw-shapes", { 
            $query: { "shapeID": shapeID }, $orderby: { sequence: 1 } 
        });

        var tree = rtree(16);

        var items = [];
        while (await cursor.hasNext()){
            var shapeData = await cursor.next();
            var latitude = shapeData.latitude;
            var longitude = shapeData.longitude;
            var sequence = shapeData.sequence;

            var item = {
                minX: longitude * 1000000 - 6,
                minY: latitude * 1000000 - 6,
                maxX: longitude * 1000000 + 6,
                maxY: latitude * 1000000 + 6,
                sequence: sequence,
            };
            items.push(item);
        }     
        tree.load(items);
        return tree;
    }

    processData(){
        return new Promise(async (resolve, reject) => {
            try{
                var cursor = await this._rawDatabase.getObjects("raw-trips", {});
                while (await cursor.hasNext()){
                    var trip = await cursor.next();
                    var shapeID = trip.shapeID;

                    // Skip it if it already has an entry
                    var existingTree = await this._processedDatabase.getObject("path-trees", { "_id": shapeID });
                    if (!existingTree){
                        var pathTree = await this.getRTree(trip);

                        var dbObject = {
                            _id: shapeID,
                            tree: pathTree.toJSON()
                        };

                        await this._processedDatabase.saveObjectToDatabase("path-trees", dbObject);
                    }
                }
                console.log("Finished aggregating path data");
                resolve();
            }
            catch(error){
                reject(error);
            }
        });
    }
}

module.exports = PathsTreeBuilder;