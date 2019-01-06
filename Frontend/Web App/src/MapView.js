import React from "react";
import {fromLonLat} from "ol/proj.js";
import {Map as OlMap, View as OlView} from "ol";
import {Tile as OlTileLayer, Vector as OlVectorLayer} from "ol/layer.js";
import OlOSM from "ol/source/OSM.js";

// For drawing objects on the map
import OlVectorSource from "ol/source/Vector.js";
import OlGeoJSON from "ol/format/GeoJSON.js";
import OlStroke from "ol/style/Stroke";
import OlStyle from "ol/style/Style";
import OlCircleStyle from "ol/style/Circle";

import "ol/ol.css";
import Stroke from "ol/style/Stroke";

class MapView extends React.Component {

    constructor(props){
        super(props);
        this.olMap = null;
        this.olPathLayer = null;
    }

    createStopsLayer = () => {
        var stopsStyle = new OlStyle({
            image: new OlCircleStyle({
                radius: 5,
                fill: null,
                stroke: new Stroke({
                    color: "red",
                    width: 1
                })
            })
        });

        var stopsStyleFunction = function(feature){
            return stopsStyle;
        };

        var stopsLayer = new OlVectorLayer({
            source: new OlVectorSource(),
            style: stopsStyleFunction
        });

        return stopsLayer;
    }

    updateStopsLayer = () => {
        let stopsGeoJsonObjects = this.props.stops.map(item => {
            return {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": fromLonLat([item.long, item.lat])
                }
            };
        });

        let geoJsonObject = {
            "type": "FeatureCollection",
            "crs": {
                "type": "name",
                "properties": {
                    "name": "EPSG:3857"
                }
            },
            "features": stopsGeoJsonObjects
        };

        if (this.olStopsLayer){
            let source = this.olStopsLayer.getSource();

            if (source){
                source.clear();
                source.addFeatures((new OlGeoJSON()).readFeatures(geoJsonObject));
                source.refresh();
            }
        }
    }

    createPathLayer = () => {
        var pathStyle = new OlStyle({
            stroke: new OlStroke({
                color: "green",
                width: 3
            })
        });

        var pathStyleFunction = function(feature) {
            return pathStyle;
        };

        var pathLayer = new OlVectorLayer({
            source: new OlVectorSource(),
            style: pathStyleFunction
        });

        return pathLayer;
    }

    updatePathLayer = () => {
        let pathCoordinates = this.props.path.map(item => {
            return fromLonLat([item.long, item.lat]);
        });

        let geoJsonObject = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": pathCoordinates
            }
        };

        if (this.olPathLayer){
            let source = this.olPathLayer.getSource();

            if (source){
                source.clear();
                source.addFeature((new OlGeoJSON()).readFeature(geoJsonObject));
                source.refresh();
            }
        }
    }

    componentDidMount(){
        // console.log("I AM HERE ON componentDidMount(): " + this.olMap);
        
        // Create the view for the map
        this.olView = new OlView({
            center: fromLonLat([this.props.longitude, this.props.latitude]),
            zoom: 2
        });

        this.olPathLayer = this.createPathLayer();
        this.olStopsLayer = this.createStopsLayer();

        // Initialize the map
        this.olMap = new OlMap({
            target: "map",
            layers: [
                new OlTileLayer({
                    source: new OlOSM()
                }),
                this.olPathLayer,
                this.olStopsLayer
            ],
            loadTilesWhileAnimating: true,
            view: this.olView
        });
    }

    shouldComponentUpdate(nextProps, nextState){
        // console.log("I AM HERE ON shouldComponentUpdate(): " + this.olMap);
        if (this.olMap !== null){
            var latitude = nextProps.latitude;
            var longitude = nextProps.longitude;

            this.olView.animate({
                center: fromLonLat([longitude, latitude]),
                zoom: 15,
                duration: 2000
            });

            // console.log("Finished moving center point");

            this.updatePathLayer();
            this.updateStopsLayer();

            return false;
        }
        return true;
    }

    render(){
        const mapStyle = {
            width: "100%",
            height: "100%",
            position: "fixed"
        };
        return (<div id="map" style={mapStyle}></div>);
    }
}

export default MapView;