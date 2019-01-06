import React from "react";
import "./RouteChooserPopup.css";

class NearbyTripsChooserPopup extends React.Component {

    handleSubmit = (event) => {
        event.preventDefault();
        console.log("Hi there!");
        console.log(event.target.route.value);

        let selectedTripID = event.target.route.value;
        console.log("I am here!");
        if (selectedTripID === ""){
            // Show error message
        }
        else{
            this.props.onSelectRoute(selectedTripID);
        }
    }

    render() {
        let rows = this.props.routes.map((item, index) => {
            let tripID = item.tripID;
            let shortName = item.shortName;
            let longName = item.longName;

            return (
                <div key={tripID}>
                    <input type="radio" name="route" value={tripID}/>
                    <div className="tripInfo">{shortName + " " + longName}</div>
                </div>
            );
        });
        return (
            <div className="popup-background">
                <div className="popup-container">
                    <div className="popup">
                        <div className="popup-header">
                            <h3>Which bus / train are you on?</h3>
                            <p>
                                There are multiple bus / train routes near your area. 
                                Please select which route you are currently on.
                            </p>
                        </div>
                        <form onSubmit={this.handleSubmit}>
                            <div className="popup-contents">
                                {rows}
                            </div>
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
    }
}

export default NearbyTripsChooserPopup;