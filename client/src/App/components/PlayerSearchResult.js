import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Flag from "react-flags";

/**
 * Component to render a player search result
 */
class PlayerSearchResult extends Component {

    constructor(props) {

        super(props);

        this.isMobile = this.props.isMobile;

        let clubs = this.props.clubs;
        let percentileEntries = this.props.percentileEntries;
        let seasons = Object.keys(clubs);

        //set the player clubs entry to their most recent season's clubs
        clubs = clubs[seasons[seasons.length-1]];

        //set the player positions to the latest season for which they have position info
        let positions;
        for (let i=seasons.length-1; i>=0; i--){
            let season = seasons[i];
            let currentSeasonPositions = percentileEntries[season];
            positions = (currentSeasonPositions === undefined || currentSeasonPositions.length < 1) ? ["-"] : currentSeasonPositions;
            if (positions[0] !== "-"){
                break;
            }
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
