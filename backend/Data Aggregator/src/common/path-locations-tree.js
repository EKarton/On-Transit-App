const rtree = require("rbush");
const knn = require("rbush-knn");

class PathLocationBag{
    constructor(jsonTreeData){
        if (jsonForm){
            this._tree = rtree(16).fromJSON(jsonTreeData);
        }
        else{
            this._tree = rtree(16);
        }
    }

    _createPayload(location){
        var latitude = location.latitude;
        var longitude = location.longitude;

        // We need to scale the latitude and longitude so that the rtree is more accurate
        var sLatitude = parseInt(latitude * 1000000, 10);
        var sLongitude = parseInt(longitude * 1000000, 10);

        // We want to make a 6m * 6m bounding box for our position
        var minLongitude = sLongitude - 6;
        var maxLongitude = sLongitude + 6;
        var minLatitude = sLatitude - 6;
        var maxLatitude = sLatitude + 6;

        // Create the payload to be added to the tree
        var payload = {
            minX: minLongitude,
            maxX: maxLongitude,
            minY: minLatitude,
            maxY: maxLatitude
        };

        // TODO: Add additional properties to the payload from location
        return payload;
    }

    addLocation(location){
        var payload = this._createPayload(location);
        this._tree.insert(payload);
    }

    addLocations(locations){
        var payloads = [];
        locations.array.forEach(location => {
            var payload = this._createPayload(location);
            payloads.push(payload);
        });

        this._tree.load(payloads);
    }

    getLocation(location){
        var latitude = location.latitude;
        var longitude = location.longitude;

        // We need to scale the latitude and longitude so that the rtree is more accurate
        var sLatitude = parseInt(latitude * 1000000, 10);
        var sLongitude = parseInt(longitude * 1000000, 10);

        var neighbors = knn(tree, sLongitude, sLatitude, 1, (payload) => {
            var sLatitude_Payload = (payload.minY + payload.maxY) / 2;
            var sLongitude_Payload = (payload.minX + payload.maxX) / 2;
            return sLatitude_Payload == sLatitude && sLongitude_Payload == sLongitude;
        });
        return neighbors[0];
    }

    getNearestLocation(location){
        return this.getNearestLocations(location, 1);
    }

    getNearestLocations(location, amount){

    }

    getAllLocations(){
        return this._tree.all();
    }

    getJson(){
        return this._tree.toJSON();
    }
}

module.exports = PathLocationBag;