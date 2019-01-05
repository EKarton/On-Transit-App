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
            let numHrsFromMidnight = new Date().getHours();
            let numMinFromHr = new Date().getMinutes();
            let numSecFromMin = new Date().getSeconds();
            // var numSecAfterMidnight = numSecFromMin + (60 * numMinFromHr) + (3600 * numHrsFromMidnight);

            // TODO: Remove this!
            var numSecAfterMidnight = 72000;

            console.log("numSecAfterMidnight: " + numSecAfterMidnight);

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

		console.log("numHrsRemaining: " + numHrsRemaining);
		console.log("numMinRemaining: " + numMinRemaining);
		console.log("numSecondsRemaining: " + numSecondsRemaining);

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
        console.log("Updating view!");
        console.log(this.state.stops);
        let stopContainers = this.state.stops.map(item => {
            let formattedRemainingTime = this.formatRemainingTime(item.remainingTimeInSeconds);

            return (
                <div class="stop-container">
                    <div class="stop-info-container">
                        <div class="stop-name">{item.name}</div>

                        <div class="remaining-time">
                            <div class="remaining-time-value">{formattedRemainingTime.value}</div>
                            <div class="remaining-time-unit">{formattedRemainingTime.unit}</div>
                        </div>
                    </div>
                    <div class="stop-interactions-container">
                        <div class="stop-interactions">
                            <div class="stop-notification-button">
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

    myRender(){
        let stopDivs = this.state.stops.map(item => {
            let formattedRemainingTime = this.formatRemainingTime(item.remainingTimeInSeconds);
            return (
                <div>
                    <div>

                    </div>
                    <div>
                        <div></div>
                    </div>
                </div>
            )
        })
    }
}

export default RouteDetailsView;