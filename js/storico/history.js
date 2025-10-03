
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

function getBonusPiazzamento(pos) {
  switch(pos) {
    case 1: return 10;
    case 2: return 7;
    case 3: return 5;
    case 4: return 3;
    case 5: return 1;
    case 6: return 0;
    default: return 0;
  }
}



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
          <th>Punteggio Finale</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    // ---- Prepariamo i dati ordinati per piazzamento ----
    const playersData = game.giocatori.map((player, i) => {
      const A = Number(game.punti_obiettivo[i]);
      const P = getBonusPiazzamento(Number(game.piazzamento[i])); //Number(game.piazzamento[i]);       // Bonus piazzamento
      const E = Number(game.giocatori_eliminati[i]);
      const O = Number(game.obiettivo_completato[i]);
      const S = Number(game.eliminato[i]);
      const N = game.giocatori.length;

      const punteggioFinale = Math.round((A + P + 5 * E + 10 * O + 1 * S) * Math.sqrt(N / 4));

      return {
        player,
        A,
        P,
        E,
        O,
        S,
        punteggioFinale,
        piazzamento: Number(game.piazzamento[i]),
        obiettivoCompletatoText: O === 1 ? "SI" : "NO",
        eliminatoText: S === 1 ? "SI" : "NO"
      };
    });

    // ---- Ordina per piazzamento crescente ----
    playersData.sort((a, b) => a.piazzamento - b.piazzamento);

    // ---- Popola le righe ----
    playersData.forEach(p => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${p.player}</td>
        <td>${p.A}</td>
        <td>${p.piazzamento}</td>
        <td>${p.obiettivoCompletatoText}</td>
        <td>${p.E}</td>
        <td>${p.eliminatoText}</td>
        <td>${p.punteggioFinale}</td>
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

