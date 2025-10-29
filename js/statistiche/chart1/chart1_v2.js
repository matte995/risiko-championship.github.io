// trend_chart.js
const margin = { top: 40, right: 150, bottom: 40, left: 50 },
      width = 700 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

const svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

d3.csv("../../../js/statistiche/chart1/general_trend.csv").then(data => {
  // Parse and clean data
  data.forEach(d => {
    d.Data = new Date(d.Data);
    d.Punti_totali = +d.Punti_totali;
  });

  // Group by player
  const players = Array.from(d3.group(data, d => d.Giocatore), ([key, values]) => ({ Giocatore: key, values }));

  // Scales
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.Data))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Punti_totali) * 1.1])
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(players.map(d => d.Giocatore))
    .range(d3.schemeSet2);

  // Extract the unique game dates
  const gameDates = Array.from(new Set(data.map(d => +d.Data))).map(d => new Date(d));

  // X axis showing only game dates
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .tickValues(gameDates) // use only actual game dates
        .tickFormat(d3.timeFormat("%b %d")) // format as "Oct 28", etc.
    );

  svg.append("g").call(d3.axisLeft(y));

  // Line generator
  const line = d3.line()
    .x(d => x(d.Data))
    .y(d => y(d.Punti_totali));

  // Lines
  svg.selectAll(".line")
    .data(players)
    .join("path")
      .attr("class", d => `line line-${d.Giocatore}`)
      .attr("stroke", d => color(d.Giocatore))
      .attr("fill", "none")
      .attr("d", d => line(d.values));

  // Dots
  players.forEach(p => {
    svg.selectAll(`.dot-${p.Giocatore}`)
      .data(p.values)
      .join("circle")
        .attr("class", `dot dot-${p.Giocatore}`)
        .attr("cx", d => x(d.Data))
        .attr("cy", d => y(d.Punti_totali))
        .attr("r", 4)
        .attr("fill", color(p.Giocatore))
        .on("mouseover", (event, d) => {
          tooltip.style("opacity", 1)
            .html(`<b>${d.Giocatore}</b><br>${d3.timeFormat("%b %d")(d.Data)}<br>${d.Punti_totali} punti`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
          d3.selectAll(".line").style("opacity", 0.2);
          d3.selectAll(".dot").style("opacity", 0.2);
          d3.selectAll(`.line-${d.Giocatore}, .dot-${d.Giocatore}`)
            .style("opacity", 1)
            .attr("r", 5);
        })
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
          d3.selectAll(".line").style("opacity", 0.8);
          d3.selectAll(".dot").style("opacity", 0.9).attr("r", 4);
        });
  });

  // Legend (right side)
  const legend = svg.selectAll(".legend")
    .data(players)
    .join("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(${width + 20}, ${i * 25})`)
      .on("mouseover", (event, d) => {
        d3.selectAll(".line, .dot").style("opacity", 0.1);
        d3.selectAll(`.line-${d.Giocatore}, .dot-${d.Giocatore}`).style("opacity", 1);
      })
      .on("mouseout", () => {
        d3.selectAll(".line").style("opacity", 0.8);
        d3.selectAll(".dot").style("opacity", 0.9);
      });

  legend.append("rect")
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", d => color(d.Giocatore));

  legend.append("text")
    .attr("x", 18)
    .attr("y", 10)
    .text(d => d.Giocatore)
    .style("font-size", "13px");
});
