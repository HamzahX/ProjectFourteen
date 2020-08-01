import React, { Component } from 'react';
import SearchBar from "./SearchBar";


/**
 * Component to render the player comparison search screen
 * Also handles the live search requests and aborts
 */
class CompareSearchOverlay extends Component {

    constructor(props) {

        super(props);

        this.isMobile = this.props.isMobile;

        this.toggleCompareSearch = this.props.toggleCompareSearch;
        this.currentPlayerName = this.props.currentPlayerName;
        this.currentPlayerCode = this.props.currentPlayerCode;

    }


    /**
     * render function
     * displays the player comparison search screen
     * @return {*} - JSX code for the searchbar and its container
     */
    render() {

        //return JSX code for the searchbar
        return (
            <div className={`overlay ${this.props.display ? "open" : "closed"}`} id="compare-search-overlay">
                <button className="far fa-times" onClick={this.toggleCompareSearch} id="close-compare-search-overlay">
                </button>
                <span><h3>Compare {this.currentPlayerName} to...</h3></span>
                <SearchBar
                    isMobile={this.isMobile}
                    page="compare"
                    currentPlayerCode={this.currentPlayerCode}
                />
            </div>

        );

    }

}

export default (CompareSearchOverlay);
