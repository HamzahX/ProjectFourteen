import React, { Component } from 'react';


/**
 * Renders a pure CSS loading spinner
 * taken from: https://projects.lukehaas.me/css-loaders/
 */
class LoadingSpinner extends Component {

    render() {
        return (
            <div id="main">
                <div className="screen" id="loading-screen">
                    <div className="loader">Loading...</div>
                </div>
            </div>
        );
    }

}
export default (LoadingSpinner);
