import React from "react";
import "./../popup/Popup.css";

/**
 * This component renders an "Out of route" message
 */
class EndOfRoutePopup extends React.Component {
    state = {
        countdownValue: 5
    }
    
    /**
     * This method gets called after the component mounts
     * to the DOM
     */
    componentDidMount() {
        this.countdownInterval = setInterval(() => {
            if (this.state.countdownValue <= 0){
                this.props.restartApp();
            }

            else{
                this.setState((prevState, props) => {
                    return {
                        countdownValue: prevState.countdownValue - 1
                    };
                });
            }
        }, 1000);
    }

    /**
     * This method gets called before the component unmounts
     * from the DOM.
     */
    componentWillUnmount(){
        if (this.countdownInterval){
            clearInterval(this.countdownInterval);
        }
    }

    /**
     * Renders the component on the DOM.
     */
    render() {
        return (
            <div className="popup-background">
                <div className="popup-container">
                    <div className="popup">
                        <div className="popup-header">
                            <h3>Which bus / train are you on?</h3>
                        </div>
                        <form onSubmit={this.handleSubmit}>
                            <div className="popup-contents">
                                <p>The bus or train has completed its trip! You will need to select a different trip.</p>
					            <p>You will be redirected in <span>{this.state.countdownValue} seconds</span>.</p>
                            </div>
                            <div className="popup-actions-container">
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

export default EndOfRoutePopup;
