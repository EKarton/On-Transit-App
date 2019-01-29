import React from "react";
import "./RouteChooserPopup.css";
import "./../popup/Popup.css"

import {getCurrentTime} from "../../services/TimeService";

/**
 * This is a module used to ask users to pick a nearby trip.
 */
class NearbyTripsChooserPopup extends React.Component {

    handleSubmit = (event) => {
        event.preventDefault();
        console.log("Hi there!");
        console.log(event.target.route.value);

        let checkboxValue = event.target.route.value;
        let tokenizedCheckboxValue = checkboxValue.split("/");
        let selectedTripID = tokenizedCheckboxValue[0];
        let selectedScheduleID = tokenizedCheckboxValue[1];
        if (selectedTripID === ""){
        }
        else{
            this.props.onSelectRoute(selectedTripID, selectedScheduleID);
        }
    }

    render() {
        let areThereRoutes = this.props.routes.length > 0;
        let rows = this.props.routes.map((item, index) => {
            let shortName = item.shortName;
            let longName = item.longName;
            let headsign = item.headsign;

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

            return {
                ...item,
                display: display
            };
        }).sort((tripA, tripB) => {
            return tripA.display < tripB.display;
        }).map(item => {
            let tripID = item.tripID;
            let scheduleID = item.scheduleID;
            let display = item.display;

            let checkboxValue = tripID + "/" + scheduleID;
            
            return (
                <div key={tripID}>
                    <input type="radio" name="route" value={checkboxValue}/>
                    <div className="tripInfo">{display}</div>
                </div>
            );
        });

        return (
            <div className="popup-background">
                <div className="popup-container">
                    <div className="popup">
                        <div className="popup-header">{
                            areThereRoutes
                                ? <div>
                                    <h3>Which bus / train are you on?</h3>
                                    <p>
                                        There are multiple bus / train routes near your area. 
                                        Please select which route you are currently on.
                                    </p>
                                  </div>
                                : <div>
                                    <h3>There are no busses / trains near you!</h3>
                                    <p>Are you on a bus / train? If not, this explains why we cannot find your bus / train!</p>
                                  </div>
                        }</div>
                        <form onSubmit={this.handleSubmit}>
                            <div className="popup-contents">{
                                areThereRoutes
                                    ? rows
                                    : <p>Please wait while we try to determine the busses / trains around you.</p>
                            }</div>
                            <div className="popup-actions-container">{
                                areThereRoutes
                                    ?  <button className="popup-action-button" type="submit">
                                        OK
                                      </button>
                                    : null
                            }</div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

export default NearbyTripsChooserPopup;