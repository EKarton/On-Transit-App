class Circle{
    constructor(centerPt, radius){
        this._centerPt = centerPt;
        this._radius = radius;
    }

    get centerPt(){
        return this._centerPt;
    }

    get radius(){
        return this._radius;
    }

    set centerPt(newCenterPt){
        this._centerPt = newCenterPt;
    }

    set radius(newRadius){
        this._radius = newRadius;
    }
}

module.exports = Circle;