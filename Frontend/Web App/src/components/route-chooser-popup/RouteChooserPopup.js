import React from "react";
import { connect } from "react-redux";
import "./RouteChooserPopup.css";
import "./../popup/Popup.css"
import LoadingPopup from "../loading-popup/LoadingPopup";
import { getCurrentTime } from "../../services/TimeService";
import { getNearbyTrips } from "../../actions/nearby-trips-actions";
import { startTrackingLocation, stopTrackingLocation } from "../../actions/geolocation-actions";
import { getTripDetails } from "../../actions/select-trip-actions";

/**
 * This is a module used to ask users to pick a nearby trip.
 */
class NearbyTripsChooserPopup extends React.Component {

    componentDidMount(){
        this.props.startTrackingLocation();
    }

    componentWillUnmount(){
        this.props.stopTrackingLocation();
    }
    
    componentWillUpdate(nextProps, nextState){
        const isLocationChanged = (this.props.latitude !== nextProps.latitude) || 
                                  (this.props.longitude !== nextProps.longitude) || 
                                  (this.props.radius !== nextProps.radius);

        if (isLocationChanged){
            let currentTime = getCurrentTime();
            let formattedTime = `${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}`;
            this.props.getNearbyTrips(nextProps.latitude, nextProps.longitude, formattedTime, nextProps.radius);
            return false;
        }

        return true;
    }

    handleSubmit = (event) => {
        event.preventDefault();

        let checkboxValue = event.target.route.value;
        let tokenizedCheckboxValue = checkboxValue.split("/");
        let selectedTransitID = tokenizedCheckboxValue[0];
        let selectedTripID = tokenizedCheckboxValue[1];
        let selectedScheduleID = tokenizedCheckboxValue[2];

        this.props.selectTrip(selectedTransitID, selectedTripID, selectedScheduleID);
    }

    renderLoadingSign = () => (
        <LoadingPopup />
    );

    renderNoNearbyTripsPopup = () => (
        <div className="popup-background">
            <div className="popup-container">
                <div className="popup">
                    <div className="popup-header">
                        <div>
                            <h3>There are no busses / trains near you!</h3>
                            <p>Are you on a bus / train? If not, this explains why we cannot find your bus / train!</p>
                        </div>
                    </div>
                    <div className="popup-contents">
                        <p>Please wait while we try to determine the busses / trains around you.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    renderNearbyTripsPopup = () => (
        <div className="popup-background">
            <div className="popup-container">
                <div className="popup">
                    <div className="popup-header">
                       <div>
                            <h3>Which bus / train are you on?</h3>
                            <p>
                                There are multiple bus / train routes near your area. 
                                Please select which route you are currently on.
                            </p>
                        </div>   
                    </div>
                    <form onSubmit={this.handleSubmit}>
                        <div className="popup-contents">{
                            Object.keys(this.props.nearbyTrips).map(transitID => {
                                console.log(this.props.nearbyTrips[transitID]);
                                let transitName = this.props.nearbyTrips[transitID].name;
                                let trips = this.props.nearbyTrips[transitID].trips;

                                return Object.keys(trips).map(tripID => {
                                    let trip = trips[tripID];
                                    let shortName = trip.shortname;
                                    let longName = trip.longname;
                                    let headsign = trip.headsign;
                                    let schedules = trip.schedules;

                                    return schedules.map(scheduleID => {
                                        let display = "";
                                        if (shortName){
                                            display += shortName + " ";
                                        }
                                        if (headsign){
                                            display += headsign + " ";
                                        }
                                        if (longName){
                                            display += "(" + longName + ")";
                                        }
                                        display.trim();

                                        let checkboxValue = transitID + "/" + tripID + "/" + scheduleID;
                
                                        return (
                                            <div key={checkboxValue}>
                                                <input type="radio" name="route" value={checkboxValue}/>
                                                <div className="tripInfo">{display}</div>
                                            </div>
                                        );
                                    }).flat();
                                }).flat();
                            })
                        }</div>
                        <div className="popup-actions-container">
                            <button className="popup-action-button" type="submit">
                                OK
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    render() {
        console.log("heh", this.props.nearbyTrips);
        if (this.props.nearbyTripsInProgress || this.props.selectedTripsInProgress){
            return this.renderLoadingSign();         
        } 
        else if (Object.keys(this.props.nearbyTrips).length === 0) {
            return this.renderNoNearbyTripsPopup();            
        } 
        else {
            return this.renderNearbyTripsPopup();
        }
    }
}

function mapStateToProps(state){
    return {
        nearbyTrips: state.nearbyTrips.tripIDs,
        nearbyTripsInProgress: state.nearbyTrips.inProgress,
        selectedTripsInProgress: state.selectedTrip.inProgress,
        latitude: state.currentLocation.latitude,
        longitude: state.currentLocation.longitude,
        radius: state.currentLocation.radius
    };
}

const mapDispatchToProps = {
    getNearbyTrips: getNearbyTrips,
    selectTrip: getTripDetails,
    startTrackingLocation: startTrackingLocation,
    stopTrackingLocation: stopTrackingLocation
};

export default connect(mapStateToProps, mapDispatchToProps)(NearbyTripsChooserPopup);
