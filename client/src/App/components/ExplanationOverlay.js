import React, { Component } from 'react';


/**
 * Component to render the explanation overlay
 */
class ExplanationOverlay extends Component {

    constructor(props) {

        super(props);
        this.toggleExplanationOverlay = this.props.toggleExplanationOverlay;

    }


    /**
     * render function
     * displays the player comparison search screen
     * @return {*} - JSX code for the searchbar and its container
     */
    render() {

        //return JSX code for the explanation overlay
        return (
            <div className={`overlay ${this.props.display ? "open" : "closed"}`} id="explanation-overlay">
                <div className={'overlay-inner-container'} id={'explanation-container'}>
                    <button className="close-overlay far fa-times-circle" onClick={this.toggleExplanationOverlay}/>
                    <div className="help-section-container">
                        <h2>Advanced Search</h2>
                        <p>
                            The advanced search page allows you to filter the entire Football Slices database using as
                            many filters as you'd like. These include everything from player metadata such as ages
                            and nationalities, to performance metrics like non-penalty expected goals and successful
                            dribbles.
                        </p>
                        <p>
                            Please note that the <b>aggregates, averages and percentile ranks always include stats from all
                            competitions (leagues + CL/EL), even when the league filter is used.</b> The purpose of the league
                            filter is to remove players who didn't play in one of the selected leagues for the chosen
                            season. However, it does NOT filter the stats themselves.
                        </p>
                        <p>
                            Additionally, <b>percentile ranks are always calculated against the complete top 5 league
                            dataset for a position, regardless of which other filters are selected.</b> For example, if you
                            select full-backs and set the age range to 16 - 24, the percentile ranks are still being calculated
                            against full-backs of all ages, but the results will only show players who fall within the
                            specified age range.
                        </p>
                    </div>
                </div>
            </div>

        );

    }

}

export default (ExplanationOverlay);
