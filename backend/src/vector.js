class Vector{
    constructor(x, y){
        this._x = x;
        this._y = y;
    }

    get x(){
        return this._x;
    }

    get y(){
        return this._y;
    }

    set x(newX){
        this._x = newX;
    }

    set y(newY){
        this._y = newY;
    }

    getMagnitude(){
        return Math.sqrt(this.getMagnitudeSquared());
    }

    getMagnitudeSquared(){
        return this._x * this._x + this._y * this._y;
    }

    static dot(vector1, vector2){
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }

    static scale(vector, amount){
        return new Vector(vector.x * amount, vector.y * amount);
    }

    static add(vector1, vector2){
        return new Vector(vector1.x + vector2.x, vector1.y + vector2.y);
    }

    static substract(vector2, vector1){
        return new Vector(vector2.x - vector1.x, vector2.y - vector1.y);
    }

    /**
     * Performs the projection of b on a
     * @param {Vector} a A vector to project b on
     * @param {Vector} b A vector
     * @return {Vector} The projection of b on a 
     */
    static proj(a, b){
        var dotProduct = Vector.dot(a, b);
        var scaledProduct = dotProduct / a.getMagnitudeSquared();
        return Vector.scale(a, scaledProduct);        
    }
}

module.exports = Vector;