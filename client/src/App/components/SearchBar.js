import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';


/**
 * Component to render a div containing a searchbar
 */
class SearchBar extends Component {

    constructor(props) {

        super(props);

        this.state = {
            page: this.props.page,
            query: this.props.query || "",
        };

    }

    /**
     * Function to change the value of the searchbar query
     * @param {Object} event - the input event from the searchbar input
     */
    handleChange = (event) => {
        this.setState({query: event.target.value});
    };


    /**
     * Function to handle submit events from the searchbar input
     * Redirects to the search URL with the correct URL params
     * @param {Object} event - the submit event from the searchbar input
     */
    handleSubmit = (event) => {
        event.preventDefault();
        this.props.history.push('/search/' + this.state.query);
    };


    /**
     * render function
     * modifies searchbar based on the page it is to be displayed on
     * @return {*}
     */
    render() {

        const { page, query } = this.state;

        let containerID;
        let homeButton;

        //change the searchbar container id based on the page so that the CSS rules modify it accordingly
        switch (page) {
            case "home":
                containerID = "searchbar-container1";
                break;
            case "search":
                containerID = "searchbar-container2";
                break;
            case "stats":
                containerID = "searchbar-container3";
                break;
            default:
                containerID = "searchbar-container1";
        }

        //attach a home button to the searchbar if it is not being displayed on the homepage
        if (page !== "home"){
            homeButton =
                <Link to={'/'}>
                    <div id="home-button">
                        <div>
                            Football
                            <span style={{color: '#e4c000', display: 'block'}}>Slices
                            <span style={{color: 'black'}}>.com</span></span>
                        </div>
                    </div>
                </Link>;
        }

        //return JSX code for the searchbar
        return (
            <div className="searchbar-container" id={containerID}>
                <form id="searchbar-form" onSubmit={this.handleSubmit}>
                    {homeButton}
                    <input
                        type="text"
                        id="searchbar-input"
                        value={query}
                        placeholder="Search for players, clubs..."
                        autoComplete="off"
                        onChange={this.handleChange}
                    />
                </form>
            </div>
        );

    }

}

export default withRouter (SearchBar);
