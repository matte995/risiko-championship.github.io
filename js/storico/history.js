
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
// history.js
d3.json("../../js/storico/hystory.json").then(data => {
  const accordion = document.getElementById("accordion");

  data.forEach((game, idx) => {
    // ---- Wrapper card ----
    const card = document.createElement("div");
    card.className = "card mb-3";

    // ---- Header con la data ----
    const header = document.createElement("div");
    header.className = "card-header";
    header.style.cursor = "pointer";
    header.setAttribute("data-bs-toggle", "collapse");
    header.setAttribute("data-bs-target", `#collapse${idx}`);
    header.innerHTML = `<h5 class="mb-0">${game.data}</h5>`;

    // ---- Contenuto collassabile ----
    const collapse = document.createElement("div");
    collapse.id = `collapse${idx}`;
    collapse.className = "collapse";
    collapse.setAttribute("data-bs-parent", "#accordion");

    const body = document.createElement("div");
    body.className = "card-body";

    // ---- Tabella dettagli ----
    const table = document.createElement("table");
    table.className = "table table-bordered table-striped";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Giocatore</th>
          <th>Punteggio Obiettivo</th>
          <th>Piazzamento</th>
          <th>Obiettivo Completato</th>
          <th>Giocatori Eliminati</th>
          <th>Eliminato</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    // Popola le righe
    game.giocatori.forEach((player, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${player}</td>
        <td>${game.punti_obiettivo[i]}</td>
        <td>${game.piazzamento[i]}</td>
        <td>${game.obiettivo_completato[i]}</td>
        <td>${game.giocatori_eliminati[i]}</td>
        <td>${game.eliminato[i]}</td>
      `;
      tbody.appendChild(row);
    });

    body.appendChild(table);
    collapse.appendChild(body);

    // monta la card
    card.appendChild(header);
    card.appendChild(collapse);
    accordion.appendChild(card);
  });
});
