
/*document.addEventListener("DOMContentLoaded", function () {
  // When a section opens
  $('#accordion').on('shown.bs.collapse', function (e) {
    console.log("Opened:", e.target.id);
  });

  // When a section closes
  $('#accordion').on('hidden.bs.collapse', function (e) {
    console.log("Closed:", e.target.id);
  });
});*/

document.addEventListener("DOMContentLoaded", function () {
  // carica d3
  const script = document.createElement("script");
  
  script.src = "https://d3js.org/d3.v7.min.js";
  document.head.appendChild(script);

  script.onload = function () {
    d3.csv("../../html/storico/hystory.csv").then(function (data) {
      console.log(data);
      const accordion = d3.select("#accordion");

      data.forEach((d, i) => {
        // parsing delle colonne (le liste sono stringhe tipo [a,b,c])
        console.log("Giocatori raw:", d.giocatori);
        const players = JSON.parse(d.giocatori);
        console.log(players);
        const punti = JSON.parse(d.punti_obiettivo).map(Number);
        const piazz = JSON.parse(d.piazzamento).map(Number);
        const obiettivi = JSON.parse(d.obiettivo_completato).map(Number);
        const eliminati = JSON.parse(d.eliminato).map(Number);
        const giocEliminati = JSON.parse(d.giocatori_eliminati).map(Number);

        // crea card
        const card = accordion.append("div").attr("class", "card");

        // header con bottone
        const headerId = `heading${i}`;
        const collapseId = `collapse${i}`;

        const header = card.append("div")
          .attr("class", "card-header")
          .attr("id", headerId);

        header.append("h5")
          .attr("class", "mb-0")
          .append("button")
          .attr("class", "btn btn-link collapsed")
          .attr("data-toggle", "collapse")
          .attr("data-target", `#${collapseId}`)
          .attr("aria-expanded", "false")
          .attr("aria-controls", collapseId)
          .text(d.data);

        // body collapsible
        const collapse = card.append("div")
          .attr("id", collapseId)
          .attr("class", "collapse")
          .attr("aria-labelledby", headerId)
          .attr("data-parent", "#accordion");

        const body = collapse.append("div").attr("class", "card-body");

        // costruisci dati per tabella
        const rows = players.map((p, idx) => ({
          Giocatore: p,
          "Punti Obiettivo": punti[idx],
          Piazzamento: piazz[idx],
          "Obiettivo Completato": obiettivi[idx],
          "Giocatori Eliminati": giocEliminati[idx],
          Eliminato: eliminati[idx]
        }));

        // crea tabella con d3
        const table = body.append("table").attr("class", "table table-striped");
        const thead = table.append("thead");
        const tbody = table.append("tbody");

        // intestazioni
        thead.append("tr")
          .selectAll("th")
          .data(Object.keys(rows[0]))
          .enter()
          .append("th")
          .text(d => d);

        // righe
        const tr = tbody.selectAll("tr")
          .data(rows)
          .enter()
          .append("tr");

        tr.selectAll("td")
          .data(row => Object.values(row))
          .enter()
          .append("td")
          .text(val => val);
      });
    });
  };
});
