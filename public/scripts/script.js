const socket = io();

let stats = {};
let competitions = [];

let name;
let club;
let nationality;
let url;

let radar;
let subtitle;
let categories;
let yAxis;

let isTest = false;

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
        searchResults.append('<div onclick="return getStats(this)" tabindex="0" class="search-result" id="' + resultID + '">' +
            '<div class="name">' + name + '</div>' +
            '<div class="club">Club: ' + club + '</div>' +
            '<div class="nationality">Nationality: ' + nationality + '</div>' +
            '<div style="display:none" class="url">' + url + '</div>' +
            '</div>'
        );
    }
    $("#loading-screen").css("display", "none");
    $("#search-screen").css("display", "flex");
});

socket.on('stats scraped', function(scrapedStats){
    stats = scrapedStats;
    console.log(stats);
    competitions = Object.keys(stats);
    for (let i=0; i<competitions.length; i++){
        $('#competitions').append('<label><input class="competition" type="checkbox" value="' + competitions[i] + '" onchange="updateRadar(false)" checked> ' + competitions[i].split("|").join("<br>") + '</label>');
    }
    $('#radar').empty();
    $("#loading-screen").css("display", "none");
    $("#content-screen").css("display", "flex");
    updateRadar();
});

socket.on('alert error', function(anError){
    drawLoadingScreen("error", anError)
});

function search(){
    if ($('#loading-screen').css('display') === 'none') {
        $('.highcharts-data-table').remove();
        let query = $('#query').val();
        $("#landing").css("display", "none");
        $("#search-screen").css("display", "none");
        $("#content-screen").css("display", "none");
        drawLoadingScreen("search");
        socket.emit('search', query, isTest);
    }
}

function getStats(elem){
    $('#filterByClub').val("");
    $('#filterByNationality').val("");
    $('#radar').empty();
    $('#competitions').empty();
    name = $(elem).find('.name').text();
    club = $(elem).find('.club').text().substring(6);
    nationality = $(elem).find('.nationality').text().substring(13);
    url = $(elem).find('.url').text();
    $("#search-screen").css("display", "none");
    drawLoadingScreen("getStats");
    socket.emit('scrape stats', url, isTest);
}

function drawLoadingScreen(type, anError=""){
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

function updateRadar(isNew = true){
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
        if (dataTable.length){
            dataTable.css("opacity", 0);
        }
        subtitle = '';
        drawRadar([]);
        $(".highcharts-axis-line").attr("stroke-width", "0");
    }
    else {
        dataTable.css("opacity", 1);
        let selectedStats;
        switch (template){
            case 'FW':
                selectedStats = calculateForwardStats(filteredStats);
                setForwardTemplate(selectedStats);
                subtitle = 'FW / AM Template';
                break;
            case 'MF':
                selectedStats = calculateMidfielderStats(filteredStats);
                setMidfieldTemplate(selectedStats);
                subtitle = 'CM / DM Template';
                break;
            case 'FB':
                selectedStats = calculateFullbackStats(filteredStats);
                setFullbackTemplate(selectedStats);
                subtitle = 'FB Template';
                break;
            case 'CB':
                selectedStats = calculateCenterbackStats(filteredStats);
                setCenterbackTemplate(selectedStats);
                subtitle = 'FW / AM Template';
                break;
        }
        subtitle += ' | per 90 | Sample Size: ';
        if (isNew) {
            if (dataTable.length){
                dataTable.remove();
                drawRadar(selectedStats);
                radar.viewData();
                radar.reflow();
            }
            else {
                drawRadar(selectedStats);
            }
        }
        else {
            $.each(radar.series[0].data, function (i, point) {
                point.update(selectedStats[i], false);
            });
            radar.redraw();
            if (dataTable.length){
                radar.viewData();
            }
        }
        radar.setTitle(null, { text: subtitle + filteredStats['minutes'].toLocaleString() + ' minutes'});
    }
    radar.redraw();
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
    statsPer90['goals'] = filteredStats['goals'] / (filteredStats['minutes']/90);
    statsPer90['shots'] = (filteredStats['shots']  - filteredStats['penaltiesTaken']) / (filteredStats['minutes']/90);
    statsPer90['shootingAccuracy'] = ((filteredStats['shotsOnTarget'] - filteredStats['penaltiesTaken']) / (filteredStats['shots'] - filteredStats['penaltiesTaken'])) * 100;
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['throughBalls'] = filteredStats['throughBalls'] / (filteredStats['minutes']/90);
    statsPer90['tacklesAndInterceptions'] = (filteredStats['tackles'] / (filteredStats['minutes']/90)) + (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['dribbles'] = filteredStats['dribbles'] / (filteredStats['minutes']/90);
    statsPer90['conversionRate'] = (filteredStats['goals'] / (filteredStats['shots']  - filteredStats['penaltiesTaken'])) * 100;
    statsPer90 = roundTo2Decimals(statsPer90);
    return Object.values(statsPer90);
}

function calculateMidfielderStats(filteredStats){
    let statsPer90 = {};
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['throughBalls'] = filteredStats['throughBalls'] / (filteredStats['minutes']/90);
    statsPer90['goalsPlusAssists'] = (filteredStats['goals'] + filteredStats['assists']) / (filteredStats['minutes']/90);
    statsPer90['dribbles'] = filteredStats['dribbles'] / (filteredStats['minutes']/90);
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    statsPer90['tacklePct'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['succLongPasses'] = (filteredStats['succLongPasses'] / (filteredStats['minutes']/90));
    statsPer90 = roundTo2Decimals(statsPer90);
    return Object.values(statsPer90);
}

function calculateFullbackStats(filteredStats){
    let statsPer90 = {};
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['succCrosses'] = filteredStats['succCrosses'] / (filteredStats['minutes']/90);
    statsPer90['crossingPct'] = (filteredStats['succCrosses'] / filteredStats['totalCrosses']) * 100;
    statsPer90['dribbles'] = filteredStats['dribbles'] / (filteredStats['minutes']/90);
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['aerialDuelPct'] = (filteredStats['succAerialDuels'] / filteredStats['totalAerialDuels']) * 100;
    statsPer90['tacklePct'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    statsPer90 = roundTo2Decimals(statsPer90);
    return Object.values(statsPer90);
}

function calculateCenterbackStats(filteredStats){
    let statsPer90 = {};
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['tacklePct'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['blocks'] = (filteredStats['blocks'] / (filteredStats['minutes']/90));
    statsPer90['clearances'] = filteredStats['clearances'] / (filteredStats['minutes']/90);
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    statsPer90['aerialDuelPct'] = (filteredStats['succAerialDuels'] / filteredStats['totalAerialDuels']) * 100;
    statsPer90['succAerialDuels'] = filteredStats['succAerialDuels'] / (filteredStats['minutes']/90);
    statsPer90['longPassPct'] = (filteredStats['succLongPasses'] / filteredStats['totalLongPasses']) * 100;
    statsPer90['succLongPasses'] = (filteredStats['succLongPasses'] / (filteredStats['minutes']/90));
    statsPer90 = roundTo2Decimals(statsPer90);
    return Object.values(statsPer90);
}

function roundTo2Decimals(someStats){
    for (let stat in someStats){
        if (isFinite(someStats[stat])) {
            someStats[stat] = Math.round(someStats[stat] * 100) / 100;
        }
        else {
            someStats[stat] = 0;
        }
    }
    return someStats;
}

function setForwardTemplate(selectedStats){
    categories = [
        'Non-Penalty Goals',
        'Non-Penalty Shots',
        '% Shots on Target',
        '% Passes Completed',
        'Assists',
        'Key Passes',
        'Through Balls',
        'Recoveries',
        'Possession Losses',
        'Successful Dribbles',
        'Conversion Rate',
    ];
    yAxis = [
        {softMin: 0.12, softMax: 0.6, tickPositioner: function () {return placeTicks(selectedStats[0], 0.12, 0.6)}},
        {softMin: 1.7, softMax: 4.5, tickPositioner: function () {return placeTicks(selectedStats[1], 1.7, 4.5)}},
        {softMin: 27, softMax: 55, tickPositioner: function () {return placeTicks(selectedStats[2], 27, 55)}},
        {softMin: 65, softMax: 85, tickPositioner: function () {return placeTicks(selectedStats[3], 65, 85)}},
        {softMin: 0.08, softMax: 0.4, tickPositioner: function () {return placeTicks(selectedStats[4], 0.08, 0.4)}},
        {softMin: 1.12, softMax: 3, tickPositioner: function () {return placeTicks(selectedStats[5], 1.12, 3)}},
        {softMin: 0.13, softMax: 0.65, tickPositioner: function () {return placeTicks(selectedStats[6], 0.13, 0.65)}},
        {softMin: 1.3, softMax: 4.5, tickPositioner: function () {return placeTicks(selectedStats[7], 1.3, 4.5)}},
        {softMin: 1, softMax: 3, reversed: true, tickPositioner: function () {return placeTicks(selectedStats[8], 1, 3, true)}},
        {softMin: 0.7, softMax: 2.5, tickPositioner: function () {return placeTicks(selectedStats[9], 0.7, 2.5)}},
        {softMin: 4.5, softMax: 22.5, tickPositioner: function () {return placeTicks(selectedStats[10], 4.5, 22.5)}},
    ];
}

function setMidfieldTemplate(selectedStats){
    categories = [
        '% Passes Completed',
        'Key Passes',
        'Through Balls',
        'Direct Goal Involvement',
        'Successful Dribbles',
        'Possession Losses',
        'Fouls Committed',
        '% Tackles Won',
        'Tackles Won',
        'Interceptions',
        'Long Balls'
    ];
    yAxis = [
        {softMin: 74, softMax: 90, tickPositioner: function () {return placeTicks(selectedStats[0], 74, 90)}},
        {softMin: 0.7, softMax: 2.5, tickPositioner: function () {return placeTicks(selectedStats[1], 0.7, 2.5)}},
        {softMin: 0.1, softMax: 0.5, tickPositioner: function () {return placeTicks(selectedStats[2], 0.1, 0.5)}},
        {softMin: 0.1, softMax: 0.5, tickPositioner: function () {return placeTicks(selectedStats[3], 0.1, 0.5)}},
        {softMin: 0.5, softMax: 2.1, tickPositioner: function () {return placeTicks(selectedStats[4], 0.5, 2.1)}},
        {softMin: 0.5, softMax: 2.47, reversed: true, tickPositioner: function () {return placeTicks(selectedStats[5], 0.5, 2.47, true)}},
        {softMin: 0.6, softMax: 2.36, reversed: true, tickPositioner: function () {return placeTicks(selectedStats[6], 0.6, 2.36, true)}},
        {softMin: 45, softMax: 85, tickPositioner: function () {return placeTicks(selectedStats[7], 45, 85)}},
        {softMin: 1.65, softMax: 4.25, tickPositioner: function () {return placeTicks(selectedStats[8], 1.65, 4.25)}},
        {softMin: 1.31, softMax: 3.55, tickPositioner: function () {return placeTicks(selectedStats[9], 1.31, 3.55)}},
        {softMin: 2, softMax: 8, tickPositioner: function () {return placeTicks(selectedStats[10], 2, 8)}}
    ];
}

function setFullbackTemplate(selectedStats){
    categories = [
        'Tackles Won',
        'Interceptions',
        '% Passes Completed',
        'Key Passes',
        'Successful Crosses',
        '% Crosses Completed',
        'Successful Dribbles',
        'Possession Losses',
        '% Aerial Duels Won',
        '% Tackles Won',
        'Fouls Committed'
    ];
    yAxis = [
        {softMin: 1.73, softMax: 4.11, tickPositioner: function () {return placeTicks(selectedStats[0], 1.73, 4.11)}},
        {softMin: 1.5, softMax: 3.7, tickPositioner: function () {return placeTicks(selectedStats[1], 1.5, 3.7)}},
        {softMin: 70, softMax: 87, tickPositioner: function () {return placeTicks(selectedStats[2], 70, 87)}},
        {softMin: 0.47, softMax: 1.46, tickPositioner: function () {return placeTicks(selectedStats[3], 0.47, 1.46)}},
        {softMin: 0.32, softMax: 1.21, tickPositioner: function () {return placeTicks(selectedStats[4], 0.32, 1.21)}},
        {softMin: 14.84, softMax: 33, tickPositioner: function () {return placeTicks(selectedStats[5], 14.84, 33)}},
        {softMin: 0.4, softMax: 1.62, tickPositioner: function () {return placeTicks(selectedStats[6], 0.4, 1.62)}},
        {softMin: 0.23, softMax: 1.17, reversed: true, tickPositioner: function () {return placeTicks(selectedStats[7], 0.23, 1.17, true)}},
        {softMin: 30, softMax: 70, tickPositioner: function () {return placeTicks(selectedStats[8], 30, 70)}},
        {softMin: 45, softMax: 85, tickPositioner: function () {return placeTicks(selectedStats[9], 45, 85)}},
        {softMin: 0.54, softMax: 1.76, reversed: true, tickPositioner: function () {return placeTicks(selectedStats[10], 0.54, 1.76, true)}}
    ];
}

function setCenterbackTemplate(selectedStats){
    categories = [
        '% Passes Completed',
        '% Tackles Won',
        'Tackles Won',
        'Interceptions',
        'Blocks',
        'Clearances',
        'Fouls Committed',
        '% Aerial Duels Won',
        'Aerial Duels Won',
        '% Long Balls',
        'Long Balls',
    ];
    yAxis = [
        {softMin: 72.72, softMax: 90, tickPositioner: function () {return placeTicks(selectedStats[0], 72.72, 90)}},
        {softMin: 60, softMax: 100, tickPositioner: function () {return placeTicks(selectedStats[1], 60, 100)}},
        {softMin: 1.4, softMax: 3.43, tickPositioner: function () {return placeTicks(selectedStats[2], 1.4, 3.43)}},
        {softMin: 1.6, softMax: 4, tickPositioner: function () {return placeTicks(selectedStats[3], 1.6, 4)}},
        {softMin: 0.47, softMax: 1.17, tickPositioner: function () {return placeTicks(selectedStats[4], 0.47, 1.17)}},
        {softMin: 4.62, softMax: 10.4, tickPositioner: function () {return placeTicks(selectedStats[5], 4.62, 10.4)}},
        {softMin: 0.5, softMax: 1.7, reversed: true, tickPositioner: function () {return placeTicks(selectedStats[6], 0.5, 1.7, true)}},
        {softMin: 53.6, softMax: 76, tickPositioner: function () {return placeTicks(selectedStats[7], 53.6, 76)}},
        {softMin: 1.3, softMax: 3.93, tickPositioner: function () {return placeTicks(selectedStats[8], 1.3, 3.93)}},
        {softMin: 48.68, softMax: 77.2, tickPositioner: function () {return placeTicks(selectedStats[9], 48.68, 77.2)}},
        {softMin: 2.74, softMax: 7.05, tickPositioner: function () {return placeTicks(selectedStats[10], 2.74, 7.05)}}
    ];
}

function placeTicks(value, min, max, isReversed = false){
    if (value >= max){
        max = value * 1.001;
    }
    if (value <= min){
        min = value * 0.99;
    }
    let increment = (max - min) / 4;
    if (isReversed){
        max = max + increment;
    }
    else {
        min = min - increment;
    }
    return [min, value, max];
}

function drawRadar(selectedStats){
    let series;
    if (selectedStats === []){
        series = [];
    }
    else {
        series = [selectedStats];
    }
    radar = Highcharts.chart('radar', {
        chart: {
            parallelCoordinates: true,
            parallelAxes: {
                labels: {
                    style: {
                        color: '#222222',
                        fontSize: "1.1em",
                        fontWeight: "bold"
                    }
                },
                gridLineWidth: 0,
                lineWidth: 0,
                maxPadding: 0,
                endOnTick: true,
                showFirstLabel: false,
                showLastLabel: false
            },
            polar: true,
            type: 'bar',
            events: {
                // render: function() {
                //     var chart = this,
                //         middleElement = chart.middleElement;
                //
                //     if (middleElement) {
                //         middleElement.destroy();
                //     }
                //
                //     chart.middleElement = chart.renderer.circle(chart.plotSizeX / 2 + chart.plotLeft, chart.plotHeight / 2 + chart.plotTop, 20).attr({
                //         zIndex: 3,
                //         fill: '#ffffff'
                //     }).add();
                // },
                load: function() {
                    this.credits.element.onclick = function() {
                        window.open(url, '_blank');
                    }
                }
            },
            maxWidth: 1000,
            hideDelay: 0,
            marginLeft: 85,
            marginRight: 85,
            marginBottom: 10
        },
        style: {
            fontFamily: 'Lucida Grande'
        },
        credits: {
            text: 'All data is taken from www.whoscored.com',
        },
        plotOptions: {
            series: {
                softThreshold: false,
                color: Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0.6).get(),
            }
        },
        title: {
            text: name,
            style: {
                fontSize: '2em',
                fontWeight: 'bold',
                font: "Lucida Grande"
            }
        },
        pane: {
            startAngle: -16.3636363636363636363
        },
        lang: {
            noData: "No data to display"
        },
        noData: {
            style: {
                fontWeight: 'bold',
                fontSize: '1.5em',
                color: '#303030'
            }
        },
        subtitle: {
            text: '|',
            style: {
                fontSize: '1.5em'
            }
        },
        tooltip: {
            // pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
            //     '{series.name}: <b>{point.formattedValue}</b><br/>'
            pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
                ' <b>{point.formattedValue}</b><br/>'
        },
        legend: {
            enabled: false,
            borderWidth: 1,
            align: 'center',
            verticalAlign: 'bottom',
            layout: 'horizontal'
        },
        yAxis: yAxis,
        xAxis: {
            categories: categories,
            labels: {
                distance: 40,
                style: {
                    fontSize: '1.15em',
                }
            },
            gridLineWidth: 1.5,
            gridLineColor: '#000000'
        },
        series:
            series.map(function (set, i) {
                return {
                    pointPadding: 0,
                    groupPadding: 0,
                    name: name,
                    data: set,
                    stickyTracking: false
                };
            }),
        exporting: {
            scale: 1,
            sourceWidth: 1920,
            sourceHeight: 1080,
            buttons: {
                contextButton: {
                    menuItems: ["viewFullscreen", "printChart", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG"]
                }
            }
        }
    });
}

function toggleDataTable(){
    let dataTable = $('.highcharts-data-table');
    if (dataTable.length){
        dataTable.remove();
    }
    else {
        updateRadar();
        radar.viewData();
    }
    radar.reflow();
}

function selectAllSeasons(){
    $('#competitions').trigger("reset");
    updateRadar(false);
}

function clearAllSeasons(){
    let dataTable = $('.highcharts-data-table');
    $('input:checkbox').prop("checked", false);
    // if (dataTable.length){
    //     dataTable.css("opacity", 0);
    // }
    updateRadar();
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