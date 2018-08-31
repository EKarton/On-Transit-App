const assert = require("assert");
const Geometry = require("./../src/geometry");
const Vector = require("./../src/vector");
const Circle = require("./../src/circle");

describe("Geometry.isPointInCircle()", () => {
    it("Test 1", () => {
        var point =  new Vector(0, 0);
        var circle = new Circle(new Vector(0, 0), 3);
        var result = Geometry.isPointInCircle(point, circle);
        assert.equal(result, true);
    });


    it("Test 2", () => {
        var point =  new Vector(0, 0);
        var circle = new Circle(new Vector(0, 0), 0);
        var result = Geometry.isPointInCircle(point, circle);
        assert.equal(result, true);
    });

    it("Test 3", () => {
        var point =  new Vector(3, 5);
        var circle = new Circle(new Vector(2, 5), 1);
        var result = Geometry.isPointInCircle(point, circle);
        assert.equal(result, true);
    });

    it("Test 4", () => {
        var point =  new Vector(1.5, 0);
        var circle = new Circle(new Vector(-9, 10), 1);
        var result = Geometry.isPointInCircle(point, circle);
        assert.notEqual(result, true);
    });
});

describe("Geometry.isLineSegmentIntersectCircle()", () => {

    // Small line segment that is outside of circle
    it("Test 1", () => {
        var point1 =  new Vector(2, -8);
        var point2 =  new Vector(2, -10);
        var circle = new Circle(new Vector(4, -9), Math.sqrt(3));
        var result = Geometry.isLineSegmentIntersectCircle(point1, point2, circle);
        assert.equal(result, false);
    });

    // Small line segment that is outside of circle
    it("Test 2", () => {
        var point1 =  new Vector(2, -9);
        var point2 =  new Vector(3, -11);
        var circle = new Circle(new Vector(4, -9), Math.sqrt(3));
        var result = Geometry.isLineSegmentIntersectCircle(point1, point2, circle);
        assert.equal(result, false);
    });

    // Small line segment that is outside of circle
    it("Test 3", () => {
        var point1 =  new Vector(3, -11);
        var point2 =  new Vector(5, -11);
        var circle = new Circle(new Vector(4, -9), Math.sqrt(3));
        var result = Geometry.isLineSegmentIntersectCircle(point1, point2, circle);
        assert.equal(result, false);
    });

    // Small line segment that is outside of circle
    it("Test 4", () => {
        var point1 =  new Vector(5, -11);
        var point2 =  new Vector(7, -9);
        var circle = new Circle(new Vector(4, -9), Math.sqrt(3));
        var result = Geometry.isLineSegmentIntersectCircle(point1, point2, circle);
        assert.equal(result, false);
    });

    // Small line segment that is outside of circle
    it("Test 5", () => {
        var point1 =  new Vector(7, -10);
        var point2 =  new Vector(7, -8);
        var circle = new Circle(new Vector(4, -9), Math.sqrt(3));
        var result = Geometry.isLineSegmentIntersectCircle(point1, point2, circle);
        assert.equal(result, false);
    });

    // Small line segment that is outside of circle
    it("Test 6", () => {
        var point1 =  new Vector(5, -6);
        var point2 =  new Vector(7, -8);
        var circle = new Circle(new Vector(4, -9), Math.sqrt(3));
        var result = Geometry.isLineSegmentIntersectCircle(point1, point2, circle);
        assert.equal(result, false);
    });

    // Small line segment that is outside of circle
    it("Test 7", () => {
        var point1 =  new Vector(2, -7);
        var point2 =  new Vector(6, -7);
        var circle = new Circle(new Vector(4, -9), Math.sqrt(3));
        var result = Geometry.isLineSegmentIntersectCircle(point1, point2, circle);
        assert.equal(result, false);
    });

    // Diagonal line segment that passes through circle
    it("Test 8", () => {
        var point1 =  new Vector(0, -10);
        var point2 =  new Vector(6, -6);
        var circle = new Circle(new Vector(4, -9), Math.sqrt(3));
        var result = Geometry.isLineSegmentIntersectCircle(point1, point2, circle);
        assert.equal(result, true);
    });

    // Straight line segment that passes through circle
    it("Test 9", () => {
        var point1 =  new Vector(0, -8);
        var point2 =  new Vector(8, -8);
        var circle = new Circle(new Vector(4, -9), Math.sqrt(3));
        var result = Geometry.isLineSegmentIntersectCircle(point1, point2, circle);
        assert.equal(result, true);
    });
});