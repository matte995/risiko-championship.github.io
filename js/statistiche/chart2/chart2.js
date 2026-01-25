// objective_points_chart.js
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


    d3.csv("../../../js/statistiche/chart2/objective_points.csv").then(data => {
      // Parsing
      data.forEach(d => {
        d.Campionato = +d.Campionato;
        d.Data = new Date(d.Data);
        d.Punti_obiettivo = +d.Punti_obiettivo;
        d.Scartata = d.Scartata === "True" || d.Scartata === true;
      });

      // Trova i campionati disponibili
      const championships = Array.from(new Set(data.map(d => d.Campionato))).sort((a, b) => a - b);
      const lastChampionship = championships[championships.length - 1];

      // Crea il menu a tendina se non esiste
      let select = d3.select("#campionato-select");
      if (select.empty()) {
        select = d3.select("body").insert("select", "#my_dataviz")
          .attr("id", "campionato-select")
          .style("margin-bottom", "20px");
      }
      select.html("");
      championships.forEach(c => {
        select.append("option")
          .attr("value", c)
          .text(`Campionato ${c}`);
      });
      select.property("value", lastChampionship);

      function buildChart(selectedChampionship) {
        // Filtra i dati per il campionato selezionato
        const filteredData = data.filter(d => d.Campionato == selectedChampionship);

        // Raggruppa per giocatore
        const players = Array.from(d3.group(filteredData, d => d.Giocatore), ([key, values]) => ({ Giocatore: key, values }));
        players.forEach(p => {p.values.sort((a, b) => d3.ascending(a.Data, b.Data));});
        const dates = Array.from(new Set(filteredData.map(d => d.Data))).sort(d3.ascending);

        // Point scale: equal spacing
        const x = d3.scalePoint()
          .domain(dates)
          .range([0, width])
          .padding(0.5);

        const y = d3.scaleLinear()
          .domain([0, d3.max(filteredData, d => d.Punti_obiettivo) * 1.1])
          .range([height, 0]);

        const color = d3.scaleOrdinal()
          .domain(players.map(d => d.Giocatore))
          .range(d3.schemeTableau10);

        // Date uniche (una per partita)
        const gameDates = Array.from(new Set(filteredData.map(d => +d.Data))).sort(d3.ascending).map(d => new Date(d));

        // Svuota il grafico
        svg.selectAll("*").remove();

        // Assi
        svg.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(
            d3.axisBottom(x)
              .tickValues(gameDates)
              .tickFormat(d3.timeFormat("%b %d"))
          );

        svg.append("g").call(d3.axisLeft(y));

        // Line generator
        const line = d3.line()
          .x(d => x(d.Data))
          .y(d => y(d.Punti_obiettivo));

        // Linee
        svg.selectAll(".line")
          .data(players)
          .join("path")
            .attr("class", d => `line line-${d.Giocatore}`)
            .attr("stroke", d => color(d.Giocatore))
            .attr("fill", "none")
            .attr("d", d => line(d.values));

        players.forEach(p => {
          svg.selectAll(`.dot-${p.Giocatore}`)
            .data(p.values)
            .join("circle")
              .attr("class", `dot dot-${p.Giocatore}`)
              .attr("cx", d => x(d.Data))
              .attr("cy", d => y(d.Punti_obiettivo))
              .attr("r", 4)
              .attr("fill", d => d.Scartata ? "black" : color(p.Giocatore))
              .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                  .html(`
                    <b>${d.Giocatore}</b><br>
                    ${d3.timeFormat("%b %d")(d.Data)}<br>
                    ${d.Punti_obiettivo} punti obiettivo<br>
                    ${d.Scartata ? "<em>Scartata</em>" : ""}
                  `)
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

        //compute average points for legend display
        const playerAverages = players.map(p => {
          const validGames = p.values.filter(d => !d.Scartata);
          const totalPoints = d3.mean(validGames, d => d.Punti_obiettivo);
          return { Giocatore: p.Giocatore, Punti_obiettivo: totalPoints ? totalPoints.toFixed(2) : "0.00" };
        });

        // Legenda
        const legend = svg.selectAll(".legend")
          .data(players)
          .join("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(${width + 20}, ${i * 25})`)
            .on("mouseover", (event, d) => {
              tooltip.style("opacity", 1)
              .html(`
                  <strong>${d.Giocatore}</strong><br>
                  Avg punti: ${playerAverages.find(p => p.Giocatore === d.Giocatore).Punti_obiettivo}
                `)
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

        legend.append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", d => color(d.Giocatore));

        legend.append("text")
          .attr("x", 18)
          .attr("y", 10)
          .text(d => d.Giocatore)
          .style("font-size", "13px");
      }

      // Disegna il grafico del campionato corrente all'apertura
      buildChart(lastChampionship);

      // Cambia grafico al cambio selezione
      select.on("change", function() {
        buildChart(this.value);
      });
    });
