import React from "react";
import "./MapView.css";

// Imports for the map
import "ol/ol.css";
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
import Stroke from "ol/style/Stroke";

/**
 * A component which displays the map to the user
 * It uses OpenLayers as the map
 */
class MapView extends React.Component {

    /**
     * Constructs the component with initial properties
     * @param {Object} props Initial properties
     */
    constructor(props){
        super(props);
        this.olMap = null;
        this.olPathLayer = null;
        this.olStopsLayer = null;
    }

    /**
     * Creates and returns a new OpenLayers layer
     * which will display the stops
     * @returns {OlVectorLayer} Returns a Vector Layer that will display the stops.
     */
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

    /**
     * Updates the stops layer with new stops.
     * It will clear the existing stops and render the new stops.
     * 
     * If this.olStopsLayer is not set, it will not render the new stops.
     * It will render the path on this.olStopsLayer.
     * 
     * @param {Object} newStops The new stops
     */
    updateStopsLayer = (newStops) => {
        let stopsGeoJsonObjects = newStops.map(item => {
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

    /**
     * Creates and returns a new OpenLayers layer
     * which will display the path of the trip
     * @returns {OlVectorLayer} Returns a Vector Layer that will display the path of the trip.
     */
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

    /**
     * Updates the path layer with a new path.
     * It will clear the existing path and render the new path.
     * 
     * If this.olPathLayer is not set, it will not render the new path.
     * It will render the path on this.olPathLayer.
     * 
     * @param {Object} newPath The new path
     */
    updatePathLayer = (newPath) => {
        let pathCoordinates = newPath.map(item => {
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

    /**
     * This method gets called whenever the HTML elements in this component is already 
     * in the DOM.
     * 
     * It will create an initial view of the OpenLayers map as well as setting up
     * the required layers.
     */
    componentDidMount(){
        // console.log("I AM HERE ON componentDidMount(): " + this.olMap);
        
        // Create the view for the map
        this.olView = new OlView({
            center: fromLonLat([this.props.longitude, this.props.latitude]),
            zoom: 3
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

    /**
     * This method gets called whenever the component updates.
     * This method will prevent the OpenLayers map from being
     * deconstructed and re-instantiated and instead update the 
     * stops and the path displayed on the map.
     * 
     * @param {Object} nextProps The new set of properties
     * @param {Object} nextState The new set of states
     */
    shouldComponentUpdate(nextProps, nextState){
        console.log("I AM HERE ON shouldComponentUpdate(): " + this.olMap);
        if (this.olMap !== null){
            this.updateDimensions();

            var latitude = nextProps.latitude;
            var longitude = nextProps.longitude;

            this.olView.animate({
                center: fromLonLat([longitude, latitude]),
                zoom: 15,
                duration: 2000
            });

            this.updatePathLayer(nextProps.path);
            this.updateStopsLayer(nextProps.stops);

            return false;
        }
        return true;
    }

    /**
     * This method is called whenever the component's dimensions changes.
     * This method will re-compute the size for the OpenLayers map.
     */
    updateDimensions() {

        // Reason for creating a timeout was described at:
        // https://gis.stackexchange.com/questions/31409/openlayers-redrawing-map-after-container-resize
        setTimeout(() => { 
            this.olMap.updateSize();
        }, 200);
    }

    /**
     * This method gets called whenever React wants to re-render the component.
     */
    render(){
        return (<div id="map" className="map"></div>);
    }
}

export default MapView;