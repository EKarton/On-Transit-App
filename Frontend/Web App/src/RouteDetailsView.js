import React from "react";

import { getFormattedTime, getTimeInSeconds } from "./TimeFormatter";
import "./RouteDetailsView.css";

class RouteDetailsView extends React.Component {

    state = {
        stops: []
    }

    componentDidMount() {
        // Set "prevTime" to -1 so that it will always pass the if statement on the first run.
        let prevTime = -1;  

        this.timer = setInterval(() => {

            // TODO: Remove this!
            var numSecAfterMidnight = 72250;

            // var numSecAfterMidnight = getTimeInSeconds(new Date());

            // Update only if the time has changed.
            if (numSecAfterMidnight > prevTime){

                // Get the stops that did not pass by and calculate its remaining time.
                let updatedStops = this.props.stops
                    .filter(item => item.time > numSecAfterMidnight)
                    .map(item => {
                        return {
                            ...item,
                            remainingTimeInSeconds: item.time - numSecAfterMidnight
                        }
                    });

                // Set the current time in seconds to the state
                this.setState((prevState, props) => {
                    return {
                        stops: updatedStops
                    };
                });  

                prevTime = numSecAfterMidnight;
            }
        });
    }

    componentWillUnmount(){
        clearInterval(this.timer);
    }

    render(){
        let stopContainers = this.state.stops.map(item => {
            let formattedRemainingTime = getFormattedTime(item.remainingTimeInSeconds);

            // Get the class for whether it is selected or not
            let alarmClassName = "stop-interaction-button";
            if (this.props.alarms[item.ID] !== undefined){
                alarmClassName += " stop-interaction-button-selected";
            }

            return (
                <div key={item.ID} className="stop-container">
                    <div className="stop-info-container">
                        <div className="stop-name">{item.name}</div>

                        <div className="remaining-time">
                            <div className="remaining-time-value">{formattedRemainingTime.value}</div>
                            <div className="remaining-time-unit">{formattedRemainingTime.unit}</div>
                        </div>
                    </div>
                    <div className="stop-interactions-container">
                        <div className="stop-interactions">
                            <div className={alarmClassName}
                                 onClick={e => {
                                     if (this.props.alarms[item.ID] === undefined){
                                        this.props.addNewAlarmHandler(item.ID);
                                     }
                                     else{
                                        this.props.removeAlarmHandler(item.ID);
                                     }
                                 }}>
                                Notify me
                            </div>				
                        </div>
                    </div>
                </div>
            );
        });
        return (
            <div>
                <div className="trip-header-details-container">
                    <div className="trip-header-details">
                        <h3 className="short-name">{this.props.tripShortName}</h3>
                        <p className="long-name">{this.props.tripLongName}</p>
                    </div>
                </div>
                <div className="stop-containers-list">
                    {stopContainers}
                </div>
            </div>
        );
    }
}

export default RouteDetailsView;