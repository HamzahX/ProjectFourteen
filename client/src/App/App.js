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
            percentiles: {},
            isMobile: false
        };

    }

    componentDidMount() {

        $(function() {

            if (isMobileOnly){
                var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                $("html, body, #root, #root-container").css({"height": height});
            }

        });

        this.getPercentiles()

    }

    getPercentiles = () => {

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
        .then(percentiles => this.setState({percentiles: percentiles}))
        .catch();

    };

    render() {

        const App = () => (
            <div id="root-container">
                <Switch>
                    <Route exact path='/' component={Home}/>
                    <Route exact path='/' render={(props) => <Home {...props} isMobile={isMobileOnly}/>}/>
                    <Route path='/search/:query/:searchByClub?' component={Search}/>
                    <Route path='/stats/:URL' render={(props) => <Stats {...props} percentiles={this.state.percentiles} isMobile={isMobileOnly}/>}/>
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
