import React, { Component } from 'react';
import { Link } from 'react-router-dom';


/**
 * Component to render a club search result
 */
class ClubSearchResult extends Component {

    constructor(props) {

        super(props);

        this.state = {
            name: this.props.name,
        };

    }


    /**
     * render function
     * @return {*} - JSX code for a club search result
     */
    render() {

        let { name } = this.state;

        return (
            <Link to={"/search/" + name + "/all"}>
                <div tabIndex="0" className="search-result">
                    <div className="name">{name}</div>
                </div>
            </Link>
        );
    }

}

export default (ClubSearchResult);
