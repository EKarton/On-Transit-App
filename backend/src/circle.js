class Circle{
    constructor(centerPt, radius){
        this.centerPt = centerPt;
        this.radius = radius;
    }

    get centerPt(){
        return this.centerPt;
    }

    get radius(){
        return this.radius;
    }
}

module.exports = Circle;