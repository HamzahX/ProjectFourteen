import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Flag from "react-flags";


/**
 * Component to render a club search result
 */
class ClubSearchResult extends Component {

    constructor(props) {

        super(props);

        this.isMobile = this.props.isMobile;

        this.state = {
            page: this.props.page,
            name: this.props.name,
            countryCode: this.props.countryCode
        };

    }


    /**
     * render function
     * @return {*} - JSX code for a club search result
     */
    render() {

        let { page, name, countryCode } = this.state;

        let flagSizeMultiplier = this.isMobile ? 2 : 1;

        return (
            <Link to={"/search/" + name + "/all"}>
                <div tabIndex="0" className="search-result">
                    <div className="bio">
                        <span className="name">{name}</span>
                        <Flag
                            basePath={"/flags"}
                            country={countryCode}
                            format="png"
                            pngSize={32}
                            width={(page === "live" ? 24 : 28) * flagSizeMultiplier}
                            height={(page === "live" ? 24 : 28) * flagSizeMultiplier}
                            shiny={true}
                            alt={`${countryCode} Flag`}
                        />
                    </div>
                </div>
            </Link>
        );
    }

}

export default (ClubSearchResult);
