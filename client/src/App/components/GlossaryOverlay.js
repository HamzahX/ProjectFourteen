import React, { Component } from 'react';


/**
 * Component to render the player comparison search screen
 * Also handles the live search requests and aborts
 */
class GlossaryOverlay extends Component {

    constructor(props) {

        super(props);
        this.toggleGlossaryOverlay = this.props.toggleGlossaryOverlay;

    }


    /**
     * render function
     * displays the player comparison search screen
     * @return {*} - JSX code for the searchbar and its container
     */
    render() {

        //return JSX code for the glossary overlay
        return (
            <div className={`overlay ${this.props.display ? "open" : "closed"}`} id="glossary-overlay">
                <div className={'overlay-inner-container'} id={'glossary-container'}>
                    <button className="close-overlay far fa-times-circle" onClick={this.toggleGlossaryOverlay}/>
                    <div className="help-section-container">
                        <h2>Interpreting the Slices</h2>
                        <p>
                            A Football Slice is made up of a number of wedges (12 for outfield players, 3 for goalkeepers).
                            The length of each wedge corresponds to the selected player's percentile rank for the stat
                            when they are compared to top-5 league players who play in a similar position.
                        </p>
                        <p>
                            The percentile rank of a score is the percentage of scores within a dataset
                            that are equal to or lower than the score. This is reversed for stats where
                            a lower value is better, such as 'turnovers'. <b>In short, a bigger bar is always better.</b>
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
                    <div className="help-section-container" id="glossary-section-container">
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
                                <span style={{color: '#e4c000', fontWeight: 'bold'}}>Yards Progressed</span>&nbsp;
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
                                (Post-Shot xG − Goals Conceded (excluding own goals)) ÷ Shots on Target Faced.***
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
            </div>

        );

    }

}

export default (GlossaryOverlay);
