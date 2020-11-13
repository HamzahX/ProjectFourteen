import React, { Component } from 'react';
import { withRouter, Route, Switch } from 'react-router-dom';
import ReactGA from 'react-ga';
import {isMobileOnly, isSafari} from 'react-device-detect';

//import pages
import Home from './pages/Home';
import Search from './pages/Search';
import Stats from './pages/Stats';
import Compare from './pages/Compare';
import Error from './pages/Error';
import AdvancedSearch from "./pages/AdvancedSearch";

//import stylesheets, including mobile stylesheet if it is a mobile device
require('./stylesheets/App.css');
if (isMobileOnly){
    import('./stylesheets/Mobile.css')
    .then( () => {
    });
}

//initialize Google Analytics
ReactGA.initialize('UA-179497563-1');


/**
 * Main app component. Handles routing, and the retrieval of percentile arrays.
 */
class App extends Component {


    /**
     * Constructor
     * @param props
     */
    constructor(props) {

        super(props);

        let percentileArrays = JSON.parse(localStorage.getItem('percentileArrays'));

        if (percentileArrays === null){
            percentileArrays = {
                lastUpdated: null
            }
        }

        this.state = {
            isLoading: true,
            percentileArrays: percentileArrays,
        };

        this.getPercentileArrays();

    }


    /**
     * Function to send a POST request to the server to retrieve the percentile arrays
     */
    getPercentileArrays = () => {

        //retrieve percentile arrays and set isLoading to false
        fetch('/api/percentiles', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "percentilesTimestamp": this.state.percentileArrays['lastUpdated']
            })
        })
        .then(res => {
            return res.json()
        })
        .then(percentileArrays => {
            if (percentileArrays === null){
                this.setState({isLoading: false})
            }
            else {
                localStorage.setItem('percentileArrays', JSON.stringify(percentileArrays));
                this.setState({percentileArrays: percentileArrays, isLoading: false})
            }
        })
        .catch();

    };


    /**
     * Function to record a Google Analytics page view
     * Passed to page components as a prop, and called on page load
     * @param {string} location - the URL of the page for which the view is being recorded
     */
    recordPageViewGA = (location) => {

        ReactGA.pageview(location);

    };


    /**
     * Function to update percentile arrays (called from Stats and Compare pages)
     * @param {Object} newPercentileArrays - the object representing the new percentile arrays
     */
    updatePercentileArrays = (newPercentileArrays) => {

        localStorage.setItem('percentileArrays', JSON.stringify(newPercentileArrays));

        this.setState({
            percentileArrays: newPercentileArrays
        })

    };


    /**
     * render function
     * @return {*} - JSX code for the website routing
     */
    render() {

        let { isLoading } = this.state;

        //display loading message while server responds to POST request for the percentile arrays
        if (isLoading) {
            return (
                <div id="main">
                    <div className="screen" id="loading-screen">
                        <p>Connecting...</p>
                    </div>
                </div>
            )
        }

        //return routing code otherwise
        else {

            return (
                <Switch>
                    <Route exact path='/' render={(props) =>
                        <Home
                            {...props}
                            isMobile={isMobileOnly}
                            recordPageViewGA={this.recordPageViewGA}
                        />}
                    />
                    <Route exact path='/search/:query/:searchByClub?' render={(props) =>
                        <Search
                            {...props}
                            isMobile={isMobileOnly}
                            recordPageViewGA={this.recordPageViewGA}
                        />}
                    />
                    <Route exact path='/advancedSearch' render={(props) =>
                        <AdvancedSearch
                            {...props}
                            isMobile={isMobileOnly}
                            recordPageViewGA={this.recordPageViewGA}
                        />}
                    />
                    <Route exact path='/stats/:code' render={(props) =>
                        <Stats
                            {...props}
                            isMobile={isMobileOnly}
                            isSafari={isSafari}
                            recordPageViewGA={this.recordPageViewGA}
                            percentileArrays={this.state.percentileArrays}
                            updatePercentileArrays={this.updatePercentileArrays}
                        />}
                    />
                    <Route exact path='/compare/:codes' render={(props) =>
                        <Compare
                            {...props}
                            isMobile={isMobileOnly}
                            isSafari={isSafari}
                            recordPageViewGA={this.recordPageViewGA}
                            percentileArrays={this.state.percentileArrays}
                            updatePercentileArrays={this.updatePercentileArrays}
                        />}
                    />
                    <Route component={Error}/>
                </Switch>
            );

        }

    }

}

export default withRouter(App);
