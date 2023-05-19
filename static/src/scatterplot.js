import dataset from "./main.js";
import { focus, stopFocus, selectObject, selectMultipleObjects, checkSelection, setFilter } from "./main.js";
//Brush
var brushButton = document.getElementById("brushDragToggle")
var brushDragToggle = false; //true -> brush; false -> drag
var scatterplot, level, zoomEvent, width, height, margin

brushButton.addEventListener("click", () => {
    brushDragToggle = !brushDragToggle
    const brush = d3.brush()
        .extent([
            [0, 0],
            [width, height]
        ])
        .on("start", function (event) {
            event.sourceEvent.stopPropagation()
            brushed(event)
        })
        .on("brush", brushed)
    if (brushDragToggle) { //Enable Brushing
        brushButton.innerHTML = "Activate Drag/Zoom"
        d3.select("#svgScatterplot")
            .append("g")
            .attr("id", "scatterBrush")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(brush);
    }
    else {      //Disable brushing
        brushButton.innerHTML = "Activate Brushing"
        d3.select("#svgScatterplot").select("#scatterBrush").remove();
    }
})

function computeScatterplot(newLevel, yName, xName) {

    var x, y, xAxis, yAxis, gx, gy
    var data;
    level = newLevel
    brushDragToggle = false
    brushButton.innerHTML = "Activate Brushing"
    // Remove old scatterplot if there is already one
    d3.select("#svgScatterplot").remove();
    d3.select("#scatterplot").style("background-image", "url(./static/gif/giphy.gif)") //Show the "Loading" GIF

    if (!yName) {
        xName = "tsneX"
        yName = "tsneY"
        data = dataset.tsne
    }
    else {
        data = dataset[level]
    }
    var ranges = {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0
    };
    data.forEach(function (value, key) {
        ranges.minX = Math.min(ranges.minX, value[0][xName])
        ranges.maxX = Math.max(ranges.maxX, value[0][xName])

        ranges.minY = Math.min(ranges.minY, value[0][yName])
        ranges.maxY = Math.max(ranges.maxY, value[0][yName])
    })
    width = document.getElementById("scatterplot").clientWidth
    height = document.getElementById("scatterplot").clientHeight
    margin = { top: 20, right: 20, bottom: 30, left: 40 }
    width -= margin.top + margin.bottom
    height -= margin.left + margin.right
    y = d3.scaleLinear()
        .domain([ranges.minY, ranges.maxY]).nice()
        .range([height, 0]);
    if (xName == "stateOfWorks") {
        x = d3.scalePoint()
            .domain(["unknown", "in definitive planning", "in executive planning", "scheduled", "being implemented", "in progress", "being tested", "done"])
            .range([0, width])
            .padding(0.5); //Needed so the points labeled "unknown" don't coincide with the y axis 
    }
    else {
        x = d3.scaleLinear()
            .domain([ranges.minX, ranges.maxX]).nice()
            .range([0, width]);
    }

    xAxis = d3.axisBottom(x);
    yAxis = d3.axisLeft(y);

    var tooltip = d3.select("body")
        .append("div")
        .style("opacity", 1)
        .style("position", "absolute")
        .attr("id", "tooltip_tsne")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "2px")
        .style("visibility", "hidden")
        .style("font-size", "15px")
        .style("z-index", "10")
        .text("");



    // Zoom
    var zoom = d3.zoom()
        .scaleExtent([0.5, 120]) // This control how much you can unzoom (x0.5) and zoom (x120)
        .extent([
            [0, 0],
            [width, height],
        ])
        .on("zoom",
            function (e) {
                if (!brushDragToggle) {
                    handleZoom(e)
                }
            }
        );

    resetZoom(0) //Needed here otherwise if you recreate the scatterplot the zoom is not reset
    //Listener on the reset Zoom Button
    document.getElementById("resetZoomScatter").addEventListener("click", resetZoom)

    scatterplot = d3.select("#scatterplot")
        .call(zoom)
        .append("svg")
        .attr("id", "svgScatterplot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("cursor", "grab")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("overflow", "hidden")

    gx = scatterplot.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
    gy = scatterplot.append("g")
        .call(yAxis)

    scatterplot.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text(xName);
    scatterplot.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(yName);

    scatterplot.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d[1][0][xName]); })
        .attr("cy", function (d) { return y(d[1][0][yName]); })
        .attr("r", 2.5)
        .style("pointer-events", "all")
        .style("cursor", "pointer")
        .attr('stroke', "black")
        .on("click", function (event, d) {
            selectObject(d[0], level)
        })
        .on("mouseenter", function (event, d) {
            focus(d[0], level)
        })
        .on("mouseover", function (event, d) {
            var text = ""
            var obj = dataset[level].get(d[1][0][level])[0]
            if (obj.region) {
                text = text + obj.region
            }
            if (obj.province) {
                text = text + ", " + obj.province
            }
            if (obj.city) {
                text = text + ", " + obj.city
            }
            text = text + "<br>"

            text = text + "Average Download Speed: <b>" + Number(obj.downloadSpeed_mbps).toFixed(2) + "</b> MBps."
            text = text + " Average Upload Speed: <b>" + Number(obj.uploadSpeed_mbps).toFixed(2) + "</b> MBps. <br>"
            text = text + "Average Latency: <b>" + Number(obj.latency_ms).toFixed(2) + "</b> ms."
            text = text + " Total Number of tests: <b>" + (obj.tests) + "</b>. <br>"
            if (obj.stateOfWorks) {
                text = text + "Current State of Works: <b>" + obj.stateOfWorks.charAt(0).toUpperCase() + obj.stateOfWorks.slice(1) + "</b>"
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
    updateScatterPlot()
    document.getElementById("zoomScatter").addEventListener("click", () => {
        document.getElementById("zoomScatter").disabled = true;
        document.getElementById("unzoomScatter").disabled = true;

        d3.select("#scatterplot").transition().duration(200).call(zoom.scaleBy, 1.2).on("end", () => {
            document.getElementById("zoomScatter").disabled = false
            document.getElementById("unzoomScatter").disabled = false

        })
    })
    document.getElementById("unzoomScatter").addEventListener("click", () => {
        document.getElementById("unzoomScatter").disabled = true;
        document.getElementById("zoomScatter").disabled = true;

        d3.select("#scatterplot").transition().duration(200).call(zoom.scaleBy, 0.8).on("end", () => {
            document.getElementById("unzoomScatter").disabled = false;
            document.getElementById("zoomScatter").disabled = false;

        })
    })

    scatterplot
        .attr("width", "100%")
        .attr("height", "100%")
        .on("dblclick.zoom", null);

    d3.select("#scatterplot").style("background-image", "none") //Remove the "Loading" GIF

    //Function handling both the zoom and panning on the scatterplot
    function handleZoom(event) {
        if (event.transform) {
            if (xName != "stateOfWorks") {
                var newX = event.transform.rescaleX(x);
                var newY = event.transform.rescaleY(y);

                //Zoom the circles
                d3.selectAll("circle")
                    .attr('cx', function (d) { return newX(d[1][0][xName]) })
                    .attr('cy', function (d) { return newY(d[1][0][yName]) })
                    .attr('r', Math.max(event.transform.k, 2.5));

                //Update X and Y Axis to match the zoom/pan
                gx.call(d3.axisBottom(newX))
                gy.call(d3.axisLeft(newY))
            }
            else {
                // Get the new scale only on Y
                var newY = event.transform.rescaleY(y);
                //Zoom the circles
                d3.selectAll("circle")
                    .attr('cy', function (d) { return newY(d[1][0][yName]) });
                //Update Y Axis to match the zoom/pan
                gy.call(d3.axisLeft(newY))
            }
            zoomEvent = event
        }
    }
    function resetZoom(time) {
        if (isNaN(time)) {
            var animationTime = 750
        }
        else {
            var animationTime = time
        }
        d3.select("#scatterplot")
            .transition()
            .duration(animationTime)
            .call(zoom.transform, d3.zoomIdentity);
    }

}
function brushed(event, key) { //Selection is the range we're filtering, key is the name of the attribute we're filtering
    if (brushDragToggle) {
        const selection = event.selection

        const filteredObjects = []
        if (!((selection[0][0] == selection[1][0]) && (selection[0][1] == selection[1][1]))) {

            d3.selectAll("circle").each(function (d) {
                if (selection[0][0] <= d3.select(this).attr("cx") && selection[1][0] >= d3.select(this).attr("cx") && // Check X coordinate
                    selection[0][1] <= d3.select(this).attr("cy") && selection[1][1] >= d3.select(this).attr("cy")  // And Y coordinate
                ) {
                    filteredObjects.push(d[0])
                }
            })
        }
        setFilter("scatterPlot", level, filteredObjects)
    }
}
function updateScatterPlot() {
    scatterplot.selectAll("circle")
        .style("opacity", function (d) {
            return checkSelection(d[0], d[1][0], level, 1.0, 0.5, 0.75)
        })
        .attr("fill", function (d) {
            return checkSelection(d[0], d[1][0], level, "#2171b5", "#bdd7e7", "#6baed6")
        }
        )
        .attr('stroke-width', function (d) {
            return checkSelection(d[0], d[1][0], level, "0.75px", "0.2px", "0.5px")
        });
}

function removeScatterplot() {
    d3.select("#svgScatterplot").remove();
    d3.select("#scatterplot").style("background-image", "url(./static/gif/giphy.gif)") //Show the "Loading" GIF

}


function focusScatterplot(objFocus, levelFocus) {
    scatterplot.selectAll("circle").each(function (d) {
        let obj = d[1][0]
        if (obj.city) {
            if (levelFocus == "city" && obj.city == objFocus) {
                return focusThis(this)
            }
            else if (levelFocus == "province") {
                if (obj.province == objFocus) {
                    return focusThis(this)
                }
            }
            else {
                if (obj.region == objFocus) {
                    return focusThis(this)
                }
            }
        }
        else if (obj.province) {
            if (levelFocus == "province") {
                if (obj.province == objFocus) {
                    return focusThis(this)
                }
            }
            else {
                if (obj.region == objFocus) {
                    return focusThis(this)
                }
            }
        }
        else if (obj.region == objFocus) {
            return focusThis(this)
        }
    });
    function focusThis(thisObj) {
        d3.select(thisObj).attr("fill", "red");
        return thisObj.parentNode.appendChild(thisObj);
    }
}
function stopFocusScatterplot() {
    scatterplot.selectAll("circle")
        .attr("fill", function (d) {
            return checkSelection(d[0], d[1][0], level, "#2171b5", "#bdd7e7", "#6baed6")
        });
}


export { focusScatterplot, stopFocusScatterplot, computeScatterplot, removeScatterplot, updateScatterPlot as updateScatterplot };
