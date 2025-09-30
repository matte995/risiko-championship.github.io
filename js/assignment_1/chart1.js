// set the dimensions and margins of the graph
const margin = {top: 20, right: 120, bottom: 80, left: 120},
    width = 700 - margin.left - margin.right,
    height = 420 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#barchart")
    .append("svg")
    .attr('width', '100%')
    .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
    .attr("preserveAspectRatio", "xMinYMin meet")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);


d3.csv("https://raw.githubusercontent.com/IncapacheSpark/IncapacheSpark.github.io/main/python/data/geo_data_chart1.csv").then(function (data, num = 10) {

    // select only the n first rows from the csv
    const topN = data.slice(0, num).reverse()

    // find the max value for X axis viz
    const max = Math.max.apply(Math, topN.map(function (value) {
        return value.count;
    }));

    // X axis
    const x = d3.scaleLinear()
        .domain([0, max])
        .range([0, width]);

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))

    // Add X axis label:
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + 50)
        .text("Aboundance");

    // Add Y axis
    const y = d3.scaleBand()
        .range([0, height])
        .domain(topN.map(d => d.Name))
        .padding(0.2);

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add Y axis label:
    svg.append("text")
        .attr("text-anchor", "start")
        .attr("x", -80)
        .attr("y", -5)
        .text("Tree type")

    // create a tooltip
    const tooltip = d3.select("#barchart")
        .append("div")
        .attr("class", "tooltip")

    // Bars
    svg.selectAll("mybar")
        .data(topN)
        .join("rect")
        .attr("class", d => "myRect " + d.Name.replaceAll(' ', '_'))
        .attr("y", d => y(d.Name))
        .attr("height", y.bandwidth())
        .attr("fill", "#FFCA3A")
        .style("opacity", 0.8)
        // no bar at the beginning thus:
        .attr("width", x(0)) // always equal to 0
        .attr("x", x(0))
        // Three function that change the tooltip
        .on("mouseover", function (event, d) {

            const groupName = d3.select(this)._groups[0][0].className.baseVal.slice(7)

            // Highlight all rects of this subgroup with opacity 1.
            // It is possible to select them since they have a specific class = their name.
            d3.selectAll("." + groupName.replaceAll(' ', '_'))
                .style("opacity", 1)

            tooltip.transition()
                .duration(200)
                .style("opacity", 1);

            tooltip.html("<span class='tooltiptext'>" + "Aboundance: " + d.count + "<br>" + "Average Canopy Cover (m2): " + d.Mean_canopy_size + "</span>")
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {

            const groupName = d3.select(this)._groups[0][0].className.baseVal.slice(7)

            tooltip.transition()
                .duration(200)
                .style("opacity", 0);

            d3.selectAll("." + groupName.replaceAll(' ', '_'))
                .style("opacity", 0.8)
        });

    // Animation
    svg.selectAll("rect")
        .transition()
        .duration(500)
        .attr("x", x(0))
        .attr("width", d => x(d.count))
        .delay((d, i) => {
            return i * 10
        })

})
