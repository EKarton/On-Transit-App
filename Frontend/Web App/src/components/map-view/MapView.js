import React from "react";
import { connect } from "react-redux";

import "./MapView.css";
import { getCurrentTime } from "../../services/TimeService";
import { getTimeInSeconds } from "../../services/TimeFormatter";
import { getLocationOnPath } from "../../services/LocationTracker";

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

    state = {
        location: {
            latitude: 0,
            longitude: 0
        }
    };

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
     * Starts predicting the user's location on the path
     * in regular intervals
     */
    startPredictedLocationWatch = () => {
        if (this.liveLocationWatch){
            this.stopLiveLocationWatch();
        }

        this.liveLocationWatch = setInterval(() => {
            let currentTimeInSeconds = getTimeInSeconds(getCurrentTime());

            if (this.props.stops && this.props.stops.length > 1){
                let stops = this.props.stops;
                let path = this.props.path;
                let lastStop = stops[stops.length - 1];

                if (currentTimeInSeconds <= lastStop.time) {
                    let predictedLocation = getLocationOnPath(stops, path, currentTimeInSeconds);

                    this.setState((prevState, props) => {
                        return {
                            ...prevState,
                            location: {
                                latitude: predictedLocation.lat,
                                longitude: predictedLocation.long
                            }
                        };
                    });
                }
            }
        });
    }

    /**
     * Stops tracking the user's location on the path
     */
    stopLiveLocationWatch = () => {
        if (this.liveLocationWatch){
            clearInterval(this.liveLocationWatch);
            this.liveLocationWatch = null;
        }
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
     * Creates the user's location layer on a path
     * for the OLMap
     */
    createLiveLocationLayer = () => {
        var liveLocationStyle = new OlStyle({
            image: new OlCircleStyle({
                radius: 10,
                fill: null,
                stroke: new Stroke({
                    color: "blue",
                    width: 2
                })
            })
        });
        var liveLocationStyleFunction = function(feature) {
            return liveLocationStyle;
        };

        var liveLocationLayer = new OlVectorLayer({
            source: new OlVectorSource(),
            style: liveLocationStyleFunction
        });

        return liveLocationLayer;
    }

    /**
     * Updates the user's location on the path
     * @param {Number} newLatitude The user's latitude
     * @param {Number} newLongitude The user's longitude
     */
    updateLiveLocationLayer = (newLatitude, newLongitude) => {
        let geoJsonObject = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": fromLonLat([newLongitude, newLatitude])
            }
        };

        if (this.olLiveLocationLayer){
            let source = this.olLiveLocationLayer.getSource();

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
        // Create the view for the map
        let initialLatitude = 0;
        let initialLongitude = 0;
        let mapZoom = 2;
        this.olView = new OlView({
            center: fromLonLat([initialLongitude, initialLatitude]),
            zoom: mapZoom
        });

        this.olPathLayer = this.createPathLayer();
        this.olStopsLayer = this.createStopsLayer();
        this.olLiveLocationLayer = this.createLiveLocationLayer();

        // Initialize the map
        this.olMap = new OlMap({
            target: "map",
            layers: [
                new OlTileLayer({
                    source: new OlOSM()
                }),
                this.olPathLayer,
                this.olStopsLayer,
                this.olLiveLocationLayer
            ],
            loadTilesWhileAnimating: true,
            view: this.olView
        });

        this.startPredictedLocationWatch();
    }

    /**
     * This method gets called right before the component becomes dismounted.
     */
    componentWillMount(){
        this.stopLiveLocationWatch();
    }
    
    /**
     * This method gets called whenever the component updates.
     * 
     * @param {Object} nextProps The new set of properties
     * @param {Object} nextState The new set of states
     */
    componentWillUpdate(nextProps, nextState){
        this.updateDimensions();
        this.updateMap(this.props, nextProps, this.state, nextState);
    }

    /**
     * This method will prevent the OpenLayers map from being
     * deconstructed and re-instantiated and instead update the 
     * stops and the path displayed on the map.
     * 
     * @param {Object} oldProps The component's old set of properties
     * @param {Object} newProps The component's new set of properties
     * @param {Object} oldState The component's old set of states
     * @param {Object} newState The component's new set of states
     */
    updateMap = (oldProps, newProps, oldState, newState) => {
        if (this.olMap){
            let newViewOptions = {};

            let tripDetailsAdded = oldProps && newProps && oldProps.path === null && newProps.path !== null;
            let tripDetailsRemoved = oldProps && newProps && oldProps.path !== null && newProps.path === null;
            
            if (tripDetailsAdded){
                let sumOfAllPathLatitudes = newProps.path.reduce((curSum, item) => curSum + item.lat, 0);
                let sumOfAllPathLongitudes = newProps.path.reduce((curSum, item) => curSum + item.long, 0);
                let midPathLatitude = sumOfAllPathLatitudes / newProps.path.length;
                let midPathLongitude = sumOfAllPathLongitudes / newProps.path.length;

                newViewOptions.center = fromLonLat([midPathLongitude, midPathLatitude]);
                newViewOptions.duration = 2000;
                newViewOptions.zoom = 13;
                
            }
            else if (tripDetailsRemoved){
                newViewOptions.center = fromLonLat([0, 0]);
                newViewOptions.duration = 2000;
                newViewOptions.zoom = 2;
            }

            if (newViewOptions !== {}){
                this.olView.animate(newViewOptions);
            }

            if (newProps && newProps.path && newProps.stops){
                this.updatePathLayer(newProps.path);
                this.updateStopsLayer(newProps.stops);
            }

            let curLatitude = newState.location.latitude;
            let curLongitude = newState.location.longitude;
            this.updateLiveLocationLayer(curLatitude, curLongitude);
        }
    };

    /**
     * This method is called whenever the component's dimensions changes.
     * Specifically, it will re-compute the size for the OpenLayers map.
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
    render() {
        return (<div id="map" className="map"></div>);
    }
}

/**
 * Maps the store's state with this component's properties
 * @param {Object} state The store's state
 */
function mapStateToProps(state) {

    let stops = state.selectedTrip.tripDetails ? state.selectedTrip.tripDetails.stops : null;
    let path = state.selectedTrip.tripDetails ? state.selectedTrip.tripDetails.path : null;
    let type = state.selectedTrip.tripDetails ? state.selectedTrip.tripDetails.type : null;

    return {
        stops: stops,
        path: path,
        type: type
    };
}

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(MapView);
