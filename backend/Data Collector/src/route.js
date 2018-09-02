const Stops = require("./stops");
const Path = require("./path");

class Route{
    constructor(){
        this.agencyID = "";
        this.shortName = "";
        this.longName = "";
        this.type = 0;
        this.stops = new Stops();
        this.path = new Path();
    }
}

module.exports = Route;