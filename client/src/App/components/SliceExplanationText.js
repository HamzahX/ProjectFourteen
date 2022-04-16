import React, {Component} from 'react';


/**
 * Component to render the glossary overlay
 */
class SliceExplanationText extends Component {


    /**
     * render function
     * displays the player comparison search screen
     * @return {*} - JSX code for the searchbar and its container
     */
    render() {

        //return JSX code for the glossary overlay
        return (
            <div>
                <h2>Interpreting the Slices</h2>
                <p>
                    A Football Slice is made up of a number of wedges (12 for outfield players, 3 for goalkeepers),
                    each representing a relevant stat. The length of each wedge corresponds to the
                    selected player's percentile rank for the stat when they are compared to top-5 league
                    players who play in a similar position.
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

        );

    }

}

export default (SliceExplanationText);
