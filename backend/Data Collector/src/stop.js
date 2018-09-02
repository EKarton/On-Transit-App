class Stop{
    constructor(locationID, name){
        this._locationID = locationID;
        this._name = name;
    }

    get locationID(){
        return this._locationID;
    }

    set locationID(newLocationID){
        this._locationID = newLocationID;
    }

    get name(){
        return this._name;
    }

    set name(newName){
        this._name = newName;
    }
}

module.exports = Stop;