import React from "react";

import "./RouteDetailsView.css";

class RouteDetailsView extends React.Component {

    state = {
        stops: []
    }

    componentDidMount() {
        // Set "prevTime" to -1 so that it will always pass the if statement on the first run.
        let prevTime = -1;  

        this.timer = setInterval(() => {

            // Get the current time in seconds
            // let numHrsFromMidnight = new Date().getHours();
            // let numMinFromHr = new Date().getMinutes();
            // let numSecFromMin = new Date().getSeconds();
            // var numSecAfterMidnight = numSecFromMin + (60 * numMinFromHr) + (3600 * numHrsFromMidnight);

            // TODO: Remove this!
            var numSecAfterMidnight = 72250;

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

    formatRemainingTime = (numSecondsRemaining) => {
        let numHrsRemaining = Math.trunc(numSecondsRemaining / 3600);
		numSecondsRemaining = numSecondsRemaining % 3600;
		
		let numMinRemaining = Math.trunc(numSecondsRemaining / 60);
		numSecondsRemaining = numSecondsRemaining % 60;

		let remainingTimeValue = "";
		let remainingTimeUnit = "hours";
		if (numHrsRemaining >= 1){
			if (numHrsRemaining === 1 && numMinRemaining === 0){
				remainingTimeValue = "1";
				remainingTimeUnit = "hour";
			}
			else{
				remainingTimeValue = numHrsRemaining + ":" + Math.trunc(numMinRemaining);
				remainingTimeUnit = "hours";
			}
		}
		else if (numMinRemaining >= 1){
			if (numMinRemaining === 1 && numSecondsRemaining === 0){
				remainingTimeValue = "1";
				remainingTimeUnit = "minute";
			}
			else{
				remainingTimeValue = numMinRemaining + ":" + Math.trunc(numSecondsRemaining);
				remainingTimeUnit = "minutes";
			}
		}
		else {
			if (numSecondsRemaining === 1){
				remainingTimeValue = "1";
				remainingTimeUnit = "second";
			}
			else{
				remainingTimeValue = numSecondsRemaining.toString();
				remainingTimeUnit = "seconds";
			}
		}

		return {
			value: remainingTimeValue,
			unit: remainingTimeUnit
		};
	}

    render(){
        let stopContainers = this.state.stops.map(item => {
            let formattedRemainingTime = this.formatRemainingTime(item.remainingTimeInSeconds);

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