import dataset from "./main.js";
import { focus, stopFocus, selectObject, setFilter, checkSelection } from "./main.js";
var parallelPlotLevel = "city"
var path
const filters = new Map();

async function parallelPlot(level) {


    parallelPlotLevel = level
    let datasetColumns = ["downloadSpeed_mbps", "uploadSpeed_mbps", "latency_ms", "tests"]
    const stateOfWorks = ["unknown", "in definitive planning", "in executive planning", "scheduled", "being implemented", "in progress", "being tested", "done"]
    if (level == "city") {
        datasetColumns.push("stateOfWorks")
    }
    var width = document.getElementById("parallelPlot").clientWidth
    var height = document.getElementById("parallelPlot").clientHeight
    var margin = { top: 25, right: 0, bottom: 10, left: 0 }


    d3.select("#svgParallelPlot").remove();
    d3.select("#parallelPlot").style("background-image", "url(./static/gif/giphy.gif)") //Show the "Loading" GIF


    var parallelSVG = d3.select("#parallelPlot")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "svgParallelPlot")
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    width -= margin.left + margin.right
    height -= margin.top + margin.bottom
    var y = {}
    for (const column of datasetColumns) {
        var ranges = {
            minValue: 0,
            maxValue: 0
        };
        dataset[level].forEach(function (d) {
            ranges.minValue = Math.min(ranges.minValue, d[0][column])
            ranges.maxValue = Math.max(ranges.maxValue, d[0][column])
        })
        y[column] = d3.scaleLinear()
            .domain([ranges.minValue, ranges.maxValue])
            .range([height, 0]).nice()
    }
    if (level == "city") {
        y["stateOfWorks"] = d3.scaleLinear()
            .domain([0, 7])
            .range([height, 0])
    }
    var x = d3.scalePoint()
        .range([0, width])
        .padding(0.15)
        .domain(datasetColumns);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function computePath(d) {
        return d3.line()(datasetColumns.map(function (p) {

            if (p == "stateOfWorks") {
                return [x(p), y[p](stateOfWorks.indexOf(d[1][0][p]))];
            }
            else {
                return [x(p), y[p](d[1][0][p])];
            }
        }));
    }
    var tooltip = d3.select("body")
        .append("div")
        .style("opacity", 1)
        .style("position", "absolute")
        .attr("id", "tooltip_map")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "2px")
        .style("visibility", "hidden")
        .style("font-size", "15px")
        .style("z-index", "10")
        .text("");
    // Draw the lines
    path = parallelSVG
        .selectAll("parallelLine")
        .data(dataset[level])
        .enter().append("path")
        .attr("d", computePath)
        .style("fill", "none")
        .style("stroke", "#6baed6")
        .style("stroke-width", "2px")
        .style("opacity", 1.0)
        .style("cursor", "pointer")
        .on("click", function (event, d) {
            selectObject(d[0], level)
        })
        .on("mouseenter", function (event, d) {
            focus(d[0], level)
        })
        .on("mouseover", function (event, d) {
            var text = ""
            var data = d[1][0]
            if (data.region) {
                text = text + data.region
            }
            if (data.province) {
                text = text + ", " + data.province
            }
            if (data.city) {
                text = text + ", " + data.city
            }
            text = text + "<br>"

            text = text + "Average Download Speed: <b>" + Number(data.downloadSpeed_mbps).toFixed(2) + "</b> MBps."
            text = text + " Average Upload Speed: <b>" + Number(data.uploadSpeed_mbps).toFixed(2) + "</b> MBps. <br>"
            text = text + "Average Latency: <b>" + Number(data.latency_ms).toFixed(2) + "</b> ms."
            text = text + " Total Number of tests: <b>" + (data.tests) + "</b>. <br>"
            if (data.stateOfWorks) {
                text = text + "Current State of Works: <b>" + data.stateOfWorks.charAt(0).toUpperCase() + data.stateOfWorks.slice(1) + "</b>"
            }
            tooltip.html(text)
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event) {
            return tooltip.style("top", event.pageY - 50 + "px")
                .style("left", event.pageX + 5 + "px");
        })
        .on("mouseout", function (event, d) {
            stopFocus()
            return tooltip.style("visibility", "hidden");
        });

    const brush = d3.brushY()
        .extent([
            [-10, 0],
            [10, height]
        ])
        .on("start brush", brushed)
    // .on("end", brushEnd);
    // Draw the axis:
    var g = parallelSVG.selectAll("parallelAxis")
        .data(datasetColumns).enter()
        .append("g")
        .attr("id", "parallelAxis")
        .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
        .each(function (d) {
            if (d == "stateOfWorks") {
                d3.select(this).call(d3.axisLeft(y[d]).ticks(7)
                    .tickFormat((d, i) => stateOfWorks[i].charAt(0).toUpperCase() + stateOfWorks[i].slice(1)))
                    .style("font-size", "12px")
                    .call(brush)
            }
            else {
                d3.select(this).call(d3.axisLeft().scale(y[d]).ticks(20))
                    .style("font-size", "12px")
                    .call(brush)
            }
        }
        )
        // Add axis title
        .append("text")
        .style("text-anchor", "middle")
        .attr("x", function (d, i) {
            if (i == 0) {
                return 40
            }
            else if (i == (datasetColumns.length - 1)) {
                return -40
            }
        })
        .attr("y", -9)

        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(function (d) {
            switch (d) {
                case "downloadSpeed_mbps":
                    return ("Download Speed (MBps)")
                case "uploadSpeed_mbps":
                    return ("Upload Speed (MBps)")
                case "latency_ms":
                    return ("Latency (ms)")
                case "tests":
                    return ("Number of Tests")
                case "stateOfWorks":
                    return ("State of Works")
            }
            return d;
        })
        .style("fill", "black")

    function brushed(event, key) { //Selection is the range we're filtering, key is the name of the attribute we're filtering
        const selection = event.selection
        const filteredObjects = []
        if (selection[0] == selection[1]) {
            filters.delete(key);
        }

        else filters.set(key, selection.map(y[key].invert));
        let keys = Array.from(filters.keys());
        if (keys.length > 0) {
            path.each(function (d) {
                if (keys.every(column => {
                    if (column == "stateOfWorks") {
                        return (stateOfWorks.indexOf(d[1][0][column]) >= filters.get(column)[1] && stateOfWorks.indexOf(d[1][0][column]) <= filters.get(column)[0])
                    }
                    else {
                        return (d[1][0][column] >= filters.get(column)[1] && d[1][0][column] <= filters.get(column)[0])
                    }
                })) {
                    filteredObjects.push(d[0])
                }
            });
        }
        setFilter("parallelPlot", level, filteredObjects)
    }
    d3.select("#parallelPlot").style("background-image", "none") //Remove the "Loading" GIF
}
function updateParallelPlot() {
    path.each(function (d) {
        const color = checkSelection(d[0], d[1][0], parallelPlotLevel, "#2171b5", "#bdd7e7", "#6baed6")
        d3.select(this).style("stroke", color)
        if (color == "#2171b5") {
            this.parentNode.appendChild(this);
        }
    });
    d3.selectAll("#parallelAxis").each(function (d) {
        this.parentNode.appendChild(this);
    })
}
function focusParallelPlot(objFocus, levelFocus) {
    path.each(function (d) {
        let obj = d[1][0]
        if (obj.city) {
            if (levelFocus == "city" && obj.city == objFocus) {
                focusThis(this)
            }
            else if (levelFocus == "province") {
                if (obj.province == objFocus) {
                    focusThis(this)
                }
            }
            else {
                if (obj.region == objFocus) {
                    focusThis(this)
                }
            }
        }
        else if (obj.province) {
            if (levelFocus == "province") {
                if (obj.province == objFocus) {
                    focusThis(this)
                }
            }
            else {
                if (obj.region == objFocus) {
                    focusThis(this)
                }
            }
        }
        else if (obj.region == objFocus) {
            focusThis(this)
        }
    });
    function focusThis(thisObj) {
        d3.select(thisObj).style("stroke", "red")
        return thisObj.parentNode.appendChild(thisObj);
    }
}
function stopFocusParallelPlot() {
    updateParallelPlot()
}
export { focusParallelPlot, stopFocusParallelPlot, parallelPlot, updateParallelPlot };
