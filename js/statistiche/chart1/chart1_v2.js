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

  // Determine the default championship based on the latest date
  const latestDate = d3.max(data, d => d.Data);
  const defaultChampionship = d3.max(data.filter(d => d.Data.getTime() === latestDate.getTime()), d => d.Campionato);

  // Populate the dropdown menu with available championships
  const championships = Array.from(new Set(data.map(d => d.Campionato))).sort((a, b) => b - a);
  const select = d3.select("#campionato-select");

  championships.forEach(c => {
    select.append("option")
      .attr("value", c)
      .text(`Campionato ${c}`);
  });

  // Set default championship in the dropdown
  select.property("value", defaultChampionship);

  // Function to filter data and build the chart
  function buildChart(selectedChampionship) {
    const filteredData = data.filter(d => d.Campionato == selectedChampionship);

    // Group by player
    const players = Array.from(d3.group(filteredData, d => d.Giocatore), ([key, values]) => ({ Giocatore: key, values }));
    const dates = Array.from(new Set(filteredData.map(d => d.Data))).sort(d3.ascending);

    // Point scale: equal spacing
    const x = d3.scalePoint()
      .domain(dates)
      .range([0, width])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.Punti_totali) * 1.1])
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(players.map(d => d.Giocatore))
      .range(d3.schemePaired);

    // Clear previous chart elements
    svg.selectAll("*").remove();

    // X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(dates).tickFormat(d3.timeFormat("%b %d")));

    // Y axis
    svg.append("g")
      .call(d3.axisLeft(y));

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

    const latestByPlayer = players.map(p => {
    const last = p.values.reduce((a, b) => (a.Data > b.Data ? a : b));
    return { Giocatore: p.Giocatore, ...last };
  });

    // Ordina per punti decrescenti e assegna la posizione
    const ranking = latestByPlayer
      .sort((a, b) => d3.descending(a.Punti_totali, b.Punti_totali))
      .map((d, i) => ({
        Giocatore: d.Giocatore,
        Posizione: i + 1,
        Punti_totali: d.Punti_totali
    }));

    const playerInfo = new Map(ranking.map(d => [d.Giocatore, d]));

    // Add interactive legend
    const legendTooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(63, 83, 197, 0.9)")
      .style("color", "white")
      .style("padding", "6px 10px")
      .style("border-radius", "6px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    const legend = svg.selectAll(".legend")
      .data(players)
      .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(${width + 20}, ${i * 25})`)
        .on("mouseover", (event, d) => {
          d3.selectAll(".line, .dot").style("opacity", 0.1);
          d3.selectAll(`.line-${d.Giocatore}, .dot-${d.Giocatore}`).style("opacity", 1);

          const info = playerInfo.get(d.Giocatore);

          if (info) {
            legendTooltip.transition().duration(200).style("opacity", 1);
            legendTooltip.html(`
                <strong>${d.Giocatore}</strong><br>
                Posizione: #${info.Posizione}<br>
                Punti totali: ${info.Punti_totali}<br>
              `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
          }
        })
        .on("mousemove", (event) => {
          legendTooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
          d3.selectAll(".line").style("opacity", 0.8);
          d3.selectAll(".dot").style("opacity", 0.9);
          legendTooltip.transition().duration(200).style("opacity", 0);
        });

    // Legend rectangles
    legend.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", d => color(d.Giocatore));

    // Legend text
    legend.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .text(d => d.Giocatore)
      .style("font-size", "13px");
  }

  // Initial chart rendering
  buildChart(defaultChampionship);

  // Update chart on dropdown change
  select.on("change", function() {
    const selectedChampionship = this.value;
    buildChart(selectedChampionship);
  });
});



