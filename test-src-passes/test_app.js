"use strict";

const topLeftX = 20;
const topLeftY = 20;
const bottomRightX = 437;
const bottomRightY = 290;
const N_DICT = {'Champions League (2008/2009)': 1,
'Champions League (2010/2011)': 1,
'Champions League (2014/2015)': 1,
'La Liga (2004/2005)': 7,
'La Liga (2005/2006)': 17,
'La Liga (2006/2007)': 26,
'La Liga (2007/2008)': 28,
'La Liga (2008/2009)': 31,
'La Liga (2009/2010)': 35,
'La Liga (2010/2011)': 33,
'La Liga (2011/2012)': 37,
'La Liga (2012/2013)': 32,
'La Liga (2013/2014)': 31,
'La Liga (2014/2015)': 38,
'La Liga (2015/2016)': 33,
'La Liga (2016/2017)': 34,
'La Liga (2017/2018)': 36,
'La Liga (2018/2019)': 34,
'La Liga (2019/2020)': 33}

window.addEventListener("load", init);
var passData, seasonData;
var xScale, yScale;
var widthScale, colorScale, lengthScale, opacityScale;
var completeFilter = [0, 100];
var lengthFilter = [0, 100];

function selectData() {
    let season = $("#passes-season-sel").val();
    seasonData = passData[season]
    lengthScale = d3.scaleLinear().domain([0,100])
        .range(d3.extent(seasonData.map(p => p['length'])))
    let noun = N_DICT[season] > 1 ? ' matches' : ' match'
    $("#aggregate-number").text('Aggregate over ' + N_DICT[season] + noun)
    return seasonData
}

function getOrthogonal(vector) { return [-vector[1], vector[0]]; }
function getMagnitude(vector) { return Math.sqrt(vector[0]**2 + vector[1]**2) }
function getThickPoint(thickEnd, passVector, width, sign) {
    let endOrth = getOrthogonal(passVector);
    let magnitude = getMagnitude(endOrth);
    let point = [xScale(thickEnd[0]) + sign * endOrth[0] * width / magnitude,
                 yScale(thickEnd[1]) + sign * endOrth[1] * width / magnitude]
    return point;
}
const taperMult = 1.5;
function getPath(pass) {
    let start = pass['start_location'];
    let end = pass['end_location'];
    let passVector = [xScale(end[0])-xScale(start[0]), yScale(end[1])-yScale(start[1])];
    let width = widthScale(pass['count']);
    let line = d3.line();

    let taper = [xScale(start[0]), yScale(start[1])]
    let passMagnitude = getMagnitude(passVector)
    let shortTaper = [xScale(end[0]) + taperMult * passVector[0] * width / passMagnitude,
                      yScale(end[1]) + taperMult * passVector[1] * width / passMagnitude];
    return line([taper, getThickPoint(end, passVector, width, 1),
                 shortTaper, getThickPoint(end, passVector, width, -1)])
}
function encodeColor(pass) { return colorScale(pass['complete']); }
function encodeOpacity(pass) { return pass['count']; }

function updatePasses(data) {
    let maxClusterSize = data.map(p => p['count']).reduce((x,y) => x > y ? x : y);
    widthScale = d3.scaleLinear()
        .domain(d3.extent(data.map(p => p['count'])))
        .range([1, 2]);
    
    data = data.filter(p => 
        p['length'] >= lengthScale(lengthFilter[0]) & p['length'] <= lengthScale(lengthFilter[1]))
    data = data.filter(p => 
        p['complete'] >= completeFilter[0] / 100 & p['complete'] <= completeFilter[1] / 100)
    
    const svg = d3.select("svg");
    svg.selectAll("path")
        .data(data)
        .join(
            enterSelection => {
                enterSelection.append("path")
                    .attr("d", pass => getPath(pass))
                    .attr("opacity", 0)
                    .attr("fill", pass => encodeColor(pass))
                    .transition()
                        .duration(200)
                        .attr("opacity", pass => opacityScale(encodeOpacity(pass) / maxClusterSize))
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(200)
                    .attr("d", pass => getPath(pass))
                    .attr("fill", pass => encodeColor(pass))
                    .attr("opacity", pass => opacityScale(encodeOpacity(pass) / maxClusterSize))
            },
            exitSelection => {
                exitSelection.transition()
                    .duration(200)
                    .attr('opacity', 0)
                    .remove();
            }
        );
}

function init() {
    // data to SVG coordinate transforms
    xScale = d3.scaleLinear()
        .domain([0, 120])
        .range([topLeftX, bottomRightX]);
    yScale = d3.scaleLinear()
        .domain([0, 80])
        .range([topLeftY, bottomRightY]);
    colorScale = d3.scaleLinear().domain([0,1])
        .range(["red", "blue"])
    opacityScale = d3.scaleLinear().domain([0,1])
        .range([0.05, 1])

    // setup sliders and restyle
    $("#length-slider").slider({
        range: true,
        min: 0,
        max: 100,
        values: [0,100], 
        stop: function(event, ui) { lengthFilter = ui.values; updatePasses(seasonData); }
    });
    $("#complete-slider").slider({
        range: true,
        min: 0,
        max: 100,
        values: [0,100],
        orientation: 'vertical',
        slide: function(event, ui) {
            let low = ui.values[0];
            let high = ui.values[1];
            $("#complete-slider > div").css('background',
                'linear-gradient(0deg,' + colorScale(low / 100) + ',' + colorScale(high / 100) + ')') },
        stop: function(event, ui) { completeFilter = ui.values; updatePasses(seasonData); }
    });

    $("#complete-slider").css('height', '240px');
    $("#complete-slider").css('background', '#dddddd');
    $("#complete-slider > div").css('background',
        'linear-gradient(0deg,' + colorScale(0) + ',' + colorScale(1) + ')')
    $("#length-slider").css('background', '#dddddd');
    $("#length-slider > div").css('background', '#000000');

    // data loading and handling
    d3.json('http://localhost:12345/data/passes_barcelona_aggregate.json')
        .then(function(data) {
            // console.log(data);
            passData = data;

            // Populate dropdowns
            let seasons = Object.keys(data);
            $("#passes-team-sel").append(new Option('Barcelona', 'Barcelona'));
            seasons.sort().forEach(function(seasonOption) {
                $("#passes-season-sel").append(new Option(seasonOption, seasonOption))
            });
            // Set-up Handlers
            $("#passes-season-sel").on('change', function(event) {
                let data = selectData();
                updatePasses(data)
            });

            updatePasses(selectData())
        })
        .catch(function(err) {
            console.log(err);
        });

    console.log('Init finished.')
}
