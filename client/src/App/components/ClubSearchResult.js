import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class ClubSearchResult extends Component {

    constructor(props) {
        super(props);

        this.state = {
            name: this.props.name,
        };

    }

    render() {
        return (
            <Link to={"/search/" + this.state.name + "/all"}>
                <div tabIndex="0" className="search-result">
                    <div className="name">{this.state.name}</div>
                </div>
            </Link>
        );
    }

}

export default (ClubSearchResult);