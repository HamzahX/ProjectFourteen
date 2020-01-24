import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Search from './pages/Search';
import Stats from './pages/Stats';

import $ from 'jquery';

class App extends Component {

    constructor(props) {

        super(props);
        this.state = {
            percentiles: {},
            isMobile: false
        };

    }

    componentDidMount() {

        var isMobile = false;
        var self = this;

        $(function() {

            if ($('body').css('background-color') === 'rgb(255, 255, 254)') {
                isMobile = true;
            }

            if (isMobile){
                var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                $("html, body, #root, #root-container").css({"height":h});
                self.setState({
                    isMobile: isMobile
                })
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
                    <Route path='/search/:query' component={Search}/>
                    <Route path='/stats/:URL' render={(props) => <Stats {...props} percentiles={this.state.percentiles} isMobile={this.state.isMobile} />}/>
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