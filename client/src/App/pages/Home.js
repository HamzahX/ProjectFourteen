import React, { Component } from 'react';

import SearchBar from "../components/SearchBar"


class Home extends Component {
    render() {
        return (
            <div id="main">
                <SearchBar type={1}/>
                <div className="screen" id="landing-screen">
                </div>
            </div>
        );
    }
}
export default Home;