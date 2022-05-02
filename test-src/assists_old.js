"use strict";

const topLeftX = 20;
const topLeftY = 20;
const bottomRightX = 437;
const bottomRightY = 290;

window.addEventListener("load", init);
var assistData;
var xScale, yScale;
var widthScale, colorScale;

function selectData() {
    let season = $("#assists-season-sel").val();
    console.log(season)
    return assistData[season]
}

function getStartX(pass) {
    let start_x = pass['start_x'];
    return xScale(start_x);
}

function getStartY(pass) {
    let start_y = pass['start_y'];
    return yScale(start_y);
}

function updateAssists() {
    let data = selectData();
    console.log(data)
    
    const svg = d3.select("svg#field-assist");
    
    svg.selectAll("circle")
        .data(data)
        .join(
            enterSelection => {
                enterSelection.append("circle")
                    .attr("cx", pass => getStartX(pass))
                    .attr("cy", pass => getStartY(pass))
                    .attr("r", 3)
                    .attr("fill", "black")
                    .transition()
                        .duration(500)
            },
            updateSelection => {
                updateSelection.transition()
                    .duration(200)
                    .attr("cx", pass => getStartX(pass))
                    .attr("cy", pass => getStartY(pass))
                    .attr("r", 3)
                    .attr("fill", "black")
            },
            exitSelection => {
                exitSelection.transition()
                    .duration(500)
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

    // data loading and handling
    d3.json('http://localhost:12345/data/assists_barcelona_clean.json')
        .then(function(data) {
            console.log(data);
            assistData = data;

            // Populate dropdowns
            let seasons = Object.keys(data);
            $("#assists-team-sel").append(new Option('Barcelona', 'Barcelona'));
            seasons.sort().forEach(function(seasonOption) {
                $("#assists-season-sel").append(new Option(seasonOption, seasonOption))
                $("#assists-season-sel").val("La Liga \(2019/2020\)")
            });
            // Set-up Handlers
            $("#assists-season-sel").on('change', function(event) {
                updateAssists()
            });

            updateAssists()
        })
        .catch(function(err) {
            console.log(err);
        });
}
