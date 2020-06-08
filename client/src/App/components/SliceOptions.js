import React, {Component} from 'react';
import Collapsible from 'react-collapsible';

/**
 * Component to render the options for the displayed slice
 */
class SliceOptions extends Component {

    constructor(props) {

        super(props);

        this.isMobile = this.props.isMobile;
        this.templateOpen = this.props.template === "N/A";
        this.competitions = this.props.competitions;
        this.codes = this.props.codes;
        this.names = this.props.names;
        this.clubs = this.props.clubs;

        this.positions = {};
        if (this.isMobile){
            this.positions = {
                "FW": "FW",
                "AM": "AM",
                "CM": "CM / DM",
                "FB": "FB",
                "CB": "CB",
                "GK": "GK"
            };
        }
        else {
            this.positions = {
                "FW": "Forward",
                "AM": "Attacking Midfielder / Winger",
                "CM": "Central / Defensive Midfielder",
                "FB": "Full-back",
                "CB": "Center-back",
                "GK": "Goalkeeper"
            };
        }

        this.labelTypes = {
            "raw": "Raw Value",
            "percentiles": "Percentile Ranks"
        };

        this.state = {
        };

    }

    constructPlayerCompetitions = (forComparison, code) => {

        let competitions = forComparison ? this.competitions[code] : this.competitions;
        let clubs = forComparison ? this.clubs[code] : this.clubs;
        let selectedCompetitions = forComparison ? this.props.selectedCompetitions[code] : this.props.selectedCompetitions;

        let competitionsForms = [];
        let counter = 0;
        for (let season in competitions){
            let competitionLabels = [];
            let multipleClubs = clubs[season].length !== 1;
            competitionsForms.push(
                <h4
                    key={`${season}_header`}
                    style={{
                        marginBottom: this.isMobile ? '20px' : '10px',
                        // marginTop: (counter !== 0 && !isMobile) ? '12px' : '10px'
                        marginTop: (counter === 0) ? (this.isMobile ? '15px' : '10px') : (this.isMobile ? '20px' : '12px')
                    }}
                >
                    {season.replace("-", "/")} {multipleClubs === false ? ' | ' + clubs[season][0] : null}
                </h4>
            );
            for (let i=0; i<competitions[season].length; i++){
                let currentCompetition = competitions[season][i];
                let isIncluded = selectedCompetitions[season].includes(currentCompetition);
                let label = currentCompetition;
                if (clubs[season].length === 1){
                    label = label.substring(0, label.indexOf("|")-1)
                }
                competitionLabels.push(
                    <label
                        className={`${isIncluded ? "selected-label" : null} selectable-label`}
                        key={forComparison ? `${season}_${currentCompetition}_${code}` : `${season}_${currentCompetition}`}
                    >
                        <input className="competition"
                               type="checkbox"
                               value={forComparison ? `${season}_${currentCompetition}_${code}` : `${season}_${currentCompetition}`}
                               onChange={this.props.changeSelectedCompetitions}
                               checked={isIncluded}
                        /> {label}
                    </label>
                )
            }
            competitionsForms.push(<form key={forComparison ? `${code}_${season}_form` : `${season}_form`} className="competitions">{competitionLabels}</form>);
            counter++;
        }

        return competitionsForms;

    };

    /**
     * render function
     * @return {*} - JSX code for the slice options
     */
    render() {

        let template = this.props.template;
        let labelType = this.props.labelType;

        //construct templates form
        let templateLabels = [];
        let mobileTemplateLabels = [];
        for (let position in this.positions){
            let className;
            let mobileClassName;
            let disabled;
            if (position !== "GK"){
                className = template !== "GK" ? "selectable-label" : "blocked-label";
                mobileClassName = `${template === position ? "selected-label" : null} ${template !== "GK" ? "selectable-label" : null}`;
                disabled = template === "GK";
            }
            else {
                className = template === "GK" ? "selectable-label" : "blocked-label";
                mobileClassName = `${template === position ? "selected-label" : null} ${template === "GK" ? "selectable-label" : null}`;
                disabled = template !== "GK";
            }
            templateLabels.push(
                <label
                    className={className}
                    key={`${position}_label`}
                >
                    <input type="radio"
                           name="template"
                           value={position}
                           checked={template === position}
                           disabled={disabled}
                           onChange={this.props.changeTemplate}
                    /> {this.positions[position]}
                </label>
            );
            mobileTemplateLabels.push(
                <label
                    className={mobileClassName}
                    key={`${position}_label_mobile`}
                >
                    <input type="radio"
                           name="template"
                           value={position}
                           checked={template === position}
                           disabled={disabled}
                           onChange={this.props.changeTemplate}
                    /> {this.positions[position]}
                </label>
            );
        }
        let templatesForm = <form id="templates">{templateLabels}</form>;
        let mobileTemplatesForm = <form id="templates">{mobileTemplateLabels}</form>;

        //construct competitions forms
        let competitionsForms = [];
        let playerCompetitions;
        if (this.codes !== undefined){
            playerCompetitions = {};
            for (let i=0; i<this.codes.length; i++){
                let code = this.codes[i];
                playerCompetitions[code] = this.constructPlayerCompetitions(true, code);
                competitionsForms.push(
                    <Collapsible
                        key={`Competitions (${code})`}
                        open={true}
                        trigger={`Competitions (${this.names[this.codes[i]]})`}
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {playerCompetitions[code]}
                    </Collapsible>
                )
            }
        }
        else {
            playerCompetitions = this.constructPlayerCompetitions(false);
            competitionsForms.push(
                <Collapsible
                    key={"_"}
                    open={true}
                    trigger={`Competitions`}
                    className="chart-filter-headers"
                    transitionTime={200}
                    transitionCloseTime={200}
                >
                    {playerCompetitions}
                </Collapsible>
            )
        }

        //construct label type form
        let labelTypeLabels = [];
        for (let type in this.labelTypes){
            labelTypeLabels.push(
                <label
                    className={`selectable-label ${labelType === type ? "selected-label" : null}`}
                    key={type}
                >
                    <input
                        type="radio"
                        name="labelType"
                        value={type}
                        checked={labelType === type}
                        onChange={this.props.changeLabelType}
                    /> {this.labelTypes[type]}
                </label>
            )
        }
        let labelTypeForm = <form id="data-labels">{labelTypeLabels}</form>;

        return (
            <div className="filter" id="chart-filters">
                <div className="chart-filter-inputs" id="chart-filter-inputs-laptop">
                    <Collapsible
                        open={this.templateOpen}
                        trigger="Template"
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {templatesForm}
                    </Collapsible>
                    {competitionsForms}
                    <Collapsible
                        open={false}
                        trigger="Data Labels"
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {labelTypeForm}
                    </Collapsible>
                </div>
                <div className="chart-filter-inputs" id="chart-filter-inputs-mobile">
                    <Collapsible
                        open={this.templateOpen}
                        trigger="Template"
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {mobileTemplatesForm}
                    </Collapsible>
                    {competitionsForms}
                    <Collapsible
                        open={false}
                        trigger="Data Labels"
                        className="chart-filter-headers"
                        transitionTime={200}
                        transitionCloseTime={200}
                    >
                        {labelTypeForm}
                    </Collapsible>
                </div>
                <div id="filter-buttons">
                    <div className="filter-button">
                        <button id="toggleCreditsButton" type="button" onClick={this.props.toggleCreditsPosition}>Toggle Credits Position</button>
                    </div>
                    <div className="filter-button">
                        <button id="compareButton" type="button" onClick={this.props.toggleCompareSearch}>Compare</button>
                    </div>
                    <div className="filter-button">
                        <button id="exportButton" type="button" onClick={this.props.exportChart}>Export Chart</button>
                    </div>
                </div>
            </div>
        )

    }

}

export default (SliceOptions);
