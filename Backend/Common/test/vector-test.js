const assert = require("assert");
const Vector = require("./../src/vector");

describe("constructor()", () => {
    it("should not reveal x and y", () => {
        var vector = new Vector(10, 20);
        assert.strictEqual(vector._x, 10);
        assert.strictEqual(vector._y, 20);        
    });
});

describe("set x() and set y()", () => {
    it("should set values of x and y", () => {
        var vector = new Vector(10, 20);
        vector.x = 30;
        vector.y = 40;
        assert.strictEqual(vector.x, 30);
        assert.strictEqual(vector.y, 40);        
    });
});

describe("get x() and get y()", () => {
    it("should get values of x and y", () => {
        var vector = new Vector(10, 20);
        assert.strictEqual(vector.x, 10);
        assert.strictEqual(vector.y, 20);        
    });
});

describe("getMagnitude()", () => {
    it("should return the length of the vector", () => {
        var vector = new Vector(1, Math.sqrt(3));
        assert.ok(vector.getMagnitude() - 2 < 0.0000000001);
    });
});

describe("getMagnitudeSquared()", () => {
    it("should return the length of the vector", () => {
        var vector = new Vector(1, Math.sqrt(3));
        assert.ok(vector.getMagnitudeSquared() - 4 < 0.0000000001);
    });
});

describe("Vector.dot()", () => {
    it("should return the dot product of two vectors", () => {
        var vector1 = new Vector(1, 3);
        var vector2 = new Vector(2, -5);
        assert.strictEqual(Vector.dot(vector1, vector2), -13);
    });
});

describe("Vector.scale()", () => {
    it("should return the reduced version of the same vector", () => {
        var vector = new Vector(1, 2);
        var newVector = Vector.scale(vector, 0.5);
        assert.strictEqual(newVector.x, 0.5);
        assert.strictEqual(newVector.y, 1);
    });

    it("should return the increased version of the same vector", () => {
        var vector = new Vector(1, 2);
        var newVector = Vector.scale(vector, 100);
        assert.strictEqual(newVector.x, 100);
        assert.strictEqual(newVector.y, 200);
    });
});

describe("Vector.add()", () => {
    it("should add two vectors together", () => {
        var vector1 = new Vector(1, 2);
        var vector2 = new Vector(5, 8);
        var newVector = Vector.add(vector1, vector2);
        assert.strictEqual(newVector.x, 6);
        assert.strictEqual(newVector.y, 10);
    });
});

describe("Vector.subtract()", () => {
    it("should subtract two vectors together", () => {
        var vector1 = new Vector(1, 20);
        var vector2 = new Vector(5, 8);
        var newVector = Vector.substract(vector1, vector2);
        assert.strictEqual(newVector.x, -4);
        assert.strictEqual(newVector.y, 12);
    });
});

describe("Vector.proj()", () => {
    it("should project two vectors (test 1)", () => {
        var vector1 = new Vector(1, 0);
        var vector2 = new Vector(1, 1);
        var newVector = Vector.proj(vector2, vector1);
        assert.strictEqual(newVector.x, 0.5);
        assert.strictEqual(newVector.y, 0.5);
    });
});