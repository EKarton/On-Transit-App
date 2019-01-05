import React from 'react';
import Map from "./Map.js";
import RouteDetailsView from './RouteDetailsView.js';

import OnTransitService from "./OnTransitService";

import MockedTripDetails from "./MockedTripDetails";

class App extends React.Component {
	state = {
		displayRouteDetails: false,
		curLocation: {
			latitude: 43.5890,
			longitude: 79.6441
		},
		tripDetails: {
			shortName: null,
			longName: null,
			path: [],
			stops: []
		}
	}

	constructor(props){
		super(props);

		this.onTransitService = new OnTransitService();		
	}

	componentDidMount(){
		// Initialize and watch the location
		let geolocationOptions = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge:600000
		};

        if (navigator.geolocation){
            this.geolocationWatch = navigator.geolocation.watchPosition(
				this.onLocationChangedSuccess, this.onLocationChangedError, geolocationOptions);
        }
	}

	componentWillUnmount(){
		navigator.geolocation.clearWatch(this.geolocationWatch);
	}

	onLocationChangedSuccess = (position) => {
		console.log("Location changed!");
		console.log(position);
        let latitude = position.coords.latitude;
        let longitude = position.coords.longitude;
        let radius = position.coords.accuracy;
		let time = new Date().toLocaleTimeString();

        // // // Get the nearby trips and vehicles
        // let nearbyTripsPromise = this.onTransitService.getNearbyTrips(latitude, longitude, time, radius);
        // let nearbyVehiclesPromise = this.onTransitService.getNearbyVehicles(latitude, longitude, radius);
        // Promise.all([nearbyTripsPromise, nearbyVehiclesPromise])
        //     .then(values => {
        //         let nearbyTripIDs = values[0].data.data.tripIDs;
		// 		let selectedTripID = nearbyTripIDs[0];

		// 		this.onTransitService.getTripDetails(selectedTripID)
		// 			.then(results => {
		// 				console.log(results);
		// 				console.log(results.data.data);
						
		// 				this.setState((prevState, props) => {
		// 					return {
		// 						displayRouteDetails: true,
		// 						tripDetails: results.data.data,
		// 					};
		// 				});
		// 			})
		// 			.catch(error => {
		// 				console.log(error);
		// 			});
		// 	})
        //     .catch(errors => {
		// 		console.log(errors);
		// 		this.setState((prevState, props) => {
		// 			return {
		// 				displayRouteDetails: false,
		// 				tripDetails: null,
		// 			};
		// 		});
		//     });
		
		// TODO: Remove this!
		this.setState((prevState, props) => {
			return {
				displayRouteDetails: true,
				curLocation: {
					latitude: latitude,
					longitude: longitude
				},
				tripDetails: MockedTripDetails.data,
			};
		});
    }

    onLocationChangedError = (error) => {
		console.log("ERROR!");
		console.log(error);
    }

	render() {
		const leftSidePanelStyles = {
			float: "left",
			maxWidth: "20%",
			height: "100%"
		};
		const rightSidePanelStyles = {
			float: "right",
			width: "80%",
			height: "100%"
		};

		return (
	  		<div>
				<div style={leftSidePanelStyles}>{
					this.state.displayRouteDetails 
						? <RouteDetailsView 
							tripShortName={this.state.tripDetails.shortName}
							tripLongName={this.state.tripDetails.longName}
							stops={this.state.tripDetails.stops}/> 
						: null
				}</div>
				<div style={rightSidePanelStyles}>
					<Map latitude={this.state.curLocation.latitude}
						 longitude={this.state.curLocation.longitude}
						 path={this.state.tripDetails.path}
						 stops={this.state.tripDetails.stops} />
				</div>				
  			</div>
		);
	}
}

export default App;