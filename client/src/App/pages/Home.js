import React, { Component } from 'react';
import $ from "jquery";

//import components
import SearchBar from "../components/SearchBar"
import PlayerSearchResult from "../components/PlayerSearchResult"
import LoadingSpinner from "../components/LoadingSpinner";

//import assets
import mockUps from "../assets/mockups.png"


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
        this.state = {
            isMobile: this.props.isMobile,
            isLoading: true,
            samplePlayers: [],
        };
        this.getSamplePlayers();

    }


    /**
     * Called after component has mounted
     */
    componentDidMount() {
        this._isMounted = true;
    }


    /**
     * Function to send a post request to the server to retrieve 3 sample players to be displayed on the homepage
     */
    getSamplePlayers = () => {

        let isMobile = this.state.isMobile;

        //fetch sample players
        fetch('/api/samplePlayers', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        })
        .then(res => res.json())
        .then(samplePlayers => {
            //only set state if the component is mounter
            if (this._isMounted){
                this.setState({samplePlayers: samplePlayers, isLoading: false});
                //hard code the height of home and the navbar container if it is a mobile device
                //this is done because the soft keyboards on mobile devices affect the view-height
                if (isMobile){
                    var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                    var navbarHeight = 0.06 * height;
                    $("#home").css({"height": height});
                    $("#navbar-container").css({"height": navbarHeight});
                }
                //add preload class to the hidden menu to disable the first animation
                $("#navbar-hidden").addClass('preload');
            }
        })

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

        let { isLoading, samplePlayers } = this.state;

        //display loading spinner while the server responds to POST request for the sample players
        if (isLoading) {
            return (
                <LoadingSpinner/>
            )
        }

        //return homepage code otherwise
        else {

            //construct the sample player buttons
            let samplePlayerButtons = [];
            for (let i=0; i<samplePlayers.length; i++){
                let current = samplePlayers[i];
                samplePlayerButtons.push(
                    <PlayerSearchResult
                        page = "home"
                        code = {current.code}
                        name = {current.name}
                        clubs = {current.clubs}
                        nationality = {current.nationality}
                        key = {i}
                    />
                );
            }

            //static JSX code for the homepage
            return (
                <div id="homepage">
                    <div id="navbar-container">
                        <div className="navbar" id="navbar-normal">
                            <a href="#home">
                                <div>Home</div>
                            </a>
                            <a href="#preview">
                                <div>Preview</div>
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
                            <a onClick={this.hideNavbar} href="#preview">
                                <div>Preview</div>
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
                    <div id="home">
                        <h1>Football<span style={{color: '#e4c000'}}>Slices</span></h1>
                        <SearchBar page="home"/>
                        <br/>
                        <br/>
                        <p>...or try using a sample player</p>
                        <br/>
                        <div id="sample-results">
                            {samplePlayerButtons}
                        </div>
                    </div>
                    <div id="preview" className="homepage-section-container">
                        <div id="preview-section-container">
                            <div id="preview-text">
                                <h2>Preview</h2>
                                <p>
                                    FootballSlices are stats visualizations that are supported by an
                                    entirely automated data retrieval process. The tool sifts through mountains of
                                    numbers so you don't have to!
                                </p>
                                <p>
                                    Explore a database of more than <b>2,700 players</b> from <b>Europe's top 5 leagues</b>,
                                    with stats from the <b>2018/19</b> and <b>2019/20</b> seasons.
                                </p>
                                <p>
                                    Simply choose a positional template, toggle the competitions you'd like to include,
                                    and visualize statistics in seconds with interactive percentile rank bar
                                    charts, powered by <a href="https://www.highcharts.com" target="_blank" rel="noopener noreferrer">Highcharts.js</a>.
                                </p>
                                <p><span className="accented-p">Interpreting FootballSlices</span></p>
                                <p>
                                    Each slice is made up of wedges. The size of each wedge corresponds to the
                                    percentile rank of the selected player with regards to the stat represented by the
                                    wedge. The data labels show the raw values.
                                </p>
                                <p>
                                    The colours help to group similar-ish stats together (as well as improve the charts'
                                    visual impact).
                                </p>
                                <ul>
                                    <li><span style={{color: '#f15c80', fontWeight: 'bold'}}>Red</span> is for goal-scoring & shooting stats,</li>
                                    <li><span style={{color: '#e4c000', fontWeight: 'bold'}}>Yellow</span> is for passing, chance creation & ball progression</li>
                                    <li><span style={{color: '#87e179', fontWeight: 'bold'}}>Green</span> is for dribbling & ball retention</li>
                                    <li><span style={{color: '#7db9f0', fontWeight: 'bold'}}>Blue</span> is for defending</li>
                                    <li>and <span style={{color: '#787ccd', fontWeight: 'bold'}}>Purple</span> is for goalkeeping stats</li>
                                </ul>
                            </div>
                            <div id="preview-image">
                                <img src={mockUps} alt="Mock-ups"/>
                            </div>
                        </div>
                    </div>
                    <div id="glossary" style={{backgroundColor: '#f5f6f7'}} className="homepage-section-container">
                        <div id="glossary-section-container">
                            <h2>Glossary</h2>
                            <ul>
                                <li>
                                    <span style={{color: '#f15c80', fontWeight: 'bold'}}>Non-Penalty Goal</span>&nbsp;
                                    A goal that did not stem directly from a penalty kick.
                                </li>
                                <li>
                                    <span style={{color: '#f15c80', fontWeight: 'bold'}}>Non-Penalty xG (Expected Goals)</span>&nbsp;
                                    Expected goals that did not stem directly from penalty kicks.*
                                </li>
                                <li>
                                    <span style={{color: '#f15c80', fontWeight: 'bold'}}>Non-Penalty xG/Shot</span>&nbsp;
                                    The average expected goal value of shots taken, excluding penalty kicks.
                                </li>
                                <li>
                                    <span style={{color: '#f15c80', fontWeight: 'bold'}}>Conversion Rate</span>&nbsp;
                                    The percentage of shots that resulted in goals, excluding penalty kicks.
                                </li>
                                <li>
                                    <span style={{color: '#f15c80', fontWeight: 'bold'}}>Aerial Win %</span>&nbsp;
                                    The percentage of aerials duels contested that were won.
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Touch in Box</span>&nbsp;
                                    Having possession of the ball in the opposition's penalty area.
                                    (Note: Receiving a pass, then dribbling, then sending a pass counts as one touch)
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>xA (Expected Assists)</span>&nbsp;
                                    Expected goals that resulted from shot assists, including set pieces.*
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>OP (Open Play) Shot-Creating Action</span>&nbsp;
                                    Excluding set pieces, one of the last two offensive actions that directly
                                    led to a shot; such as a pass, dribble or a drawn foul.
                                    (Note: A single player can receive credit for multiple actions and the shot-taker can also receive credit)
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Pass into Box</span>&nbsp;
                                    A completed pass that entered the opposition's penalty area, excluding set pieces.
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Pass into Final 1/3</span>&nbsp;
                                    A completed pass that entered the third of the pitch that is closest to the opposition's goal, excluding set pieces.
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Progressive Distance</span>&nbsp;
                                    Distance, in yards, that the ball was moved towards the oppositions's goal
                                    with passes and carries.
                                    (Note: Passes and carries away from the oppositions's goal are counted as zero progressive yards)
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Pass Completion %</span>&nbsp;
                                    The percentage of attempted passes that successfully found a teammate.
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Long Pass Completion %</span>&nbsp;
                                    The percentage of attempted passes of 25 yards or more that successfully found a teammate.
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Launched Pass Completion %</span>&nbsp;
                                    The percentage of attempted passes of 40 yards or more that successfully found a teammate, including goal kicks.
                                </li>
                                <li>
                                    <span style={{color: '#87e179', fontWeight: 'bold'}}>Successful Dribble</span>&nbsp;
                                    A successful attempt at taking on a player and making it past them whilst retaining possession.
                                </li>
                                <li>
                                    <span style={{color: '#87e179', fontWeight: 'bold'}}>Dribble Success %</span>&nbsp;
                                    The percentage of attempted dribbles that were successful.
                                </li>
                                <li>
                                    <span style={{color: '#87e179', fontWeight: 'bold'}}>Dispossessed</span>&nbsp;
                                    Being tackled by an opponent and losing control of the ball without attempting a dribble.
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>pAdj</span>&nbsp;
                                    Possession Adjusted (using the StatsBomb sigmoid function).**
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>Successful Pressure</span>&nbsp;
                                    A pressing action that led to the team regaining possession within the next 5 seconds.
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>Interception</span>&nbsp;
                                    A prevention of an opponent's pass from reaching another opponent by moving into the line of the pass.
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>Tackle Won</span>&nbsp;
                                    A dispossession of an opponent such that the tackling player's team won possession of the ball.
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>Tackle/Dribbled Past %</span>&nbsp;
                                    The percentage of dribblers faced that were tackled.
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>Aerial Win</span>&nbsp;
                                    Winning the ball in a duel that was challenged in the air.
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>Aerial Win %</span>&nbsp;
                                    The percentage of aerials duels contested that were won.
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>Clearance</span>&nbsp;
                                    An action where a player kicked/headed the ball away from their own goal.
                                </li>
                                <li>
                                    <span style={{color: '#787ccd', fontWeight: 'bold'}}>GSAA (Goals Saved Above Average) %</span>&nbsp;
                                    (Post-Shot xG − Goals Conceded) ÷ Shots on Target Faced.***
                                </li>
                                <li>
                                    <span style={{color: '#787ccd', fontWeight: 'bold'}}>Cross Stopping %</span>&nbsp;
                                    The percentage of attempted crosses into the penalty area that were stopped by the goalkeeper.
                                </li>
                            </ul>
                            <div id="glossary-links">
                                <span>
                                    * <a href="https://fbref.com/en/expected-goals-model-explained/" target="_blank" rel="noopener noreferrer">Expected goals/assists model explanation</a>
                                </span>
                                <span>
                                    ** <a href="https://statsbomb.com/2014/06/introducing-possession-adjusted-player-stats/" target="_blank" rel="noopener noreferrer">Possession adjustment explanation</a>
                                </span>
                                <span>
                                    *** <a href="https://statsbomb.com/2018/12/introducing-goalkeeper-radars/" target="_blank" rel="noopener noreferrer">GSAA % explanation</a>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div id="faq" className="homepage-section-container">
                        <div id="faq-section-container">
                            <h2>F.A.Q.</h2>
                            <div id="faq-container">
                                <div className="faq-item">
                                    <p><span className="accented-p">Where does the data come from?</span></p>
                                    <p>The metadata is from <a href="https://www.whoscored.com" target="_blank" rel="noopener noreferrer">WhoScored.com</a>, and
                                        the stats are from <a href="https://www.fbref.com" target="_blank" rel="noopener noreferrer">FBref.com</a>.</p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">Who's included in the database? How often is it updated?</span></p>
                                    <p>
                                        The database includes all top 5 league players who've made 4 or more league appearances
                                        in the 2018/19 or 2019/20 seasons. It's updated after every top 5 league, Champions League
                                        or Europa League matchday.
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">
                                        Will the database be expanded to include seasons before 2018/19 and players outside the top 5 leagues?
                                    </span></p>
                                    <p>
                                        Probably not. At present, <a href="https://www.fbref.com" target="_blank" rel="noopener noreferrer">FBref.com</a>'s advanced statistics
                                        are only available for a few seasons and leagues.
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">Will a feature be added to compare players on the same chart?</span></p>
                                    <p>
                                        Still working on that.
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">What is a percentile rank? How are they calculated for FootballSlices?</span></p>
                                    <p>
                                        The percentile rank of a score is the percentage of scores within a dataset
                                        that are equal to or lower than the score. This is of course reversed for stats where
                                        a lower value is better, such as the 'fouls committed per 90' stat.
                                    </p>
                                    <p>
                                        The percentile ranks for FootballSlices are position-specific. For example,
                                        selecting the 'forward' template compares the selected player only to other forwards in the
                                        database. The percentile ranks are also season-specific. For example, selecting competitions
                                        from the 2018/19 season will only compare the selected player to the 2018/19 dataset. Selecting
                                        competitions from multiple seasons will compare the selected player to the combined dataset.
                                    </p>
                                    <p>
                                        Please note however that the percentile ranks are not competition-specific. In other words,
                                        the selected player's stats are always compared to other players' stats from all competitions, regardless
                                        of which competitions are toggled for the selected player.
                                    </p>
                                </div>
                                <div className="faq-item">
                                    <p><span className="accented-p">How are the player positions decided?</span></p>
                                    <p>
                                        Position data is obtained using the 'detailed' tab of the <a href="https://whoscored.com/Statistics" target="_blank" rel="noopener noreferrer">
                                        WhoScored.com player statistics table</a> to find all players who've made 10 or more
                                        league starts in each of the template positions during a particular season.
                                    </p>
                                    <p>
                                        Disclaimer: This method has some small quirks. For example, it classifies Martin Ødegaard as a
                                        central midfielder, whereas I feel he's more of an attacking midfielder. It's
                                        not perfect but it's the best way I've found to automate the process.
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
                        </div>
                    </div>
                </div>
            );

        }

    }

}

export default Home;
