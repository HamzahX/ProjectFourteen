import React, { Component } from 'react';

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