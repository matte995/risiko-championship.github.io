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
    case 1: return 100;
    case 2: return 50;
    case 3: return 25;
    case 4: return 10;
    case 5: return 5;
    case 6: return 0;
    default: return 0;
  }
}

function caricaCampionati() {
  fetch('../../history.json')
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('campionato-select');
      select.innerHTML = ''; // Pulisce il menu

      data.forEach((campionato, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Campionato ${index + 1}`;
        select.appendChild(option);
      });

      // Seleziona di default l'ultimo campionato
      const lastIndex = data.length - 1;
      select.value = lastIndex;
      caricaClassifica(data[lastIndex]);

      // Aggiunge un listener per cambiare campionato
      select.addEventListener('change', () => {
        const selectedIndex = select.value;
        caricaClassifica(data[selectedIndex]);
      });
    })
    .catch(err => console.error('Errore nel caricamento dei campionati:', err));
}

// Modifica la funzione caricaCampionati per caricare automaticamente i dati del campionato corrente

  // Funzione per popolare l'accordion solo con le partite del campionato selezionato
  function mostraPartiteCampionato(partite) {
    const accordion = document.getElementById("accordion");
    accordion.innerHTML = "";

    partite.forEach((game, idx) => {
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
      body.className = "card-body table-responsive";

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
        const P = getBonusPiazzamento(Number(game.piazzamento[i]));        // Bonus piazzamento
        const E = Number(game.giocatori_eliminati[i]);
        const O = Number(game.obiettivo_completato[i]);
        const S = Number(game.eliminato[i]);
        const N = game.giocatori.length;

        const punteggioFinale = Math.round((A + P + (50 * E) + (150 * O) - (50 * S)) * (N / 4));
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
  }


  // Carica i campionati e collega il menu a mostraPartiteCampionato
  function caricaStoricoCampionati() {
    fetch('../../history.json')
      .then(response => response.json())
      .then(data => {
        const select = document.getElementById('campionato-select');
        if (!select) return;
        select.innerHTML = '';
        data.forEach((campionato, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = `Campionato ${index + 1}`;
          select.appendChild(option);
        });
        // Mostra di default l'ultimo campionato
        const lastIndex = data.length - 1;
        select.value = lastIndex;
        mostraPartiteCampionato(data[lastIndex]);
        // Cambia campionato al cambio selezione
        select.addEventListener('change', () => {
          mostraPartiteCampionato(data[select.value]);
        });
      })
      .catch(err => console.error('Errore nel caricamento dei campionati:', err));
  }

  document.addEventListener('DOMContentLoaded', caricaStoricoCampionati);

d3.json("../../history.json").then(data => {
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
    body.className = "card-body table-responsive";

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
      const P = getBonusPiazzamento(Number(game.piazzamento[i]));        // Bonus piazzamento
      const E = Number(game.giocatori_eliminati[i]);
      const O = Number(game.obiettivo_completato[i]);
      const S = Number(game.eliminato[i]);
      const N = game.giocatori.length;

      const punteggioFinale = Math.round((A + P + (50 * E) + (150 * O) - (50 * S)) * (N / 4));
      


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


// Richiama la funzione per caricare i campionati quando la pagina è pronta
//document.addEventListener('DOMContentLoaded', caricaCampionati);
// Richiama la funzione per caricare il campionato corrente quando la pagina è pronta
document.addEventListener('DOMContentLoaded', caricaCampionatoCorrente);

