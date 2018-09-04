const Vector = require("./vector");

/**
 * A class used to perform geometrical computations, such as 
 * detecting if two objects are intersecting, or converting degrees to radians.
 */
class Geometry{

    /**
     * Converts an angle from degrees to radians.
     * @param {number} degrees Angle in degrees
     * @return {number} Angle in radians
     */
    static convertDegreesToRadians(degrees){
        return degrees * Math.PI / 180;
    }

    /**
     * Determines if a line segment intersects a circle
     * @param {Vector} point1 An endpoint to the line segment
     * @param {Vector} point2 The other endpoint to the line segment
     * @param {Circle} circle A circle
     * @return {boolean} Returns true if the line segment intersects the circle; else false
     */
    static isLineSegmentIntersectCircle(point1, point2, circle){
        // Compute the vectors from point1 to point2, and from point1 to the circle's centerPt
        var vector1 = Vector.substract(point2, point1);
        var vector2 = Vector.substract(circle.centerPt, point1);

        // Compute the projection of vector2 on vector1
        var projection = Vector.proj(vector1, vector2);

        // Compute the actual coordinate of vector2 on vector1
        var projectionCoordinate = Vector.add(projection, point1);

        if (projection.getMagnitudeSquared() <= vector1.getMagnitudeSquared()){
            
            // Compute the length from circle's center pt to the projection coordinate
            var amountProjected = Vector.substract(projectionCoordinate, circle.centerPt)
                .getMagnitudeSquared();

            if (amountProjected < circle.radius * circle.radius){
                return true;
            }
        }
        return false;
    }

    /**
     * Returns true if the point is in the circle (including circle edges); 
     * else returns false
     * @param {Vector} point A point
     * @param {Circle} circle A circle
     * @return {boolean} Returns true if it is in the circle; else false. 
     */
    static isPointInCircle(point, circle){
        var delta = Vector.substract(point, circle.centerPt);
        return delta.getMagnitudeSquared() <= circle.radius * circle.radius;
    }
}

module.exports = Geometry;