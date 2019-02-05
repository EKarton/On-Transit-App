import React from "react";
import { connect } from "react-redux";

import { 
    createAlarm, 
    deleteAlarm 
} from "../../actions/alarm-actions";
import { createNotification } from "../../actions/notification-actions";
import { getFormattedTime, getTimeInSeconds } from "../../services/TimeFormatter";
import { getCurrentTime } from "../../services/TimeService";

import "./RouteDetailsView.css";

class RouteDetailsView extends React.Component {

    state = {
        lastUpdated: -1,

        // Stop to be rendered to the UI
        stops: [],

        // A mapping from stop index to the time it will be dispatched
        stopsWithAlarms: {}     
    };

    /**
     * Update the stops in the component's state so that it will have
     * the accurate remaining time.
     */
    updateStops = () => {
        let currentTime = getTimeInSeconds(getCurrentTime());

        // Update only if the time has changed.
        if (currentTime > this.state.lastUpdated){

            // Get the stops that did not pass by and calculate its remaining time.
            let updatedStops = this.props.stops
                .map((stop, index) => {
                    return {
                        ...stop,
                        stopIndex: index
                    };
                })
                .filter(stop => stop.time > currentTime)
                .map(stop => {
                    let timeRemaining = stop.time - currentTime;
                    let formattedRemainingTime = getFormattedTime(timeRemaining);
                    let hasAlarm = this.props.alarms[stop.time] !== undefined;

                    return {
                        ...stop,
                        remainingTime: formattedRemainingTime,
                        hasAlarm: hasAlarm
                    };
                });

            // Update the formatted stops and the time this method was called.
            this.setState((prevState, props) => {
                return {
                    lastUpdated: currentTime,
                    stops: updatedStops
                };
            });  
        }
    };

    addAlarm = (stopIndex) => {
        let stop = this.props.stops[stopIndex];
        let currentTime = getTimeInSeconds(getCurrentTime());
        let dispatchTime = Math.max(stop.time - 300, currentTime);

        if (dispatchTime > currentTime){
            this.props.createAlarm(dispatchTime, () => {
                let currentTime = getTimeInSeconds(getCurrentTime());
                let remainingTime = stop.time - currentTime;
                let formattedRemainingTime = getFormattedTime(remainingTime);

                let message = `You are ${formattedRemainingTime.value} ` + 
                    `${formattedRemainingTime.unit} away from ${stop.name}`;

                let duration = 10000;

                this.props.createNotification(message, duration);
                
                let newStopsWithAlarms = Object.assign({}, this.state.stopsWithAlarms);
                delete newStopsWithAlarms[stopIndex];
    
                this.setState((prevState, prevProps) => {
                    return {
                        ...prevState,
                        stopsWithAlarms: newStopsWithAlarms
                    };
                });
            });

            let message = `You will be notified 5 minutes before reaching ${stop.name}`;
            this.props.createNotification(message, 10000);

            let newStopsWithAlarms = Object.assign({}, this.state.stopsWithAlarms);
            newStopsWithAlarms[stopIndex] = dispatchTime;

            this.setState((prevState, prevProps) => {
                return {
                    ...prevState,
                    stopsWithAlarms: newStopsWithAlarms
                };
            });
        }
        else {
            let remainingTime = stop.time - currentTime;
            let formattedRemainingTime = getFormattedTime(remainingTime);

            let message = `You are ${formattedRemainingTime.value} ` + 
                `${formattedRemainingTime.unit} away from ${stop.name}`;

            let duration = 10000;

            this.props.createNotification(message, duration);
        }
    };

    removeAlarm = (stopIndex) => {
        let dispatchTime = this.state.stopsWithAlarms[stopIndex];
        this.props.deleteAlarm(dispatchTime);

        let newStopsWithAlarms = Object.assign({}, this.state.stopsWithAlarms);
        delete newStopsWithAlarms[stopIndex];

        let stop = this.props.stops[stopIndex];
        let message = `Removed notification for ${stop.name}`;
        this.props.createNotification(message, 10000);

        this.setState((prevState, prevProps) => {
            return {
                ...prevState,
                stopsWithAlarms: newStopsWithAlarms
            };
        });
    };

    onAlarmButtonClick = (stopIndex) => {
        if (this.state.stopsWithAlarms[stopIndex]){
            this.removeAlarm(stopIndex);
        } 
        else {
            this.addAlarm(stopIndex);
        }
    };
    
    componentDidMount() {
        this.timer = setInterval(this.updateStops);
    }

    componentWillUnmount(){
        clearInterval(this.timer);
        this.timer = null;
    }

    /**
     * Creates a list item displaying stop information which is used
     * to be placed in the list.
     * 
     * The "stop" param is an object with this format:
     * {
     *      name: <The name of the stop>,
     *      remainingTime: {
     *          value: <The # for the remaining time left>,
     *          unit: <The unit of value for the remaining time left>     
     *      },
     *      hasAlarm: <A boolean where if it has an alarm on it or not>
     * }
     */
    renderListItem = (stop) => (
        <div key={stop.stopIndex} className="stop-container">
            <div className="stop-info-container">
                <div className="stop-name">{stop.name}</div>

                <div className="remaining-time">
                    <div className="remaining-time-value">{stop.remainingTime.value}</div>
                    <div className="remaining-time-unit">{stop.remainingTime.unit}</div>
                </div>
            </div>
            <div className="stop-interactions-container">
                <div className="stop-interactions">
                    <div className={
                        this.state.stopsWithAlarms[stop.stopIndex] !== undefined ? 
                              "stop-interaction-button stop-interaction-button-selected" 
                            : "stop-interaction-button"}
                        onClick={() => this.onAlarmButtonClick(stop.stopIndex)}>
                        Notify me
                    </div>				
                </div>
            </div>
        </div>
    );

    render(){
        let stopListItems = this.state.stops
            .map((stop) => this.renderListItem(stop));

        return (
            <div>
                <div className="trip-header-details-container">
                    <div className="trip-header-details">
                        <h3 className="short-name">{this.props.tripShortName}</h3>
                        <p className="long-name">{this.props.tripLongName}</p>
                    </div>
                </div>
                <div className="stop-containers-list">
                    {stopListItems}
                </div>
            </div>
        );
    }
}

function mapStateToProps(state){
    return {
        tripShortName: state.selectedTrip.tripDetails.shortName,
        tripLongName: state.selectedTrip.tripDetails.longName,
        tripHeadSign: state.selectedTrip.tripDetails.headSign,
        stops: state.selectedTrip.tripDetails.stops,
        alarms: state.alarms.alarms
    };
}

const mapDispatchToProps = {
    createAlarm: createAlarm,
    deleteAlarm: deleteAlarm,
    createNotification: createNotification
};
 

export default connect(mapStateToProps, mapDispatchToProps)(RouteDetailsView);