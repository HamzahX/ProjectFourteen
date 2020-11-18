import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Flag from "react-flags";
import { getAllEntriesFromObject } from "../utilities/SearchResultUtilities";

/**
 * Component to render a player search result
 */
class PlayerSearchResult extends Component {

    constructor(props) {

        super(props);

        this.isMobile = this.props.isMobile;

        let season = this.props.season;

        let clubs = this.props.clubs;
        let positions = this.props.positions;

        if (season !== null){
            clubs = clubs[season];
            positions = positions[season];
        }

        else {
            clubs = getAllEntriesFromObject(clubs);
            positions = getAllEntriesFromObject(positions);
        }

        this.state = {
            page: this.props.page,
            forComparison: this.props.forComparison,
            comparisonCode: this.props.comparisonCode,
            code: this.props.code,
            name: this.props.name,
            age: this.props.age,
            clubs: clubs,
            nationality: this.props.nationality,
            countryCode: this.props.countryCode,
            positions: positions
        };

    }

    /**
     * render function
     * @return {*} - JSX code for a player search result
     */
    render() {

        let {
            page,
            forComparison,
            comparisonCode,
            code,
            name,
            age,
            clubs,
            nationality,
            countryCode,
            positions
        } = this.state;

        let link;
        //set the link to the comparison page if it is a result for a player comparison
        if (forComparison) {
            link = `/compare/${comparisonCode}_${code}`;
        }
        //set the link to the stats page otherwise
        else {
            link = `/stats/${code}`;
        }

        let flagSizeMultiplier = this.isMobile ? 1.8 : 1;

        //console.log(`${nationality} | ${countryCode}`);

        return (
            <Link to={link}>
                <div tabIndex="0" className="search-result">
                    <div className="bio">
                        <span className="name">{name}</span>
                        <Flag
                            basePath={"/flags"}
                            country={countryCode}
                            format="png"
                            pngSize={32}
                            width={(page === "live" ? 20 : 28) * flagSizeMultiplier}
                            height={(page === "live" ? 20 : 28) * flagSizeMultiplier}
                            shiny={true}
                            alt={`${nationality} Flag`}
                        />
                    </div>
                    <div className="bio-extra">
                        <span className="club">{clubs.join(", ")}</span>
                        <span className="position-age">{`${age} | ${positions.join(", ")}`}</span>
                    </div>
                </div>
            </Link>
        );
    }

}

export default (PlayerSearchResult);
