import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import OutsideClickHandler from 'react-outside-click-handler';
import $ from "jquery";

//import components
import SearchBar from "../components/SearchBar"
import LoadingSpinner from "../components/LoadingSpinner";

//import assets
import mockUps from "../assets/mockups.png"
import GlossaryText from "../components/GlossaryText";
import SliceExplanationText from "../components/SliceExplanationText";


/**
 * Homepage component
 */
class Home extends Component {

    //class variable to track if the component is mounted
    _isMounted = false;

    /**
     * Constructor
     * @param props
     */
    constructor(props) {

        super(props);

        this.isMobile = this.props.isMobile;

        this.state = {
            isLoading: true,
            error: null,
            databaseSize: 0,
        };
        this.getDatabaseSize();

    }


    /**
     * Called after component has mounted
     */
    componentDidMount() {
        this._isMounted = true;
        document.title = "Home | Football Slices";
        this.props.recordPageViewGA(window.location.pathname);
    }


    /**
     * Function to send a post request to the server to retrieve the number of players currently in the database
     */
    getDatabaseSize = () => {

        //fetch sample players
        fetch('/api/databaseSize', {
            method: 'get',
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(res => res.json())
        .then(databaseSize => {
            //only set state if the component is mounter
            if (this._isMounted){
                this.setState({databaseSize: databaseSize.value, isLoading: false});
                //hard code the height of home and the navbar container if it is a mobile device
                //this is done because the soft keyboards on mobile devices affect the view-height
                if (this.isMobile){
                    let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                    $("#home").css({"height": height});
                }
                //add preload class to the hidden menu to disable the first animation
                $("#navbar-hidden").addClass('preload');
            }
        })
        .catch(error => {
            if (this._isMounted){
                this.setState({
                    error: error,
                    isLoading: false
                })
            }
        });

    };


    /**
     * Called just before the component un-mounts
     */
    componentWillUnmount() {
        this._isMounted = false;
    }


    /**
     * Function to display/hide the responsive navbar
     */
    toggleNavbar = () => {

        //select the responsive navbar element
        let responsiveNavbar = $(".responsive-navbar");

        //expand or hide based on current state
        if (responsiveNavbar.attr("id") === "navbar-hidden"){
            responsiveNavbar.attr("id", "navbar-expanded");
        }
        else {
            //remove preload class when expanding to re-enable animations
            $("#navbar-expanded").removeClass('preload');
            responsiveNavbar.attr("id", "navbar-hidden");
        }

    };


    /**
     * Function to hide the navbar (called after one of the menu options is clicked)
     */
    hideNavbar = () => {

        $("#navbar-expanded").removeClass('preload');
        $(".responsive-navbar").attr("id", "navbar-hidden");

    };


    /**
     * render function
     * @return {*} - JSX code for the homepage
     */
    render() {

        let { isLoading, error, databaseSize } = this.state;

        //display loading spinner while the server responds to POST request for the sample players
        if (isLoading) {
            return (
                <LoadingSpinner/>
            )
        }

        //display the error message screen if an error is caught
        else if (error !== null) {
            return (
                <div id="main2">
                    <SearchBar
                        isMobile={this.isMobile}
                        page="home"
                    />
                    <div className="screen" id="error-screen">
                        <p>{error.message}</p>
                    </div>
                </div>
            )
        }

        //return homepage code otherwise
        else {

            // //construct the sample player buttons
            // let samplePlayerButton = [];
            // for (let i=0; i<samplePlayers.length; i++){
            //     let current = samplePlayers[i];
            //     samplePlayerButton.push(
            //         <PlayerSearchResult
            //             page = "home"
            //             code = {current.code}
            //             name = {current.name}
            //             clubs = {current.clubs}
            //             nationality = {current.nationality}
            //             key = {i}
            //         />
            //     );
            // }

            //static JSX code for the homepage
            return (
                <div id="homepage">
                    <OutsideClickHandler
                        onOutsideClick={this.hideNavbar}
                    >
                        <div id="navbar-container">
                            <div className="navbar" id="navbar-normal">
                                <a onClick={this.hideNavbar} href="#home">
                                    <div>Home</div>
                                </a>
                                <a href="#about">
                                    <div>About</div>
                                </a>
                                <a href="#glossary">
                                    <div>Glossary</div>
                                </a>
                                <a href="#faq">
                                    <div>F.A.Q.</div>
                                </a>
                                <a href="#contact">
                                    <div>Contact</div>
                                </a>
                                <button onClick={this.toggleNavbar} id="burger-icon-container">
                                    <div id="burgerIcon"><i className="fa fa-bars"/></div>
                                </button>
                            </div>
                            <div className="navbar responsive-navbar" id="navbar-hidden">
                                <a onClick={this.hideNavbar} href="#about">
                                    <div>About</div>
                                </a>
                                <a onClick={this.hideNavbar} href="#glossary">
                                    <div>Glossary</div>
                                </a>
                                <a onClick={this.hideNavbar} href="#faq">
                                    <div>F.A.Q.</div>
                                </a>
                                <a onClick={this.hideNavbar} href="#contact">
                                    <div>Contact</div>
                                </a>
                            </div>
                        </div>
                    </OutsideClickHandler>
                    <div id="home">
                        <h1>Football<span style={{color: '#e4c000'}}>Slices</span></h1>
                        <SearchBar
                            isMobile={this.isMobile}
                            page="home"
                        />
                        <br/>
                        <br/>
                        <br/>
                        <Link to={"/advancedSearch"}>
                            <button id="lucky-button">
                                Advanced Search
                            </button>
                        </Link>
                    </div>
                    <div id="about" className="homepage-section-container centered-section">
                        <div id="about-section-container">
                            <div id="about-text">
                                <h2>About</h2>
                                <p>
                                    Football Slices is a stats visualization tool powered
                                    by <a href="https://www.highcharts.com" target="_blank" rel="noopener noreferrer">Highcharts.js</a>,
                                    and adapted from <a href="https://projects.fivethirtyeight.com/world-cup-comparisons/" target="_blank" rel="noopener noreferrer">
                                    FiveThirtyEight's World Cup player profiles.</a>
                                </p>
                                <p>
                                    It is built on a database of <b>{databaseSize.toLocaleString()} players</b> from <b>Europe's top 5 leagues</b>,
                                    with stats from the <b>2018/19 season onwards</b>.
                                </p>
                                <p>
                                    Football Slices is made possible by the incredible work done by the people over
                                    at <a href="https://www.fbref.com" target="_blank" rel="noopener noreferrer">FBref.com</a>,
                                    who provide advanced stats courtesy of <a href="https://www.statsbomb.com" target="_blank" rel="noopener noreferrer">StatsBomb</a>.
                                    Every chart title has a link to the player's page on FBref, where you can find that player's
                                    complete stats sheet. Please do make sure to check out FBref and spread the word about
                                    them if you'd like to see them continue adding more data to their site.
                                </p>
                                <br/>
                                <div>
                                    <SliceExplanationText/>
                                </div>
                            </div>
                            <div id="about-image">
                                <img src={mockUps} alt="Mock-ups"/>
                            </div>
                        </div>
                    </div>
                    <div id="glossary" style={{backgroundColor: '#f5f6f7'}} className="homepage-section-container centered-section">
                        <GlossaryText/>
                    </div>
                    <div id="faq" className="homepage-section-container centered-section">
                        <div id="faq-section-container">
                            <h2>F.A.Q.</h2>
                            <div id="faq-container">
                                <div className="faq-item">
                                    <p><span className="accented-p">Where does the data come from?</span></p>
                                    <p>
                                        All stats are from <a href="https://www.fbref.com" target="_blank" rel="noopener noreferrer">FBref.com</a>,
                                        who provide advanced stats courtesy of <a href="https://www.statsbomb.com" target="_blank" rel="noopener noreferrer">StatsBomb</a>.
                                        The metadata is from <a href="https://www.whoscored.com" target="_blank" rel="noopener noreferrer">WhoScored.com</a>.
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">Who's included in the database? How often is it updated?</span></p>
                                    <p>
                                        The database includes all top 5 league players who've made 4 or more league appearances
                                        in any of the covered seasons. It is updated about once a week.
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">How are the percentile ranks calculated?</span></p>
                                    <p>
                                        The percentile rank of a score is the percentage of scores within a dataset
                                        that are equal to or lower than the score. This is reversed for stats where
                                        a lower value is better, such as 'turnovers'.
                                    </p>
                                    <p>
                                        The percentile ranks for FootballSlices are position-specific. For example,
                                        selecting the 'forward' template compares the selected player only to other forwards in the
                                        database. The percentile ranks are also season-specific. For example, selecting competitions
                                        from the 2018/19 season will only compare the selected player to the 2018/19 dataset. Selecting
                                        competitions from multiple seasons will compare the selected player to the combined dataset.
                                    </p>
                                    <p>
                                        However, please note that the percentile ranks are not competition-specific. In other words,
                                        the selected player's stats are always compared to other players' stats from all competitions, regardless
                                        of which competitions are toggled for the selected player.
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">How are the possession-adjusted stats calculated?</span></p>
                                    <p>
                                        Possession-adjusted offensive stats are obtained by calculating the number of times
                                        a player completes an action for every 100 touches of the ball they have.
                                    </p>
                                    <p>
                                        Defensive stats are adjusted for possession using a modfied version of the StatsBomb sigmoid function,
                                        which you can read more about <a href="https://statsbomb.com/2014/06/introducing-possession-adjusted-player-stats/"
                                                                    target="_blank" rel="noopener noreferrer">here</a>.
                                        Each player's stats for a particular competition are adjusted based on the number of touches
                                        their team conceded in different thirds of the pitch during said competition.
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">How are the player positions decided?</span></p>
                                    <p>
                                        Position data is obtained using the 'detailed' tab of the <a href="https://whoscored.com/Statistics" target="_blank" rel="noopener noreferrer">
                                        WhoScored.com player statistics table</a> to find all players who've made 10 or more
                                        league starts in each of the template positions during a particular season.
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">
                                        Will the database be expanded to include seasons before 2018/19 and players outside the top 5 leagues?
                                    </span></p>
                                    <p>
                                        Probably not. At present, <a href="https://www.fbref.com" target="_blank" rel="noopener noreferrer">FBref.com</a>'s advanced stats
                                        are only available for a few seasons and leagues.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="contact" style={{backgroundColor: '#f5f6f7'}} className="homepage-section-container">
                        <div id="contact-section-container">
                            <h2>Contact</h2>
                            <p>
                                For any bug reports, suggestions or questions, please feel free to reach out to me
                                at either of the following:
                            </p>
                            <ul>
                                <li>Twitter: <a href="https://twitter.com/FootballSlices" target="_blank" rel="noopener noreferrer">@FootballSlices</a></li>
                                <li>Email: <a href="mailto:footballslices@gmail.com" target="_blank" rel="noopener noreferrer">FootballSlices@gmail.com</a></li>
                            </ul>
                            <p>
                                Note: Football Slices is a hobby project created and maintained
                                by Ham (<a href="https://twitter.com/DyslexicDdue" target="_blank" rel="noopener noreferrer">@DyslexicDdue</a>).
                                I try to implement as many suggested features as I can, but unfortunately, I can't
                                guarantee that I'll get to everything.
                            </p>
                        </div>
                    </div>
                </div>
            );

        }

    }

}

export default Home;
