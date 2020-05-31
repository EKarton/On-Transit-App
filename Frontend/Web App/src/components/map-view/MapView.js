import React from "react";
import { connect } from "react-redux";

import "./MapView.css";
import { getCurrentTime } from "../../services/MockedTimeService";
import { getTimeInSeconds } from "../../services/TimeFormatter";
import { getLocationOnPath } from "../../services/LocationTracker";

// Imports for the map
import MapboxGL from 'mapbox-gl/dist/mapbox-gl.js';

console.log(process.env.REACT_APP_MAPBOX_API_KEY);

/**
 * A component which displays the map to the user
 * It uses OpenLayers as the map
 */
class MapView extends React.Component {

    state = {
        location: {
            latitude: null,
            longitude: null
        }
    };

    /**
     * Constructs the component with initial properties
     * @param {Object} props Initial properties
     */
    constructor(props) {
        super(props);
        this.mapbox = null;
    }

    /**
     * Starts predicting the user's location on the path
     * in regular intervals
     */
    startPredictedLocationWatch = () => {
        if (this.liveLocationWatch) {
            this.stopLiveLocationWatch();
        }

        this.liveLocationWatch = setInterval(() => {
            let currentTimeInSeconds = getTimeInSeconds(getCurrentTime());

            if (this.props.stops && this.props.stops.length > 1) {
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
        if (this.liveLocationWatch) {
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
        this.map.addSource('stops', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        });

        this.map.addLayer({
            'id': 'stops',
            'source': 'stops',
            'type': 'symbol',
            'layout': {
                'text-field': ['get', 'description'],
                'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                'text-radial-offset': 1,
                'text-justify': 'auto',
                'icon-image': ['get', 'icon']
            }
        });

    }

    /**
     * Updates the stops layer with new stops.
     * It will clear the existing stops and render the new stops.
     * 
     * @param {Object} newStops The new stops
     */
    updateStopsLayer = (newStops) => {
        let geoJsonObject = {
            "type": "FeatureCollection",
            "features": newStops.map(stop => {
                return {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [stop.long, stop.lat]
                    },
                    'properties': {
                        'description': stop.name,
                        'icon': 'bus'
                    },
                }
            })
        };

        this.map.getSource("stops").setData(geoJsonObject);
    }

    /**
     * Creates and returns a new OpenLayers layer
     * which will display the path of the trip
     * @returns {OlVectorLayer} Returns a Vector Layer that will display the path of the trip.
     */
    createPathLayer = () => {
        this.map.addSource('path', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': []
                }
            }
        });

        this.map.addLayer({
            'id': 'path',
            'source': 'path',
            'type': 'line',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': 'green',
                'line-width': 8
            }
        });
    }

    /**
     * Updates the path layer with a new path.
     * It will clear the existing path and render the new path.
     * 
     * @param {Object} newPath The new path
     */
    updatePathLayer = (newPath) => {

        let geoJsonObject = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": newPath.map(item => [item.long, item.lat])
            }
        };

        this.map.getSource('path').setData(geoJsonObject);
    }

    /**
     * Creates the user's location layer on a path
     * for the OLMap
     */
    createLiveLocationLayer = () => {

        this.map.addSource('user-location', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        });

        this.map.addLayer({
            'id': 'user-location',
            'source': 'user-location',
            'type': 'circle',
            'paint': {
                'circle-radius': 10,
                'circle-color': '#007cbf'
            }
        });
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
                "coordinates": [newLongitude, newLatitude]
            }
        };

        this.map.getSource('user-location').setData(geoJsonObject);
    }

    /**
     * Updates the map's view
     */
    updateMapView = (viewOptions) => {
        this.map.flyTo({
            center: viewOptions.center,
            essential: true,
            zoom: viewOptions.zoom
        })
    }

    /**
     * This method gets called whenever the HTML elements in this component is already 
     * in the DOM.
     * 
     * It will create an initial view of the MapBox map as well as setting up
     * the required layers.
     */
    componentDidMount() {
        MapboxGL.accessToken = process.env.REACT_APP_MAPBOX_API_KEY;
        this.map = new MapboxGL.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v10',
            center: [0, 0],
            zoom: 0,
        });

        this.map.on('load', () => {
            this.map.resize();
            this.createPathLayer();
            this.createStopsLayer();
            this.createLiveLocationLayer();
        });

        this.startPredictedLocationWatch();
    }

    /**
     * This method gets called right before the component becomes dismounted.
     */
    componentWillMount() {
        this.stopLiveLocationWatch();
    }

    /**
     * This method gets called whenever the component updates.
     * 
     * @param {Object} nextProps The new set of properties
     * @param {Object} nextState The new set of states
     */
    componentWillUpdate(nextProps, nextState) {
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
        if (this.map) {
            let hasNewViewOptions = false;
            let newViewOptions = {};

            let tripDetailsAdded = oldProps && newProps && oldProps.path === null && newProps.path !== null;
            let tripDetailsRemoved = oldProps && newProps && oldProps.path !== null && newProps.path === null;
            let predictedLocationAdded = oldState.location.latitude === null && newState.location.latitude !== null;
            let predictedLocationChanged = oldState.location.latitude !== newState.location.latitude
                && oldState.location.longitude !== newState.location.longitude;

            if (predictedLocationAdded) {
                console.log("Predicted location found!");

                hasNewViewOptions = true;
                newViewOptions.center = [
                    newState.location.longitude,
                    newState.location.latitude
                ];
                newViewOptions.zoom = 13;
            }
            else if (tripDetailsAdded) {
                let sumOfAllPathLatitudes = newProps.path.reduce((curSum, item) => curSum + item.lat, 0);
                let sumOfAllPathLongitudes = newProps.path.reduce((curSum, item) => curSum + item.long, 0);
                let midPathLatitude = sumOfAllPathLatitudes / newProps.path.length;
                let midPathLongitude = sumOfAllPathLongitudes / newProps.path.length;

                hasNewViewOptions = true;
                newViewOptions.center = [midPathLongitude, midPathLatitude];
                newViewOptions.zoom = 10;

            }
            else if (tripDetailsRemoved) {
                hasNewViewOptions = true;
                newViewOptions.center = [0, 0];
                newViewOptions.zoom = 1;
            }


            if (hasNewViewOptions) {
                this.updateMapView(newViewOptions);
            }

            if (newProps && newProps.path && newProps.stops) {
                this.updatePathLayer(newProps.path);
                this.updateStopsLayer(newProps.stops);
            }

            if (predictedLocationChanged) {
                let curLatitude = newState.location.latitude;
                let curLongitude = newState.location.longitude;
                this.updateLiveLocationLayer(curLatitude, curLongitude);
            }
        }
    };

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
