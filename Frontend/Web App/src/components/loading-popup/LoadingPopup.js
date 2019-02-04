import React from "react";
import "./LoadingPopup.css";
import "./../popup/Popup.css"

/**
 * Renders the loading sign.
 */
class LoadingPopup extends React.Component {

    render() {
        return (
            <div className="popup-background">
                <div className="popup-container">
                    <div className="popup">
                        <div className="popup-header"></div>
                        <div className="popup-contents">
                            <div className="loader">
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                            </div>
                            <h2 className="loading-sign">Loading...</h2>
                        </div>
                        <div className="popup-actions-container">
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default LoadingPopup;
