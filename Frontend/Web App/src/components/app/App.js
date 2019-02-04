import React from 'react';
import { connect } from "react-redux";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { startAlarm, stopAlarm } from "../../actions/alarm-actions";
import { removeNotification } from "../../actions/notification-actions";

import "./App.css";
import Map from "../map-view/MapView";
import RouteDetailsView from './../route-details-view/RouteDetailsView';
import RouteChooserPopup from "./../route-chooser-popup/RouteChooserPopup";

/**
 * A React component that holds the entire app.
 */
class App extends React.Component {

    /**
     * This method gets called when the component mounts to
     * the DOM
     */
    componentDidMount(){       
        if (!("Notification" in window)){
            alert("Notifications are not supported in this browser!");
        }

        Notification.requestPermission();
        this.props.startAlarm();
    }

    /**
     * This method gets called when the component unmounts
     * from the DOM
     */
    componentWillUnmount(){
        this.props.stopAlarm();
    }

    /**
     * Dispatches the notification on both the web notification
     * and on the toast.
     */
    dispatchNotification = (message, duration) => {

        // Dispatch the web notification container
        Notification.requestPermission()
            .then((permission) => {
                if (permission !== "granted"){
                    throw new Error("No access!");
                }
            })
            .then(() => {
                let notification = new Notification(message);

                // Close the notification after 10 seconds
                setTimeout(() => {
                    notification.close();
                }, duration);
            })
            .catch(() => {
                console.log("We have no access here!");
            });

        // Notifiy the user via the toast UI
        toast(message, {
            position: toast.POSITION.BOTTOM_CENTER
        });
    }
    /**
     * Renders the component
     */
    render() {
        if (this.props.notifications.text !== null){
            let message = this.props.notifications.text;
            let duration = this.props.notifications.duration;

            this.dispatchNotification(message, duration);
            this.props.removeNotification();
        }
        
        return (
            <div className="app-container">
                {
                    this.props.displayTripDetails 
                        ? <div className="left-panel">
                            <RouteDetailsView />
                         </div>
                        : null
                }
                <div className="right-panel">
                    <Map />
                </div>	
                {
                    this.props.displayTripDetails
                        ? null
                        : <RouteChooserPopup/>
                }
                <ToastContainer />
            </div>
        )
    }
}

/**
 * Maps part of the store's state to this component
 * @param {Object} state The store's state
 */
function mapStateToProps(state){
    return {
        displayTripDetails: state.selectedTrip.tripID !== null,
        notifications: {
            text: state.notifications.text,
            duration: state.notifications.duration
        }
    };
}

const mapDispatchToProps = {
    startAlarm: startAlarm,
    stopAlarm: stopAlarm,
    removeNotification: removeNotification
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
