import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Map from "./MapView.js";
import RouteDetailsView from './RouteDetailsView.js';
import { getFormattedTime, getTimeInSeconds } from "./TimeFormatter";

import MockedOnTransitService from './MockedOnTransitService.js';

class App extends React.Component {
	state = {
		displayRouteDetails: false,
		curLocation: {
			latitude: 43.5890,
			longitude: 79.6441
		},
		tripDetailsID: null,
		tripDetails: {
			shortName: null,
			longName: null,
			path: [],
			stops: []
		},
		alarms: {}
	}

	constructor(props){
		super(props);

		this.onTransitService = new MockedOnTransitService();	
		
		
		if (!("Notification" in window)){
			alert("Notifications are not supported in this browser!");
		}

		Notification.requestPermission();
	}

	componentDidMount(){
		this.startGeolocationWatch();
		this.startAlarmWatch();
	}

	startGeolocationWatch = () => {
		// Initialize and watch the location
		let geolocationOptions = {
			enableHighAccuracy: true,
			timeout: Infinity,
			maximumAge: 0
		};

        if (navigator.geolocation){
            this.geolocationWatch = navigator.geolocation.watchPosition(
				this.onLocationChangedSuccess, this.onLocationChangedError, geolocationOptions);
		}
	};

	startAlarmWatch = () => {
		this.alarmInterval = setInterval(() => {
			//var curTimeInSeconds = getTimeInSeconds(new Date());

			// TODO: Remove this!!
			var curTimeInSeconds = 72250;

			Object.keys(this.state.alarms).forEach(stopID => {
				// Get the stop detail for that stopID
				let stopDetails = this.state.tripDetails.stops.find(stop => {
					return stop.ID == stopID;
				});

				if (stopDetails !== undefined){
					let alarmDetails = this.state.alarms[stopID];
					let remainingTimeLeft = stopDetails.time - curTimeInSeconds;

					if (remainingTimeLeft < alarmDetails.minRemainingTimeLeft && !alarmDetails.isDispatched){
						console.log("RING RING RING!!!");
						this.dispatchAlarm(stopDetails);
						this.removeAlarm(stopID);
					}
				}
				else{
					throw new Error("Inconsistency with stop ID " + stopID + " and trip details!");
				}
			});
		});
	}

	componentWillUnmount(){
		navigator.geolocation.clearWatch(this.geolocationWatch);

		if (this.alarmInterval){
			clearInterval(this.alarmInterval);
		}
	}

	onLocationChangedSuccess = (position) => {
        let latitude = position.coords.latitude;
        let longitude = position.coords.longitude;
        let radius = position.coords.accuracy;
		let time = new Date().toLocaleTimeString();

        // Get the nearby trips and vehicles
        let nearbyTripsPromise = this.onTransitService.getNearbyTrips(latitude, longitude, time, radius);
		let nearbyVehiclesPromise = this.onTransitService.getNearbyVehicles(latitude, longitude, radius);
		
        Promise.all([nearbyTripsPromise, nearbyVehiclesPromise])
            .then(values => {
                let nearbyTripIDs = values[0].tripIDs;
				let selectedTripID = nearbyTripIDs[0];

				this.setState((prevState, props) => {
					return {
						...prevState,
						curLocation: {
							latitude: latitude,
							longitude: longitude
						}
					};
				});

				if (this.state.tripDetailsID !== selectedTripID){
					this.onTransitService.getTripDetails(selectedTripID)
						.then(results => {

							// Set the ID of results to their index
							results.stops = results.stops.map((item, index) => {
								return {
									...item,
									ID: index
								};
							});
							
							this.setState((prevState, props) => {
								return {
									...prevState,
									tripDetailsID: selectedTripID,
									displayRouteDetails: true,
									tripDetails: results,
									alarms: {}
								};
							});
						})
						.catch(error => {
							console.log(error);
						});
					}
			})
            .catch(errors => {
				console.log(errors);
		    });
    }

    onLocationChangedError = (error) => {
		console.log("ERROR!");
		console.log(error);
	}

	addNewAlarm = (stopID) => {

		if (this.state.tripDetails.stops[stopID.toString()]){
			this.setState((prevState, props) => {
				let newAlarms = prevState.alarms;
				newAlarms[stopID] = { 
					minRemainingTimeLeft: 300, //<- 300 seconds is 5 minutes
					isDispatched: false
				}; 

				// Display a toast message to the user that an alarm is added.
				let stopDetails = this.state.tripDetails.stops[stopID.toString()];
				let toastMessage = "You will be notified 5 minutes before reaching " + stopDetails.name;
				toast(toastMessage, {
					position: toast.POSITION.BOTTOM_CENTER
				});
				console.log(toastMessage);

				return {
					...prevState,
					alarms: newAlarms
				};
			});			
		}
		else{
			throw new Error("Inconsistencies with stopID " + stopID + " and this.state.tripDetails.stops");
		}
	}

	removeAlarm = (stopID) => {

		this.setState((prevState, props) => {
			delete prevState.alarms[stopID.toString()];

			// Display a toast message to the user that the notification is removed
			let stopDetails = this.state.tripDetails.stops[stopID.toString()];
			let toastMessage = "Removed notification for stop " + stopDetails.name;
			toast(toastMessage, {
				position: toast.POSITION.BOTTOM_CENTER
			});

			console.log(toastMessage);

			return prevState;
		});
		
		console.log("Removed alarm " + stopID);
	}

	dispatchNotification = (message, timeBeforeClosingNotification) => {
		// Notify the user via Web Notifications
		Notification.requestPermission()
			.then((permission) => {
				if (permission !== "granted"){
					throw new Error("No access!");
				}
			})
			.then(() => {
				console.log("We have access here!");
				let notification = new Notification(message);

				// Close the notification after 10 seconds
				setTimeout(() => {
					notification.close();
				}, timeBeforeClosingNotification);
			})
			.catch(error => {
				console.log("We have no access here!");
			});
	}

	dispatchAlarm = (stopDetails) => {
		// let curTimeInSeconds = getTimeInSeconds(new Date());
		let curTimeInSeconds = 72250;

		let numSecondsRemaining = stopDetails.time - curTimeInSeconds;
		let formattedTimeRemaining = getFormattedTime(numSecondsRemaining);
		let stopID = stopDetails.ID;

		let notificationContent = "You are " +  
			formattedTimeRemaining.value + " " + 
			formattedTimeRemaining.unit + " away from " + 
			stopDetails.name;

		this.dispatchNotification(notificationContent, 10000);

		this.setState((prevState, props) => {
			let newAlarms = prevState.alarms;
			newAlarms[stopID.toString()].isDispatched = true;

			return {
				...prevState,
				alarms: newAlarms
			};
		});
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
							stops={this.state.tripDetails.stops}
							alarms={this.state.alarms}
							addNewAlarmHandler={this.addNewAlarm}
							removeAlarmHandler={this.removeAlarm}/> 
						: null
				}</div>
				<div style={rightSidePanelStyles}>
					<Map latitude={this.state.curLocation.latitude}
						 longitude={this.state.curLocation.longitude}
						 path={this.state.tripDetails.path}
						 stops={this.state.tripDetails.stops} />
				</div>		
				<ToastContainer />		
  			</div>
		);
	}
}

export default App;