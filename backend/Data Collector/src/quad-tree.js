
const MAX_LEVELS = 10;
const MAX_NODES = 9;

class QuadTree{
    constructor(boundingBox, level = 0){
        this._boundingBox = boundingBox;

        this._quadTrees = [];
        this._locationIDs = [];
        this._level = 0;
    }

    add(locationID, locationBag){

        // Update the bounding box
        if (locationData.latitude < this._boundingBox.minY)
            this._boundingBox.minY = locationData.latitude;

        if (locationData.latitude > this._boundingBox.maxY)
            this._boundingBox.maxY = locationData.latitude;

        if (locationData.longitude < this._boundingBox.minX)
            this._boundingBox.minX = locationData.longitude;

        if (locationData.longitude < this._boundingBox.maxX)
            this._boundingBox.maxX = locationData.longitude;

        // Add the ID to the list of IDs
        this._locationIDs.push(locationID);

        if(this._locationIDs.length > MAX_NODES && this._level < MAX_LEVELS){
            var midLatitude = (this._boundingBox.maxY + this._boundingBox.minY) / 2;
            var midLongitude = (this._boundingBox.maxX + this._boundingBox.minX) / 2;

            // Define the four quadrants
            var topLeftBox = new BoundingBox(this._boundingBox.minY, midLatitude, this._boundingBox.minX, midLongitude);
            var topRightBox = new BoundingBox(this._boundingBox.minY, midLatitude, midLongitude, this._boundingBox.maxX);
            var bttmLeftBox = new BoundingBox(midLatitude, this._boundingBox.maxY, this._boundingBox.minX, midLongitude);
            var bttmRightBox = new BoundingBox(midLatitude, this._boundingBox.maxY, midLongitude, this._boundingBox.maxX);

            // Create four more quadtrees
            var topLeftQuadtree = new QuadTree(topLeftBox, this._level + 1);
            var topRightQuadtree = new QuadTree(topRightBox, this._level + 1);
            var bttmLeftQuadtree = new QuadTree(bttmLeftBox, this._level + 1);
            var bttmRightQuadtree = new QuadTree(bttmRightBox, this._level + 1);
            this._quadTrees = [topLeftQuadtree, topRightQuadtree, bttmLeftQuadtree, bttmRightQuadtree];

            this._locationIDs.forEach(locationID => {
                var location = locationBag.getLocation(locationID);

                // Check if it goes on first bottom half or second upper half
                if (location.latitude < midLatitude){
                    if (location.longitude < midLongitude){
                        topLeftQuadtree.add(locationID, locationBag);
                    }
                    else{
                        topRightQuadtree.add(locationID, locationBag);
                    }
                }
                else{
                    if (location.longitude < midLongitude){
                        bttmLeftQuadtree.add(locationID, locationBag);
                    }
                    else{
                        bttmRightQuadtree.add(locationID, locationBag);
                    }
                }
            });
            this._locationIDs = [];
        }
    }

    delete(locationID, locationData){

    }

    findLocations(boundingBox){

        // Basecase: If it is a leaf
        if (this._quadTrees.length() == 0){
            return this._locationIDs;
        }

        // Recurse
        var foundLocationIDs = [];
        this._quadTrees.forEach(quadTree => {
            if (quadTree._boundingBox.isIntersectWith(boundingBox)){
                foundLocationIDs.push(quadTree.findLocations(boundingBox));
            }
        });

        return foundLocationIDs;
    }
}