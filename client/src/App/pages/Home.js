import React, { Component } from 'react';
import $ from "jquery";

// import Typist from 'react-typist';
import SearchBar from "../components/SearchBar"
import PlayerSearchResult from "../components/PlayerSearchResult"
import LoadingSpinner from "../components/LoadingSpinner";

import mockUps from "../assets/mockups.png"


class Home extends Component {

    _isMounted = false;

    constructor(props) {

        super(props);

        this.state = {
            isMobile: this.props.isMobile,
            isLoading: false,
            samplePlayers: [],
        };

    }

    componentDidMount() {

        this._isMounted = true;

        this.setState({
            isLoading: true
        }, () => {
            this.getSamplePlayers();
        });

    }

    getSamplePlayers = () => {

        fetch('/api/samplePlayers', {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        })
        .then(res => res.json())
        .then(samplePlayers => {
            if (this._isMounted){
                this.setState({samplePlayers: samplePlayers, isLoading: false});
                if ($('body').css('background-color') === 'rgb(250, 251, 253)') {
                    var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                    var navbarHeight = 0.06 * height;
                    $("#home").css({"height": height});
                    $("#navbar-container").css({"height": navbarHeight});
                }
                $("#menu-hidden").addClass('preload');
            }
        })

    };

    componentWillUnmount() {
        this._isMounted = false;
    }

    toggleMenu = () => {

        let menuResponsive = document.getElementsByClassName('responsive-navbar')[0];
        if (menuResponsive.id === "menu-hidden"){
            menuResponsive.id = "menu-expanded";
        }
        else {
            $("#menu-expanded").removeClass('preload');
            menuResponsive.id = "menu-hidden";
        }

    };

    hideMenu = () => {

        $("#menu-expanded").removeClass('preload');
        let menuResponsive = document.getElementsByClassName('responsive-navbar')[0];
        menuResponsive.id = "menu-hidden";

    };

    render() {

        let { isLoading, samplePlayers } = this.state;

        if (isLoading) {
            return (
                <LoadingSpinner/>
            )
        }

        else {

            let samplePlayerCards = [];
            for (let i=0; i<samplePlayers.length; i++){
                let current = samplePlayers[i];
                samplePlayerCards.push(
                    <PlayerSearchResult
                        page = {"home"}
                        code = {current.code}
                        name = {current.name}
                        clubs = {current.clubs}
                        nationality = {current.nationality}
                        key = {i}
                    />
                );
            }

            return (
                <div id="homepage">
                    <div id="navbar-container">
                        <div className="navbar" id="menu">
                            <a onClick={this.hideMenu} href="#home">
                                <div>Home</div>
                            </a>
                            <a onClick={this.hideMenu} href="#preview">
                                <div>Preview</div>
                            </a>
                            <a onClick={this.hideMenu} href="#faq">
                                <div>F.A.Q.</div>
                            </a>
                            <a onClick={this.hideMenu} href="#glossary">
                                <div>Glossary</div>
                            </a>
                            <a onClick={this.hideMenu} href="#contact">
                                <div>Contact</div>
                            </a>
                            <a onClick={this.toggleMenu} id="burger-icon-container">
                                <div id="burgerIcon"><i className="fa fa-bars"/></div>
                            </a>
                        </div>
                        <div className="navbar responsive-navbar" id="menu-hidden">
                            <a onClick={this.hideMenu} href="#preview">
                                <div>Preview</div>
                            </a>
                            <a onClick={this.hideMenu} href="#faq">
                                <div>F.A.Q.</div>
                            </a>
                            <a onClick={this.hideMenu} href="#glossary">
                                <div>Glossary</div>
                            </a>
                            <a onClick={this.hideMenu} href="#contact">
                                <div>Contact</div>
                            </a>
                        </div>
                    </div>
                    <div id="home">
                        <h1>Football<span style={{color: '#e4c000'}}>Slices</span></h1>
                        <SearchBar type={3}/>
                        <br/>
                        <br/>
                        <p>...or try using a sample player</p>
                        <br/>
                        <div id="sample-results">
                            {samplePlayerCards}
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
                                    Explore a database of <span style={{color: 'orangered'}}>2,700+ players </span>
                                    from <span style={{color: 'orangered'}}>Europe's top 5 leagues</span>, with stats
                                    from the <span style={{color: 'orangered'}}>2018/19</span> and
                                    <span style={{color: 'orangered'}}> 2019/20</span> seasons.
                                </p>
                                <p>
                                    Simply choose a positional template, toggle the competitions you'd like to include,
                                    and visualize statistics in seconds with interactive percentile rank bar
                                    charts, powered by <a href="https://www.highcharts.com" >Highcharts.js</a>.
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
                                    <li><span style={{color: '#7db9f0', fontWeight: 'bold'}}>Blue</span> is for defence</li>
                                    <li>and <span style={{color: '#787ccd', fontWeight: 'bold'}}>Purple</span> is for goalkeeping stats</li>
                                </ul>
                            </div>
                            <div id="preview-image">
                                <img src={mockUps} alt="Mock-ups"/>
                            </div>
                        </div>
                    </div>
                    <div id="faq" style={{backgroundColor: '#f5f6f7'}} className="homepage-section-container">
                        <div id="faq-section-container">
                            <h2>F.A.Q.</h2>
                            <div id="faq-container">
                                <div className="faq-item">
                                    <p><span className="accented-p">Where does the data come from?</span></p>
                                    <p>The metadata is from <a href="https://www.whoscored.com" >WhoScored.com</a>, and
                                        the stats are from <a href="https://www.fbref.com">FBref.com</a>.</p>
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
                                        Probably not. At present, <a href="https://www.fbref.com">FBref.com</a>'s advanced statistics
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
                                        Position data is obtained using the 'detailed' tab of the <a href="https://whoscored.com/Statistics">
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
                    <div id="glossary" className="homepage-section-container">
                        <div id="glossary-section-container">
                            <h2>Glossary</h2>
                            <ul>
                                <li>
                                    <span style={{color: '#f15c80', fontWeight: 'bold'}}>Non-Penalty Goal</span>&nbsp;
                                    A goal that did not stem directly from a penalty kick.
                                </li>
                                <li>
                                    <span style={{color: '#f15c80', fontWeight: 'bold'}}>Non-Penalty xG (Expected Goals)</span>&nbsp;
                                    Expected goals that did not stem directly from penalty kicks. *
                                </li>
                                <li>
                                    <span style={{color: '#f15c80', fontWeight: 'bold'}}>Non-Penalty xG/Shot</span>&nbsp;
                                    The average expected goal value of shots taken, excluding penalty kicks.
                                </li>
                                <li>
                                    <span style={{color: '#f15c80', fontWeight: 'bold'}}>Conversion Rate</span>&nbsp;
                                    The percentage of goal attempts that resulted in goals, excluding penalty kicks.
                                </li>
                                <li>
                                    <span style={{color: '#f15c80', fontWeight: 'bold'}}>Aerial Win %</span>&nbsp;
                                    The percentage aerials duels contested that were won.
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Touch in Box</span>&nbsp;
                                    Having possession of the ball in the opposition's penalty area.
                                    (Note: Receiving a pass, then dribbling, then sending a pass counts as one touch)
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>xA (Expected Assists)</span>&nbsp;
                                    Expected goals that resulted from shot assists, including set pieces. *
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Shot-Creating Action</span>&nbsp;
                                    One of the last two offensive actions, excluding set pieces, that directly
                                    led to a shot, such as pass, dribble or a drawn foul.
                                    (Note: A single player can receive credit for multiple actions and the shot-taker can also receive credit)
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Pass into Box</span>&nbsp;
                                    A completed pass that entered the opposition penalty area, excluding set pieces.
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Pass into Final 1/3</span>&nbsp;
                                    A completed pass that entered the 1/3 of the pitch closest to the opposition goal, excluding set pieces.
                                </li>
                                <li>
                                    <span style={{color: '#e4c000', fontWeight: 'bold'}}>Progressive Distance</span>&nbsp;
                                    Distance, in yards, that the ball was moved towards the opponent's goal
                                    with passes and carries.
                                    (Note: Passes and carries away from the opponent's goal are counted as zero progressive yards)
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
                                    The percentage of attempted dribbles which were successful.
                                </li>
                                <li>
                                    <span style={{color: '#87e179', fontWeight: 'bold'}}>Dispossessed</span>&nbsp;
                                    Being tackled by an opponent and losing control of the ball without attempting a dribble.
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>pAdj</span>&nbsp;
                                    Possession Adjusted (using the StatsBomb sigmoid function). **
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>Successful Pressure</span>&nbsp;
                                    A pressing action which led to the team regaining possession within the next 5 seconds.
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
                                    The percentage aerials duels contested that were won.
                                </li>
                                <li>
                                    <span style={{color: '#7db9f0', fontWeight: 'bold'}}>Clearance</span>&nbsp;
                                    An action where a player kicked/headed the ball away from their own goal.
                                </li>
                                <li>
                                    <span style={{color: '#787ccd', fontWeight: 'bold'}}>GSAA % (Goals Saved Above Average %)</span>&nbsp;
                                    (Post-Shot xG - Goals Conceded) ÷ Shots on Target Faced. ***
                                </li>
                                <li>
                                    <span style={{color: '#787ccd', fontWeight: 'bold'}}>Cross Stopping %</span>&nbsp;
                                    The percentage of attempted crosses into the penalty area that were stopped by the goalkeeper.
                                </li>
                            </ul>
                            <p>
                                * <a href="https://fbref.com/en/expected-goals-model-explained/" target="_blank" rel="noopener noreferrer">Expected goals/assists model explanation</a>
                                &nbsp;&nbsp;
                                ** <a href="https://statsbomb.com/2014/06/introducing-possession-adjusted-player-stats/" target="_blank" rel="noopener noreferrer">Possession adjustment explanation</a>
                                &nbsp;&nbsp;
                                *** <a href="https://statsbomb.com/2018/12/introducing-goalkeeper-radars/" target="_blank" rel="noopener noreferrer">GSAA % explanation</a>
                            </p>
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
