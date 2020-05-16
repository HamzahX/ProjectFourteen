import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import {isMobileOnly} from 'react-device-detect';
import $ from 'jquery';

import Home from './pages/Home';
import Search from './pages/Search';
import Stats from './pages/Stats';

require('./stylesheets/App.css');
if (isMobileOnly){
    import('./stylesheets/Mobile.css')
    .then(test => {
        console.log("Mobile device detected")
    });
}

class App extends Component {

    constructor(props) {

        super(props);
        this.state = {
            percentileArrays: {},
        };

    }

    componentDidMount() {

        $(function() {

            if (isMobileOnly){
                var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                $("html, body, #root, #root-container").css({"height": height});
            }

        });

        this.getPercentileArrays()

    }

    getPercentileArrays = () => {

        fetch('/api/percentiles', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({

            })
        })
        .then(res => {
            return res.json()
        })
        .then(percentileArrays => this.setState({percentileArrays: percentileArrays}))
        .catch();

    };

    updatePercentileArrays = (newPercentileArrays) => {

        this.setState({
            percentileArrays: newPercentileArrays
        })

    };

    render() {

        const App = () => (
            <div id="root-container">
                <Switch>
                    <Route exact path='/' component={Home}/>
                    <Route exact path='/' render={(props) => <Home {...props} isMobile={isMobileOnly}/>}/>
                    <Route path='/search/:query/:searchByClub?' component={Search}/>
                    <Route path='/stats/:code' render={(props) => <Stats {...props}
                                                                         percentileArrays={this.state.percentileArrays}
                                                                         isMobile={isMobileOnly}
                                                                         updatePercentileArrays={this.updatePercentileArrays}/>}
                    />
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

export default App;