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

class App extends React.Component {

   componentDidMount(){       
        if (!("Notification" in window)){
            alert("Notifications are not supported in this browser!");
        }

        Notification.requestPermission();
        this.props.startAlarm();
    }

    componentWillUnmount(){
        this.props.stopAlarm();
    }

    dispatchNotification = (message, duration) => {

        // Dispatch the web notification container
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

    componentWillUpdate() {
        if (this.props.notifications.text){
            let message = this.props.notifications.text;
            let duration = this.props.notifications.duration;

            this.dispatchNotification(message, duration);
            this.props.removeNotification();
        }
    }

    render() {
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
