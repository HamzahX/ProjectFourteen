var socket = io();

let radar;

let stats = {};
let competitions = [];

let name;
let club;
let nationality;

socket.on('search results', function(results){
    $('.search-filter-input').empty();
    $('#search-results').empty();
    for (let i=0; i<results.length; i++){
        let resultID = "result" + i;
        let name = results[i]["name"];
        let nationality = results[i]["nationality"];
        let club = results[i]["club"];
        let url = results[i]["URL"];
        $('#search-results').append('<div onclick="return getStats(this)" class="search-result" id="' + resultID + '">' +
            '<div class="name">' + name + '</div>' +
            '<div class="club">Club: ' + club + '</div>' +
            '<div class="nationality">Nationality: ' + nationality + '</div>' +
            '<div style="display:none" class="url">' + url + '</div>' +
            '</div>'
        );
    }
    $("#loading-screen").css("display","none");
    $("#search-screen").css("display","flex");
    $("#search-filters").css("display","block");
    $("#search-results").css("display","grid");
});

socket.on('stats scraped', function(someStats){
    console.log(someStats);
    stats = someStats;
    competitions = Object.keys(someStats);
    for (let i=0; i<competitions.length; i++){
        $('#competitions').append('<input class="competition" type="checkbox" value=' + competitions[i] + ' onchange="updateRadar(false)" checked> ' + competitions[i] + '<br><br>');
    }
    $('#radar').empty();
    $("#loading-screen").css("display","none");
    $("#content-screen").css("display","flex");
    updateRadar();
});

socket.on('alert error', function(anError){
    alert(anError + "\nPlease wait for the page to reload and try again");
    location.reload();
});

function search(){
    if ($('#loading-screen').css('display') === 'none') {
        $('.highcharts-data-table').remove();
        let query = $('#query').val();
        socket.emit('search', query);
        $("#search-screen").css("display", "none");
        $("#content-screen").css("display", "none");
        drawLoadingScreen("search");
    }
}

function getStats(elem){
    $('#filterByClub').val("");
    $('#filterByNationality').val("");
    $('#radar').empty();
    $('#competitions').empty();
    let url = $(elem).find('.url').text();
    name = $(elem).find('.name').text();
    club = $(elem).find('.club').text().substring(6);
    nationality = $(elem).find('.nationality').text().substring(13);
    socket.emit('scrape stats', url);
    $("#search-screen").css("display","none");
    drawLoadingScreen("getStats");
}

function drawLoadingScreen(type){
    $('#loading-screen').empty();
    $('#loading-screen').append('<div id="circularG"> <div id="circularG_1" class="circularG"></div> ' +
        '<div id="circularG_2" class="circularG"></div> <div id="circularG_3" class="circularG"></div> ' +
        '<div id="circularG_4" class="circularG"></div> <div id="circularG_5" class="circularG"></div> ' +
        '<div id="circularG_6" class="circularG"></div> <div id="circularG_7" class="circularG"></div> ' +
        '<div id="circularG_8" class="circularG"></div> </div>');
    switch(type){
        case "search":
            $('#loading-screen').append('Searching');
            break;
        case "getStats":
            $('#loading-screen').append('Retrieving Stats');
            break;
    }
    $("#loading-screen").css("display","flex");
}

function updateRadar(isNew = true){
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
        console.log("empty");
        drawRadar([], '', [], []);
    }
    else {
        if (template === 'FW') {
            let fwStats = calculateForwardStats(filteredStats);
            drawRadarFW(fwStats, isNew);
        } else if (template === 'MF') {
            let mfStats = calculateMidfielderStats(filteredStats);
            drawRadarMF(mfStats, isNew);
        } else if (template === 'FB') {
            let fbStats = calculateFullbackStats(filteredStats);
            drawRadarFB(fbStats, isNew);
        } else {
            let dfStats = calculateDefenderStats(filteredStats);
            drawRadarDF(dfStats, isNew);
        }
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
    statsPer90['goals'] = filteredStats['goals'] / (filteredStats['minutes']/90);
    statsPer90['shots'] = filteredStats['shots'] / (filteredStats['minutes']/90);
    statsPer90['conversionRate'] = (filteredStats['goals'] / filteredStats['shots']) * 100;
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['throughBalls'] = filteredStats['throughBalls'] / (filteredStats['minutes']/90);
    statsPer90['tacklesAndInterceptions'] = (filteredStats['tackles'] / (filteredStats['minutes']/90)) + (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['dribbles'] = filteredStats['dribbles'] / (filteredStats['minutes']/90);
    for (stat in statsPer90){
        statsPer90[stat] = Math.round(statsPer90[stat] * 100) / 100;
    }
    return Object.values(statsPer90);
}

function calculateMidfielderStats(filteredStats){
    let statsPer90 = {};
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['throughBalls'] = filteredStats['throughBalls'] / (filteredStats['minutes']/90);
    statsPer90['dribbles'] = filteredStats['dribbles'] / (filteredStats['minutes']/90);
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    statsPer90['tacklePct'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['longPasses'] = (filteredStats['longPasses'] / (filteredStats['minutes']/90));
    for (stat in statsPer90){
        statsPer90[stat] = Math.round(statsPer90[stat] * 100) / 100;
    }
    return Object.values(statsPer90);
}

function calculateFullbackStats(filteredStats){
    let statsPer90 = {};
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['assists'] = filteredStats['assists'] / (filteredStats['minutes']/90);
    statsPer90['keyPasses'] = filteredStats['keyPasses'] / (filteredStats['minutes']/90);
    statsPer90['succCrosses'] = filteredStats['succCrosses'] / (filteredStats['minutes']/90);
    statsPer90['crossingPct'] = (filteredStats['succCrosses'] / filteredStats['totalCrosses']) * 100;
    statsPer90['dribbles'] = filteredStats['dribbles'] / (filteredStats['minutes']/90);
    statsPer90['possessionLosses'] = filteredStats['possessionLosses'] / (filteredStats['minutes']/90);
    statsPer90['succAerialDuels'] = filteredStats['succAerialDuels'] / (filteredStats['minutes']/90);
    statsPer90['tacklePct'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    for (stat in statsPer90){
        statsPer90[stat] = Math.round(statsPer90[stat] * 100) / 100;
    }
    return Object.values(statsPer90);
}

function calculateDefenderStats(filteredStats){
    let statsPer90 = {};
    statsPer90['passingPct'] = (filteredStats['succPasses'] / filteredStats['totalPasses']) * 100;
    statsPer90['tacklePct'] = (filteredStats['tackles'] / (filteredStats['tackles'] + filteredStats['dribbledPast'])) *100;
    statsPer90['tackles'] = (filteredStats['tackles'] / (filteredStats['minutes']/90));
    statsPer90['interceptions'] = (filteredStats['interceptions'] / (filteredStats['minutes']/90));
    statsPer90['clearances'] = filteredStats['clearances'] / (filteredStats['minutes']/90);
    statsPer90['fouls'] = filteredStats['fouls'] / (filteredStats['minutes']/90);
    statsPer90['aerialDuelPct'] = (filteredStats['succAerialDuels'] / filteredStats['totalAerialDuels']) * 100;
    statsPer90['succAerialDuels'] = filteredStats['succAerialDuels'] / (filteredStats['minutes']/90);
    statsPer90['longPasses'] = (filteredStats['longPasses'] / (filteredStats['minutes']/90));
    for (stat in statsPer90){
        statsPer90[stat] = Math.round(statsPer90[stat] * 100) / 100;
    }
    return Object.values(statsPer90);
}

function drawRadarFW(stats, isNew){
    let subtitle = 'FW / AM Template  |  per 90';
    let categories = [
        'Non-Penalty Goals',
        'Non-Penalty Shots',
        'Conversion Rate',
        '% Passes Completed',
        'Assists',
        'Key Passes',
        'Through Balls',
        'Recoveries',
        'Possession Losses',
        'Successful Dribbles'
    ];
    let yAxis = [
        {softMin: 0, softMax: 1, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.25, 0.5, 0.75, 1], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 6, maxPadding: 0, endOnTick: false, tickPositions: [0, 1.5, 3, 4.5, 6], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 30, maxPadding: 0, endOnTick: false, tickPositions: [0, 7.5, 15, 22.5, 30], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 60, softMax: 100, maxPadding: 0, endOnTick: false, tickPositions: [60, 70, 80, 90, 100], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 0.6, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.15, 0.3, 0.45, 0.6], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 4, maxPadding: 0, endOnTick: false, tickPositions: [0, 1, 2, 3, 4], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 0.6, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.15, 0.3, 0.45, 0.6], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 3, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.75, 1.5, 2.25, 3], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 6, reversed: true, maxPadding: 0, endOnTick: false, tickPositions: [0, 1.5, 3, 4.5, 6], showFirstLabel: true, showLastLabel: false, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 6, maxPadding: 0, endOnTick: false, tickPositions: [0, 1.5, 3, 4.5, 6], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}}
    ];
    if (isNew) {
        drawRadar(stats, subtitle, categories, yAxis);
        if ($('.highcharts-data-table').length){
            $('.highcharts-data-table').remove();
        }
    }
    else {
        $.each(radar.series[0].data, function (i, point) {
            point.update(stats[i], false);
        });
        radar.redraw();
        if ($('.highcharts-data-table').length){
            radar.viewData();
        }
    }
    radar.reflow();
}

function drawRadarMF(stats, isNew){
    let subtitle = 'CM / DM Template  |  per 90';
    let categories = [
        '% Passes Completed',
        'Assists',
        'Key Passes',
        'Through Balls',
        'Successful Dribbles',
        'Possession Losses',
        'Fouls Committed',
        '% Tackles Won',
        'Tackles Won',
        'Interceptions',
        'Long Balls'
    ];
    let yAxis = [
        {softMin: 60, softMax: 100, maxPadding: 0, endOnTick: false, tickPositions: [60, 70, 80, 90, 100], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 0.4, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.1, 0.2, 0.3, 0.4], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 3, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.75, 1.5, 2.25, 3], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 0.4, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.1, 0.2, 0.3, 0.4], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 3, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.75, 1.5, 2.25, 3], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 4, reversed: true, maxPadding: 0, endOnTick: false, tickPositions: [0, 1, 2, 3, 4], showFirstLabel: true, showLastLabel: false, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 2, reversed: true, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.5, 1, 1.5, 2], showFirstLabel: true, showLastLabel: false, labels: {style: {fontSize: "13px"}}},
        {softMin: 35, softMax: 75, maxPadding: 0, endOnTick: false, tickPositions: [35, 45, 55, 65, 75], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 4, maxPadding: 0, endOnTick: false, tickPositions: [0, 1, 2, 3, 4], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 4, maxPadding: 0, endOnTick: false, tickPositions: [0, 1, 2, 3, 4], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 8, maxPadding: 0, endOnTick: false, tickPositions: [0, 2, 4, 6, 8], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}}
    ];
    if (isNew) {
        drawRadar(stats, subtitle, categories, yAxis);
        if ($('.highcharts-data-table').length){
            $('.highcharts-data-table').remove();
        }
    }
    else {
        $.each(radar.series[0].data, function (i, point) {
            point.update(stats[i], false);
        });
        radar.redraw();
        if ($('.highcharts-data-table').length){
            radar.viewData();
        }
    }
    radar.reflow();
}

function drawRadarFB(stats, isNew){
    let subtitle = 'FB Template  |  per 90';
    let categories = [
        'Tackles Won',
        'Interceptions',
        '% Passes Completed',
        'Assists',
        'Key Passes',
        'Successful Crosses',
        '% Crosses Completed',
        'Successful Dribbles',
        'Possession Losses',
        'Aerial Duels Won',
        '% Tackles Won',
        'Fouls Committed'
    ];
    let yAxis = [
        {softMin: 0, softMax: 4, maxPadding: 0, endOnTick: false, tickPositions: [0, 1, 2, 3, 4], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 4, maxPadding: 0, endOnTick: false, tickPositions: [0, 1, 2, 3, 4], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 60, softMax: 100, maxPadding: 0, endOnTick: false, tickPositions: [60, 70, 80, 90, 100], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 0.4, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.1, 0.2, 0.3, 0.4], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 2, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.5, 1, 1.5, 2], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 2, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.5, 1, 1.5, 2], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 40, maxPadding: 0, endOnTick: false, tickPositions: [0, 10, 20, 30, 40], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 2, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.5, 1, 1.5, 2], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 4, reversed: true, maxPadding: 0, endOnTick: false, tickPositions: [0, 1, 2, 3, 4], showFirstLabel: true, showLastLabel: false, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 2, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.5, 1, 1.5, 2], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 45, softMax: 85, maxPadding: 0, endOnTick: false, tickPositions: [45, 55, 65, 75, 85], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 2, reversed: true, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.5, 1, 1.5, 2], showFirstLabel: true, showLastLabel: false, labels: {style: {fontSize: "13px"}}}
    ];
    if (isNew) {
        drawRadar(stats, subtitle, categories, yAxis);
        if ($('.highcharts-data-table').length){
            $('.highcharts-data-table').remove();
        }
    }
    else {
        $.each(radar.series[0].data, function (i, point) {
            point.update(stats[i], false);
        });
        radar.redraw();
        if ($('.highcharts-data-table').length){
            radar.viewData();
        }
    }
    radar.reflow();
}

function drawRadarDF(stats, isNew){
    let subtitle = 'CB Template  |  per 90';
    let categories = [
        '% Passes Completed',
        '% Tackles Won',
        'Tackles Won',
        'Interceptions',
        'Clearances',
        'Fouls Committed',
        '% Aerial Duels Won',
        'Aerial Duels Won',
        'Long Balls',
    ];
    let yAxis = [
        {softMin: 60, softMax: 100, maxPadding: 0, endOnTick: false, tickPositions: [60, 70, 80, 90, 100], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 60, softMax: 100, maxPadding: 0, endOnTick: false, tickPositions: [60, 70, 80, 90, 100], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 4, maxPadding: 0, endOnTick: false, tickPositions: [0, 1, 2, 3, 4], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 3, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.75, 1.5, 2.25, 3], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 8, maxPadding: 0, endOnTick: false, tickPositions: [0, 2, 4, 6, 8], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 2, reversed: true, maxPadding: 0, endOnTick: false, tickPositions: [0, 0.5, 1, 1.5, 2], showFirstLabel: true, showLastLabel: false, labels: {style: {fontSize: "13px"}}},
        {softMin: 45, softMax: 85, maxPadding: 0, endOnTick: false, tickPositions: [45, 55, 65, 75, 85], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 4, maxPadding: 0, endOnTick: false, tickPositions: [0, 1, 2, 3, 4], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}},
        {softMin: 0, softMax: 8, maxPadding: 0, endOnTick: false, tickPositions: [0, 2, 4, 6, 8], showFirstLabel: false, showLastLabel: true, labels: {style: {fontSize: "13px"}}}
    ];
    if (isNew) {
        drawRadar(stats, subtitle, categories, yAxis);
        if ($('.highcharts-data-table').length){
            $('.highcharts-data-table').remove();
        }
    }
    else {
        $.each(radar.series[0].data, function (i, point) {
            point.update(stats[i], false);
        });
        radar.redraw();
        if ($('.highcharts-data-table').length){
            radar.viewData();
        }
    }
    radar.reflow();
}

function drawRadar(stats, subtitle, categories, yAxis){
    let series;
    if (stats === []){
        series = [];
    }
    else {
        series = [stats];
    }
    radar = Highcharts.chart('radar', {
        chart: {
            parallelCoordinates: true,
            parallelAxes: {
                labels: {
                    style: {
                        color: 'gray'
                    }
                },
                gridLineWidth: 0,
                lineWidth: 1,
            },
            polar: true,
            type: 'area',
            maxWidth: 1000,
            hideDelay: 0,
            marginLeft: 50,
            marginRight: 50,
            marginBottom: 25
        },
        credits: {
            text: 'All data is taken from whoscored.com',
            href: 'http://www.whoscored.com'
        },
        plotOptions: {
            series: {
                softThreshold: false,
                color: Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0.8).get(),
                fillColor: Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0.25).get(),
            }
        },
        title: {
            text: name,
            style: {
                fontSize: '2em'
            }
        },
        lang: {
            noData: "No data to display"
        },
        noData: {
            style: {
                fontWeight: 'bold',
                fontSize: '15px',
                color: '#303030'
            }
        },
        subtitle: {
            text: subtitle,
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
                distance: 30,
                style: {
                    fontSize: '1em'
                },
                padding: 0,
            },
            margin: 0,
            gridLineWidth: 0,
        },
        series:
            series.map(function (set, i) {
                return {
                    name: name,
                    data: set,
                    stickyTracking: true
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
    if ($('.highcharts-data-table').length){
        $('.highcharts-data-table').remove();
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
    $('input:checkbox').prop("checked", false);
    if ($('.highcharts-data-table').length){
        $('.highcharts-data-table').remove();
    }
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