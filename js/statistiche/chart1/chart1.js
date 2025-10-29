// set the dimensions and margins of the graph
const margin = { top: 10, right: 120, bottom: 30, left: 60 },
    width = 750 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#general_trend")
  .append("svg")
    .attr("width", width + margin.left + margin.right)  // ✅ no quotes
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Read the data
d3.csv("../../../js/statistiche/chart1/general_trend.csv").then(function(data) {

  // ✅ Parse data
  data.forEach(d => {
    d.Data = new Date(d.Data);
    d.Punti_totali = +d.Punti_totali;
  });

  // ✅ Group by player
  const sumstat = d3.group(data, d => d.Giocatore);

  // ✅ Get unique sorted dates for X axis ticks
  const uniqueDates = [...new Set(data.map(d => d.Data))].sort((a, b) => a - b);

  // X axis (only those dates)
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.Data))
    .range([0, width]);

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3.axisBottom(x)
        .tickValues(uniqueDates)      // ✅ show only these dates
        .tickFormat(d3.timeFormat("%Y-%m-%d"))
    )
    .selectAll("text")
      //.attr("transform", "rotate(30)")
      .style("text-anchor", "start");

  // Y axis
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Punti_totali)])
    .range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // ✅ Color palette (function, not array)
  const players = ["Matte", "Sacha", "Riky", "Ale", "Lozzio"];
  const colors = d3.scaleOrdinal()
    .domain(players)
    .range(['#dcf32bff', '#394f60ff', '#6026c4ff', '#9a550cff', '#d3369cff']);

  // Tooltip container
  const tooltip = d3.select("#general_trend")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "black")
    .style("border", "1px solid #292323ff")
    .style("padding", "6px 10px")
    .style("border-radius", "6px")
    .style("opacity", 0)
    .style("pointer-events", "none");

  // Highlight and reset
  const highlight = function (event, el) {
    const selected_player = el.toString();
    const highlight_data = data.filter(d => d.Giocatore === selected_player);
    const max_points = d3.max(highlight_data, d => d.Punti_totali);

    d3.selectAll(".line")
      .style("stroke", "grey")
      .style("opacity", 0.3);

    d3.selectAll(".line-" + selected_player)
      .style("stroke", colors(selected_player))
      .style("opacity", 1)
      .raise(); 

    tooltip.transition().duration(200).style("opacity", 1);
    tooltip.html("<span class='tooltip-text'>" + selected_player + "<br>" + "Punti totali: " + max_points + "<br>" + "</span>")
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
  };

  const doNotHighlight = function () {
    d3.selectAll(".line")
      .style("stroke", d => colors(d[0]))
      .style("opacity", 1);

    tooltip.transition().duration(100).style("opacity", 0);
  };

  // Draw the lines
  svg.selectAll(".line")
    .data(sumstat)
    .join("path")
      .attr("class", d => "line line-" + d[0])
      .attr("fill", "none")
      .attr("stroke", d => colors(d[0]))
      .attr("stroke-width", 2)
      .attr("d", d => d3.line()
        .x(d => x(d.Data))
        .y(d => y(d.Punti_totali))
        (d[1])
      );




  // ✅ Legend
  const size = 14;
  //const players = [...new Set(data.map(d => d.Giocatore))];


  players.forEach(player => {
    svg.selectAll(`.dot-${player}`)
      .data(data)
      .enter()
      .append("circle")
      .attr("class", `dot dot-${player}`)
      .attr("cx", d => x(new Date(d.data)))
      .attr("cy", d => y(+d[player]))  // conversione a numero
      .attr("r", 4)
      .attr("fill", colors(player))
      .style("opacity", 0)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(
          `<strong>${player}</strong><br>${d.data}<br>Punti: ${d[player]}`
        )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");

        d3.select(event.currentTarget)
          .transition().duration(100)
          .attr("r", 7)
          .style("opacity", 1);
      })
      .on("mouseout", (event) => {
        tooltip.transition().duration(400).style("opacity", 0);
        d3.select(event.currentTarget)
          .transition().duration(200)
          .attr("r", 4)
          .style("opacity", 0.8);
      });
  });

  svg.selectAll("myrect")
    .data(players)
    .join("rect")
      .attr("x", width + 20)
      .attr("y", (d, i) => 10 + i * (size + 6))
      .attr("width", size)
      .attr("height", size)
      .style("fill", d => colors(d))
      .on("mouseover", highlight)
      .on("mouseleave", doNotHighlight);

  svg.selectAll("mylabels")
    .data(players)
    .join("text")
      .attr("x", width + 40)
      .attr("y", (d, i) => 10 + i * (size + 6) + size / 2)
      .style("fill", d => colors(d))
      .text(d => d)
      .attr("text-anchor", "start")
      .style("alignment-baseline", "middle")
      .on("mouseover", highlight)
      .on("mouseleave", doNotHighlight);
});
