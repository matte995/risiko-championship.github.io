// Funzione per calcolare il bonus piazzamento
function getBonusPiazzamento(piazzamento) {
  switch (piazzamento) {
    case 1: return 20;
    case 2: return 15;
    case 3: return 10;
    case 4: return 5;
    case 5: return 0;
    default: return 0;
  }
}

// Funzione principale per costruire la classifica
function caricaClassifica() {
  fetch('../../history.json')
    .then(response => response.json())
    .then(data => {
      const punteggiGiocatori = {};

      data.forEach(game => {
        const N = game.giocatori.length;

        game.giocatori.forEach((player, i) => {
          const A = Number(game.punti_obiettivo[i]);
          const P = getBonusPiazzamento(Number(game.piazzamento[i]));
          const E = Number(game.giocatori_eliminati[i]);
          const O = Number(game.obiettivo_completato[i]);
          const S = Number(game.eliminato[i]);

          const punteggioFinale = Math.round((A + P + (5 * E) + (10 * O) + (1 * S)) * (N / 4));

          if (!punteggiGiocatori[player]) {
            punteggiGiocatori[player] = {
              punteggi: [],
              partiteGiocate: 0,
              punteggioTotale: 0
            };
          }

          punteggiGiocatori[player].punteggi.push(punteggioFinale);
          punteggiGiocatori[player].punteggioTotale += punteggioFinale;
          punteggiGiocatori[player].partiteGiocate += 1;
        });
      });

      // Trova il minimo numero di partite giocate da un giocatore
      const minPartite = Math.min(
        ...Object.values(punteggiGiocatori).map(p => p.partiteGiocate)
      );

      console.log("Minimo numero di partite giocate:", minPartite);

      // Calcola il punteggio totale 2 (solo migliori partite)
      Object.values(punteggiGiocatori).forEach(gioc => {
        const migliori = [...gioc.punteggi].sort((a, b) => b - a).slice(0, minPartite);
        console.log("Migliori punteggi per", gioc, ":", migliori);
        gioc.punteggioTotale2 = migliori.reduce((acc, val) => acc + val, 0);
        console.log("Punteggio Totale 2 calcolato:", gioc.punteggioTotale2);
      });



      // Costruisci l’array per la tabella
      const classificaArray = Object.keys(punteggiGiocatori).map(player => ({
        giocatore: player,
        partiteGiocate: punteggiGiocatori[player].partiteGiocate,
        punteggioTotale: punteggiGiocatori[player].punteggioTotale,
        punteggioTotale2: punteggiGiocatori[player].punteggioTotale2
      }));

      // Ordina per punteggio totale 2
      classificaArray.sort((a, b) => b.punteggioTotale2 - a.punteggioTotale2);

      
      // Seleziona tabella e aggiungi intestazione extra
      const table = document.getElementById('classifica');
      const tbody = table.querySelector('tbody');
      /*
      if (!theadRow.querySelector('.col-punteggio2')) {
        const th = document.createElement('th');
        th.classList.add('col-punteggio2');
        th.textContent = 'Punteggio Totale 2';
        theadRow.appendChild(th);
      }
      */
      tbody.innerHTML = ''; // pulizia
      
      classificaArray.forEach((giocatore, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${giocatore.giocatore}</td>
          <td>${giocatore.partiteGiocate}</td>
          <td>${giocatore.punteggioTotale}</td>
          <td>${giocatore.punteggioTotale2}</td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(err => console.error("Errore nel caricamento del JSON:", err));
}

// Richiama la funzione quando la pagina è pronta
document.addEventListener('DOMContentLoaded', caricaClassifica);
