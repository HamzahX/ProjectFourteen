import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Search from './pages/Search';
import Stats from './pages/Stats';

import $ from 'jquery';

import FWPercentiles from './percentiles/FWPercentiles';
import AMPercentiles from './percentiles/AMPercentiles';
import CMPercentiles from './percentiles/CMPercentiles';
import FBPercentiles from './percentiles/FBPercentiles';
import CBPercentiles from './percentiles/CBPercentiles';


class App extends Component {

    constructor(props) {
        super(props);
        let percentiles = [];
        percentiles.push(FWPercentiles);
        percentiles.push(AMPercentiles);
        percentiles.push(CMPercentiles);
        percentiles.push(FBPercentiles);
        percentiles.push(CBPercentiles);
        this.state = {
            percentiles: percentiles
        }
    }

    componentDidMount() {
        $(function() {
            var isMobile = false;

            if ($('body').css('background-color') === 'rgb(255, 255, 254)') {
                isMobile = true;
            }

            if (isMobile){
                var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                $("html, body, #root, #root-container").css({"height":h});
            }

        });
    }

    render() {

        const App = () => (
            <div id="root-container">
                <Switch>
                    <Route exact path='/' component={Home}/>
                    <Route path='/search/:query' component={Search}/>
                    <Route path='/stats/:URL' render={(props) => <Stats {...props} percentiles={this.state.percentiles} />}/>
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