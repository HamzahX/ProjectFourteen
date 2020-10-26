import React, { Component } from 'react';


/**
 * Component to render the player comparison search screen
 * Also handles the live search requests and aborts
 */
class LoaderOverlay extends Component {

    /**
     * render function
     * displays the export loader overlay
     * @return {*} - JSX code for the searchbar and its container
     */
    render() {

        //return JSX code for the searchbar
        return (
            <div className={`overlay ${this.props.display ? "open" : "closed"}`} id="export-loader-overlay">
                <div className="loader">Loading...</div>
            </div>

        );

    }

}

export default (LoaderOverlay);
