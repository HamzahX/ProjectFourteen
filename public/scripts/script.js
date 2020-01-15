const socket = io();

let stats = {};
let competitions = [];

let FWPercentiles = [];
let AMPercentiles = [];
let CMPercentiles = [];
let FBPercentiles = [];
let CBPercentiles = [];

let name;
let club;
let nationality;
var url;
let isAll;

let chart;
let subtitle;
let categories;
let randomColor;

socket.on('percentile arrays', function(forward, attackingMidfield, centralMidfield, fullBack, centerBack){
    FWPercentiles = forward;
    AMPercentiles = attackingMidfield;
    CMPercentiles = centralMidfield;
    FBPercentiles = fullBack;
    CBPercentiles = centerBack;
});

socket.on('search results', function(results){
    let searchResults = $('#search-results');
    $('.search-filter-input').empty();
    searchResults.empty();
    for (let i=0; i<results.length; i++){
        let resultID = "result" + i;
        let name = results[i]["name"];
        let nationality = results[i]["nationality"];
        let club = results[i]["club"];
        let url = results[i]["URL"];
        let all = results[i]["all"];
        searchResults.append('<div onclick="return getStats(this)" tabindex="0" class="search-result" id="' + resultID + '">' +
            '<div class="name">' + name + '</div>' +
            '<div class="club">Club: ' + club + '</div>' +
            '<div class="nationality">Nationality: ' + nationality + '</div>' +
            '<div style="display:none" class="url">' + url + '</div>' +
            '<div style="display:none" class="all">' + all + '</div>' +
            '</div>'
        );
    }
    $('#main2').attr("id", "main");
    $('#searchbar-container2').attr("id", "searchbar-container");
    $('.screen2').attr("class", "screen");
    $("#loading-screen").css("display", "none");
    $("#search-screen").css("display", "flex");
});

socket.on('stats scraped', function(scrapedStats){
    randomColor = Math.floor(Math.random() * 10);
    stats = scrapedStats;
    console.log(stats);
    competitions = Object.keys(stats);
    // competitions = competitions.filter(element => element !== "countryCode" && element !== "name" && element !== "club");
    for (let i=0; i<competitions.length; i++){
        $('#competitions').append('<label><input class="competition" type="checkbox" value="' + competitions[i] + '" checked> ' + competitions[i].split("|").join("<br>") + '</label>');
    }
    $('#main').attr("id", "main2");
    $('#searchbar-container').attr("id", "searchbar-container2");
    $('.screen').attr("class", "screen2");
    $('#chart').empty();
    $("#loading-screen").css("display", "none");
    $("#content-screen").css("display", "flex");
    drawChart(true);
});

socket.on('alert error', function(anError){
    $('#main2').attr("id", "main");
    $('#searchbar-container2').attr("id", "searchbar-container");
    $('.screen2').attr("class", "screen");
    drawLoadingScreen("error", anError)
});

function search(){
    if ($('#loading-screen').css('display') === 'none') {
        $('.highcharts-data-table').remove();
        let query = $('#query').val();
        $("#landing-screen").css("display", "none");
        $("#search-screen").css("display", "none");
        $("#content-screen").css("display", "none");
        drawLoadingScreen("search");
        socket.emit('search', query);
    }
}

function getStats(elem){
    $('#filterByClub').val("");
    $('#filterByNationality').val("");
    $('#chart').empty();
    $('#competitions').empty();
    isAll = $(elem).find('.all').text();
    name = $(elem).find('.name').text();
    if (isAll === "false"){
        name = $(elem).find('.name').text() + ", 19/20";
    }
    club = $(elem).find('.club').text().substring(6);
    nationality = $(elem).find('.nationality').text().substring(13);
    url = $(elem).find('.url').text();
    $("#search-screen").css("display", "none");
    drawLoadingScreen("getStats");
    socket.emit('scrape stats', url, isAll);
}

function drawLoadingScreen(type, anError=""){
    $('#main2').attr("id", "main");
    $('#searchbar-container2').attr("id", "searchbar-container");
    $('.screen2').attr("class", "screen");
    let loadingScreen = $('#loading-screen');
    loadingScreen.empty();
    loadingScreen.append('<div id="circularG"> <div id="circularG_1" class="circularG"></div> ' +
        '<div id="circularG_2" class="circularG"></div> <div id="circularG_3" class="circularG"></div> ' +
        '<div id="circularG_4" class="circularG"></div> <div id="circularG_5" class="circularG"></div> ' +
        '<div id="circularG_6" class="circularG"></div> <div id="circularG_7" class="circularG"></div> ' +
        '<div id="circularG_8" class="circularG"></div> </div><br>');
    switch(type){
        case "search":
            loadingScreen.append('Searching');
            break;
        case "getStats":
            loadingScreen.append('Retrieving Stats');
            break;
        case "error":
            $('.circularG').remove();
            loadingScreen.append(anError);
            loadingScreen.append("<br>Please reload the page and try again");

    }
    loadingScreen.css("display", "flex");
}

function drawChart(isNew = false){
    let dataTable = $('.highcharts-data-table');
    if (competitions.length === 0){
        isNew = true;
    }
    competitions = [];
    $(".competition:checked").each(function () {
        competitions.push($(this).val());
    });
    let template = $("input[name='template']:checked").val();
    let filteredStats = filterStats(stats);
    if (Object.keys(filteredStats).length === 0){
        dataTable.css("opacity", 0);
        subtitle = '';
        createChart([]);
        $(".highcharts-axis-line").attr("stroke-width", "0");
        $('.highcharts-yaxis-labels').css("opacity", 0);
    }
    else {
        dataTable.css("opacity", 1);
        $('.highcharts-yaxis-labels').css("opacity", 1);
        let selectedStats;
        switch (template){
            case 'FW':
                selectedStats = calculateForwardStats(filteredStats);
                setForwardTemplate();
                subtitle = 'Forward Template';
                break;
            case 'AM':
                selectedStats = calculateAttMidfielderStats(filteredStats);
                setAttMidfieldTemplate();
                subtitle = 'Attacking Midfielder / Winger Template';
                break;
            case 'MF':
                selectedStats = calculateMidfielderStats(filteredStats);
                setMidfieldTemplate();
                subtitle = 'Central / Defensive Midfielder Template';
                break;
            case 'FB':
                selectedStats = calculateFullbackStats(filteredStats);
                setFullbackTemplate();
                subtitle = 'Full-back Template';
                break;
            case 'CB':
                selectedStats = calculateCenterbackStats(filteredStats);
                setCenterbackTemplate();
                subtitle = 'Center-back Template';
                break;
        }
        subtitle = 'Percentile Rank Bars (w/ p90 Raw Values)<br>' + subtitle + '\t║\tSample Size: ';
        if (isNew) {
            if (dataTable.length){
                dataTable.remove();
                createChart(selectedStats);
                chart.viewData();
                chart.reflow();
            }
            else {
                createChart(selectedStats);
            }
        }
        else {
            $.each(chart.series[0].data, function (i, point) {
                point.update(selectedStats[i], false);
            });
            if (dataTable.length){
                chart.viewData();
            }
            chart.render();
        }
        $("caption").text("Percentile Ranks");
        chart.setTitle(null, { text: subtitle + filteredStats['minutes'].toLocaleString() + ' minutes'});
    }
}

function filterStats(stats){
    let filteredStats = {};
    for (let competition in stats){
        if (competitions.includes(competition)) {
            for (let stat in stats[competition]) {
                if (!(stat in filteredStats)) {
                    filteredStats[stat] = stats[competition][stat];
                } else {
                    filteredStats[stat] += stats[competition][stat];
                }
            }
        }
    }
    return filteredStats;
}

function calculateForwardStats(filteredStats){
    let statsPer90 = {};
    let percentiles = {};
    statsPer90['goals'] = filteredStats['goals'] / (filteredStats['minutes']/90);
    statsPer90['shots'] = (filteredStats['shots']  - filteredStats['penaltiesTaken']) / (filteredStats['minutes']/90);
    statsPer90['conversionRate'] = (filteredStats['goals'] / (filteredStats['shots']  - filteredStats['penaltiesTaken'])) * 100;
    statsPer90['shotsOnTarget'] = ((filteredStats['shotsOnTarget'] - filteredStats['penaltiesTaken']) / (filteredStats['shots'] - filteredStats['penaltiesTaken'])) * 100;
    statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['succDribbles'] = filteredStats['succDribbles'] / (filteredStats['minutes']/90);
    statsPer90['dribbleRate'] = (filteredStats['succDribbles'] / filteredStats['totalDribbles']) * 100;
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['recoveries'] = (filteredStats['tackles'] / (filteredStats['minutes']/90)) + (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    for (let key in statsPer90){
        percentiles[key] = percentRank(FWPercentiles[key], statsPer90[key]) * 100
    }
    percentiles['possessionLosses'] = 100 - percentiles['possessionLosses'];
    return getChartInput(statsPer90, percentiles);
}

function calculateAttMidfielderStats(filteredStats){
    let statsPer90 = {};
    let percentiles = {};
    statsPer90['goals'] = filteredStats['goals'] / (filteredStats['minutes']/90);
    statsPer90['shots'] = (filteredStats['shots']  - filteredStats['penaltiesTaken']) / (filteredStats['minutes']/90);
    statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['crossRate'] = (filteredStats['succCrosses'] / filteredStats['totalCrosses']) * 100;
    statsPer90['succDribbles'] = filteredStats['succDribbles'] / (filteredStats['minutes']/90);
    statsPer90['dribbleRate'] = (filteredStats['succDribbles'] / filteredStats['totalDribbles']) * 100;
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['recoveries'] = (filteredStats['tackles'] / (filteredStats['minutes']/90)) + (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    for (let key in statsPer90){
        percentiles[key] = percentRank(AMPercentiles[key], statsPer90[key]) * 100
    }
    percentiles['possessionLosses'] = 100 - percentiles['possessionLosses'];
    return getChartInput(statsPer90, percentiles);
}

function calculateMidfielderStats(filteredStats){
    let statsPer90 = {};
    let percentiles = {};
    statsPer90['goalsPlusAssists'] = (filteredStats['goals'] + filteredStats['assists']) / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['longPassingRate'] = (filteredStats['succLongPasses'] / filteredStats['totalLongPasses']) * 100;
    statsPer90['succDribbles'] = filteredStats['succDribbles'] / (filteredStats['minutes']/90);
    statsPer90['dribbleRate'] = (filteredStats['succDribbles'] / filteredStats['totalDribbles']) * 100;
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['tackleRate'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    for (let key in statsPer90){
        percentiles[key] = percentRank(CMPercentiles[key], statsPer90[key]) * 100
    }
    percentiles['fouls'] = 100 - percentiles['fouls'];
    return getChartInput(statsPer90, percentiles);
}

function calculateFullbackStats(filteredStats){
    let statsPer90 = {};
    let percentiles = {};
    statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['crossRate'] = (filteredStats['succCrosses'] / filteredStats['totalCrosses']) * 100;
    statsPer90['succDribbles'] = filteredStats['succDribbles'] / (filteredStats['minutes']/90);
    statsPer90['dribbleRate'] = (filteredStats['succDribbles'] / filteredStats['totalDribbles']) * 100;
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['tackleRate'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['aerialDuelRate'] = (filteredStats['succAerialDuels'] / filteredStats['totalAerialDuels']) * 100;
    for (let key in statsPer90){
        percentiles[key] = percentRank(FBPercentiles[key], statsPer90[key]) * 100
    }
    percentiles['fouls'] = 100 - percentiles['fouls'];
    return getChartInput(statsPer90, percentiles);
}

function calculateCenterbackStats(filteredStats){
    let statsPer90 = {};
    let percentiles = {};
    statsPer90['passingRate'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['longPassingRate'] = (filteredStats['succLongPasses'] / filteredStats['totalLongPasses']) * 100;
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['tackleRate'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['blocks'] = (filteredStats['blocks'] / (filteredStats['minutes']/90));
    statsPer90['clearances'] = filteredStats['clearances'] / (filteredStats['minutes']/90);
    statsPer90['succAerialDuels'] = filteredStats['succAerialDuels'] / (filteredStats['minutes']/90);
    statsPer90['aerialDuelRate'] = (filteredStats['succAerialDuels'] / filteredStats['totalAerialDuels']) * 100;
    for (let key in statsPer90){
        percentiles[key] = percentRank(CBPercentiles[key], statsPer90[key]) * 100
    }
    percentiles['fouls'] = 100 - percentiles['fouls'];
    return getChartInput(statsPer90, percentiles);
}

function getChartInput(statsPer90, percentiles) {
    percentiles = roundNumbers(percentiles, 0);
    statsPer90 = roundNumbers(statsPer90, 2);
    let chartInput = [];
    let i = 0;
    for (let key in percentiles){
        chartInput[i] = {y: percentiles[key], p90: statsPer90[key]};
        i++;
    }
    return chartInput;
}

function percentRank(array, value) {
    if (!isFinite(value)){
        value = 0;
    }
    for (let i = 0, l = array.length; i < l; i++) {
        if (value < array[i]) {
            while (i < l && value === array[i]) i++;
            if (i === 0) return 0;
            if (value !== array[i-1]) {
                i += (value - array[i-1]) / (array[i] - array[i-1]);
            }
            return i / l;
        }
    }
    return 1;
}


function roundNumbers(someStats, precision){
    for (let stat in someStats){
        if (isFinite(someStats[stat])) {
            // someStats[stat] = parseFloat(someStats[stat].toFixed(precision));
            someStats[stat] = Math.round(someStats[stat] * (10**precision)) / (10**precision);
        }
        else {
            someStats[stat] = 0;
        }
    }
    return someStats;
}


function setForwardTemplate() {
    categories = [
        'Non-Penalty Goals',
        'Non-Penalty Shots',
        'Conversion Rate',
        'Shots on Target %',
        'Assists',
        'Key Passes',
        'Pass Completion %',
        'Successful Dribbles',
        'Dribble Success %',
        'Turnovers',
        'Recoveries',
    ];
}

function setAttMidfieldTemplate(){
    categories = [
        'Non-Penalty Goals',
        'Non-Penalty Shots',
        'Assists',
        'Key Passes',
        'Pass Completion %',
        'Cross Completion %',
        'Successful Dribbles',
        'Dribble Success %',
        'Turnovers',
        'Recoveries',
    ];
}

function setMidfieldTemplate(){
    categories = [
        'Non-Penalty Goals+Assists',
        'Key Passes',
        'Pass Completion %',
        'Long Pass Completion %',
        'Successful Dribbles',
        'Dribble Success %',
        'Tackles Won',
        'Tackle Win %',
        'Fouls Committed',
        'Interceptions'
    ];
}

function setFullbackTemplate(){
    categories = [
        'Assists',
        'Key Passes',
        'Pass Completion %',
        'Cross Completion %',
        'Successful Dribbles',
        'Dribble Success %',
        'Tackles Won',
        'Tackle Win %',
        'Fouls Committed',
        'Interceptions',
        'Aerial Duel Win %'
    ];
}

function setCenterbackTemplate(){
    categories = [
        'Pass Completion %',
        'Long Pass Completion %',
        'Tackles Won',
        'Tackle Win %',
        'Fouls Committed',
        'Interceptions',
        'Blocks',
        'Clearances',
        'Aerial Duels Won',
        'Aerial Duel Win %'
    ];
}

function createChart(selectedStats){
    let series;
    if (selectedStats === []){
        series = [];
    }
    else {
        series = [selectedStats];
    }
    chart = Highcharts.chart('chart', {
        chart: {
            parallelCoordinates: true,
            parallelAxes: {
                // gridLineInterpolation: 'polygon',
                labels: {
                    enabled: false,
                    style: {
                        color: '#444444',
                        fontSize: "0.5em",
                    }
                },
                // gridLineWidth: 1,
                gridZIndex: 5,
                lineWidth: 0,
                endOnTick: true,
                showFirstLabel: false,
                showLastLabel: false,
                min: -15,
                max: 100,
                tickPositions: [-15, 0, 25, 50, 75, 100]
            },
            polar: true,
            type: 'bar',
            hideDelay: 0,
            spacingLeft: 0,
            spacingRight: 0,
            marginLeft: 75,
            marginRight: 75,
            marginBottom: 30,
            events: {
                load: function() {
                    this.title.element.onclick = function() {
                        window.open(url, '_blank');
                    }
                },
            }
        },
        credits: {
            text: "Percentile ranks are calculated by comparing a player to other top 5 league players who have at least 10 starts in a similar position",
            style: {
                fontSize: '1em'
            },
            href: ''
        },
        plotOptions: {
            series: {
                color: Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0.6).get(),
                dataLabels: {
                    enabled: true,
                    inside: true,
                    style: {
                        color: "black",
                        fontWeight: '600',
                        fontSize: "1.25em",
                        textOutline: "1.5px contrast"
                    },
                    format: '{point.p90}',
                    padding: 0,
                    allowOverlap: true
                }
            }
        },
        title: {
            text: name,
            style: {
                fontSize: '2em',
                fontWeight: 'bold',
            },
            margin: 35
        },
        pane: {
            startAngle: -16.3636363636363636363
        },
        lang: {
            noData: ""
        },
        noData: {
            style: {
                fontWeight: 'bold',
                fontSize: '1.5em',
                color: '#303030'
            }
        },
        subtitle: {
            // text: '|',
            style: {
                fontSize: '1.5em'
            }
        },
        tooltip: {
            pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
                ' {series.name}<br>Raw Value: <b>{point.p90}</b><br/>Percentile Rank: <b>{point.formattedValue}</b>'
        },
        legend: {
            enabled: false,
            borderWidth: 1,
            align: 'center',
            verticalAlign: 'bottom',
            layout: 'horizontal'
        },
        xAxis: {
            categories: categories,
            labels: {
                distance: 40,
                style: {
                    fontSize: '1.15em',
                }
            },
            gridLineWidth: 1.5,
            gridLineColor: '#333333',
            gridZIndex: 4
        },
        series:
            series.map(function (set, i) {
                return {
                    pointPadding: 0,
                    groupPadding: 0,
                    name: name,
                    data: set,
                    stickyTracking: false,
                    zIndex: 0
                };
            }),
        exporting: {
            scale: 1,
            sourceWidth: 1920,
            sourceHeight: 1080,
            buttons: {
                contextButton: {
                    menuItems: ["viewFullscreen", "printChart"]
                }
            }
        }
    });
}

Highcharts.setOptions({
    chart: {
        style: {
            fontFamily: "sans-serif"
        }
    }
});

function toggleDataTable(){
    let dataTable = $('.highcharts-data-table');
    if (dataTable.length){
        dataTable.remove();
        chart.reflow();
        drawChart(true);
    }
    else {
        chart.viewData();
        chart.reflow();
        drawChart(true);
    }
    $("caption").text("Percentile Ranks");
}

function selectAllSeasons(){
    $('#competitions').trigger("reset");
    drawChart();
}

function clearAllSeasons(){
    $('input:checkbox').prop("checked", false);
    drawChart();
}

$("#searchbar").submit(function(e) {
    e.preventDefault();
});

$("#competitions").submit(function(e) {
    e.preventDefault();
});

$(document).ready(function(){
    $("#filterByNationality").on("keyup", function() {
        let value = $(this).val().toLowerCase();
        $("#search-results .search-result").filter(function() {
            $(this).toggle($(this).children(".nationality").text().toLowerCase().indexOf(value) > -1)
        });
    });

    $("#filterByClub").on("keyup", function() {
        let value = $(this).val().toLowerCase();
        $("#search-results .search-result").filter(function() {
            $(this).toggle($(this).children(".club").text().toLowerCase().indexOf(value) > -1)
        });
    });
});