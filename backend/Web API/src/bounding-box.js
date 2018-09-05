class BoundingBox{
    constructor(minX, maxX, minY, maxY){
        this._minX = minX;
        this._maxX = maxX;
        this._minY = minY;
        this._maxY = maxY;
    }

    get minX(){
        return this._minX;
    }

    set minX(newMinX){
        this._minX = newMinX;
    }

    get maxX(){
        return this._maxX;
    }

    set maxX(newMaxX){
        this._maxX = newMaxX;
    }

    get minY(){
        return this._minY;
    }

    set minY(newMinY){
        this._minY = newMinY;
    }

    get maxY(){
        return this._maxY;
    }

    set maxY(newMaxY){
        this._maxY = newMaxY;
    }

    isIntersectWith(boundingBox){
        if (this.maxX < boundingBox.minX) // If this is left of boundingBox
            return false;
        
        if (this.minX > boundingBox.maxX) // If this is right of boundingBox
            return false;
        
        if (this.maxY < boundingBox.minY) // If this is below boundingBox
            return false;
        
        if (this.minY >= boundingBox.maxY) // If this is above boundingBox
            return false;
        
        return true;
    }
}

module.exports = BoundingBox;