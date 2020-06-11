import React, { Component } from 'react';
import { Router, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history'
import ReactGA from 'react-ga';
import {isMobileOnly, isSafari} from 'react-device-detect';

//import pages
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

//initialize Google Analytics
ReactGA.initialize('UA-168675037-1');
//listen for route changes and record a page-view in Google Analytics for each one
const history = createBrowserHistory();
history.listen((location, action) => {
    ReactGA.pageview(location.pathname + location.search);
});


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

        //record the first page-view in Google Analytics
        //this is done because history.listen() only records route changes, but doesn't record the first page on load
        ReactGA.pageview(window.location.pathname + window.location.search);

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
                <div id="main">
                    <div className="screen" id="loading-screen">
                        <p>...</p>
                    </div>
                </div>
            )
        }

        //return routing code otherwise
        else {

            const App = () => (
                <Router history={history}>
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
                </Router>
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
