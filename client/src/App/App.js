import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import {isMobileOnly, isSafari} from 'react-device-detect';
import $ from 'jquery';

//import pages
import LoadingSpinner from "./components/LoadingSpinner";
import Home from './pages/Home';
import Search from './pages/Search';
import Stats from './pages/Stats';
import Compare from './pages/Compare';

//import stylesheets, including mobile stylesheet if it is a mobile device
require('./stylesheets/App.css');
if (isMobileOnly){
    import('./stylesheets/Mobile.css')
    .then( () => {
    });
}


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
        this.state = {
            isLoading: true,
            percentileArrays: {},
        };
        this.getPercentileArrays();

    }


    /**
     * Called after component has mounted
     */
    componentDidMount() {

        //hard code the height of html, body, root and root-container if it is a mobile device
        //this is done because the soft keyboards on mobile devices affect the vh
        if (isMobileOnly){
            var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            $("html, body, #root, #root-container").css({"height": height});
        }

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
            body: JSON.stringify({})
        })
        .then(res => {
            return res.json()
        })
        .then(percentileArrays => this.setState({percentileArrays: percentileArrays, isLoading: false}))
        .catch();

    };


    /**
     * Function to update percentile arrays (called from Stats and Compare pages)
     * @param {Object} newPercentileArrays - the object representing the new percentile arrays
     */
    updatePercentileArrays = (newPercentileArrays) => {

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
                <LoadingSpinner/>
            )
        }

        //return routing code otherwise
        else {

            const App = () => (
                <div id="root-container">
                    <Switch>
                        <Route exact path='/' render={(props) =>
                            <Home {...props}
                                  isMobile={isMobileOnly}
                            />}
                        />
                        <Route path='/search/:query/:searchByClub?' component={Search}/>
                        <Route path='/stats/:code' render={(props) =>
                            <Stats {...props}
                                 percentileArrays={this.state.percentileArrays}
                                 isMobile={isMobileOnly}
                                 isSafari={isSafari}
                                 updatePercentileArrays={this.updatePercentileArrays}
                            />}
                        />
                        <Route path='/compare/:codes' render={(props) =>
                            <Compare {...props}
                                   percentileArrays={this.state.percentileArrays}
                                   isMobile={isMobileOnly}
                                   isSafari={isSafari}
                                   updatePercentileArrays={this.updatePercentileArrays}
                            />}
                        />
                        <Route path='*' component={Home}/>
                    </Switch>
                </div>
            );

            return (
                <Switch>
                    <App/>
                </Switch>
            );

        }

    }

}

export default App;
