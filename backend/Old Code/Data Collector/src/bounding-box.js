class BoundingBox{
    constructor(minX, maxX, minY, maxY){
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
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