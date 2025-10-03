// Funzione per calcolare il bonus piazzamento
function getBonusPiazzamento(piazzamento) {
  switch(piazzamento) {
    case 1: return 10;
    case 2: return 7;
    case 3: return 5;
    case 4: return 3;
    case 5: return 1;
    default: return 0;
  }
}

// Funzione principale per costruire la classifica
function caricaClassifica() {
  fetch('../../hystory.json')
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

          const punteggioFinale = Math.round((A + P + 5 * E + 10 * O + 1 * S) * Math.sqrt(N / 4));

          if (!punteggiGiocatori[player]) {
            punteggiGiocatori[player] = { punteggioTotale: 0, partiteGiocate: 0 };
          }

          punteggiGiocatori[player].punteggioTotale += punteggioFinale;
          punteggiGiocatori[player].partiteGiocate += 1;
        });
      });

      const classificaArray = Object.keys(punteggiGiocatori).map(player => ({
        giocatore: player,
        partiteGiocate: punteggiGiocatori[player].partiteGiocate,
        punteggioTotale: punteggiGiocatori[player].punteggioTotale
      }));

      classificaArray.sort((a, b) => b.punteggioTotale - a.punteggioTotale);

      const tbody = document.getElementById('classifica').querySelector('tbody');

      classificaArray.forEach((giocatore, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${giocatore.giocatore}</td>
          <td>${giocatore.partiteGiocate}</td>
          <td>${giocatore.punteggioTotale}</td>
        `;
        tbody.appendChild(row);
      });

    })
    .catch(err => console.error("Errore nel caricamento del JSON:", err));
}

// Richiama la funzione quando la pagina è pronta
document.addEventListener('DOMContentLoaded', caricaClassifica);
