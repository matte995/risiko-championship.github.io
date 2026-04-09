// Funzione per calcolare il bonus piazzamento
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

// Funzione per caricare i campionati nel menu a tendina
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

// Modifica la funzione caricaClassifica per accettare un campionato specifico
function caricaClassifica(campionato, criterioOrdine = null) {
  const punteggiGiocatori = {};

  campionato.forEach(game => {
    const N = game.giocatori.length;

    game.giocatori.forEach((player, i) => {
      const A = Number(game.punti_obiettivo[i]);
      const P = getBonusPiazzamento(Number(game.piazzamento[i]));
      const E = Number(game.giocatori_eliminati[i]);
      const O = Number(game.obiettivo_completato[i]);
      const S = Number(game.eliminato[i]);

      const punteggioFinale = Math.round((A + P + (50 * E) + (150 * O) - (50 * S)) * (N / 4));

      if (!punteggiGiocatori[player]) {
        punteggiGiocatori[player] = {
          punteggi: [],
          partiteGiocate: 0,
          punteggioTotale: 0,
          eliminazioniTotale: 0,
          eliminatoTotale: 0
        };
      }

      punteggiGiocatori[player].punteggi.push(punteggioFinale);
      punteggiGiocatori[player].punteggioTotale += punteggioFinale;
      punteggiGiocatori[player].partiteGiocate += 1;
      punteggiGiocatori[player].eliminazioniTotale += E;
      punteggiGiocatori[player].eliminatoTotale += S;
    });
  });

  const minPartite = Math.min(
    ...Object.values(punteggiGiocatori).map(p => p.partiteGiocate)
  );

  Object.values(punteggiGiocatori).forEach(gioc => {
    const migliori = [...gioc.punteggi].sort((a, b) => b - a).slice(0, minPartite);
    gioc.punteggioTotaleNormalizzato = migliori.length > 0
      ? migliori.reduce((acc, val) => acc + val, 0)
      : 0;
  });


  const classificaArray = Object.keys(punteggiGiocatori).map(player => {
    const gioc = punteggiGiocatori[player];
    return {
      giocatore: player,
      partiteGiocate: gioc.partiteGiocate,
      punteggioTotale: gioc.punteggioTotale,
      punteggioTotaleNormalizzato: gioc.punteggioTotaleNormalizzato,
      eliminazioniTotale: gioc.eliminazioniTotale,
      eliminatoTotale: gioc.eliminatoTotale,
      mediaPunti: gioc.partiteGiocate > 0 ? gioc.punteggioTotale / gioc.partiteGiocate : 0,
      mediaPuntiNorm: minPartite > 0 ? gioc.punteggioTotaleNormalizzato / minPartite : 0
    };
  });

  // Ordina in base al criterio
  let criterio = criterioOrdine;
  if (!criterio) {
    // Se non specificato, prendi il valore selezionato
    const select_order = document.getElementById('classifica-order');
    criterio = select_order ? select_order.value : 'totale_norm';
    console.log(`Ordinamento per: ${criterio}`);
  }
  switch (criterio) {
    case 'media':
      classificaArray.sort((a, b) => b.mediaPunti - a.mediaPunti);
      break;
    case 'totale_norm':
    default:
      classificaArray.sort((a, b) => b.punteggioTotaleNormalizzato - a.punteggioTotaleNormalizzato);
      break;
  }

  const table = document.getElementById('classifica');
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = '';

  classificaArray.forEach((giocatore, index) => {
    const row = document.createElement('tr');
    //row.innerHTML = `
    //  <td>${index + 1}</td>
    //  <td>${giocatore.giocatore}</td>
    // <td>${giocatore.partiteGiocate}</td>
    //  <td>${giocatore.eliminazioniTotale}</td>
    //  <td>${giocatore.eliminatoTotale}</td>
    //  <td>${minPartite}</td>
    //  <td>${giocatore.punteggioTotaleNormalizzato}</td>
    //  <td>${giocatore.punteggioTotale}</td>
    //  <td>${giocatore.mediaPuntiNorm.toFixed(2)}</td>
    //  <td>${giocatore.mediaPunti.toFixed(2)}</td>
    //`;
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${giocatore.giocatore}</td>
      <td>${giocatore.partiteGiocate}</td>
      <td>${giocatore.eliminazioniTotale}</td>
      <td>${giocatore.eliminatoTotale}</td>
      <td>${giocatore.punteggioTotaleNormalizzato}</td>
      <td>${giocatore.mediaPunti.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });
}

// Funzione per ordinare la classifica in base al select
function ordinaClassifica() {
  // Prendi il campionato selezionato
  const selectCampionato = document.getElementById('campionato-select');
  const campionatiData = window._campionatiData;
  if (!campionatiData || !selectCampionato) return;
  const selectedIndex = selectCampionato.value;
  const campionato = campionatiData[selectedIndex];
  caricaClassifica(campionato);
}


// Richiama la funzione per caricare i campionati quando la pagina è pronta
document.addEventListener('DOMContentLoaded', () => {
  fetch('../../history.json')
    .then(response => response.json())
    .then(data => {
      window._campionatiData = data;
      const select = document.getElementById('campionato-select');
      select.innerHTML = '';
      data.forEach((campionato, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Campionato ${index + 1}`;
        select.appendChild(option);
      });
      const lastIndex = data.length - 1;
      select.value = lastIndex;
      caricaClassifica(data[lastIndex]);
      select.addEventListener('change', () => {
        const selectedIndex = select.value;
        caricaClassifica(data[selectedIndex]);
      });
      // Listener per il select di ordinamento
      const selectOrdine = document.getElementById('classifica-order');
      if (selectOrdine) {
        selectOrdine.addEventListener('change', () => {
          ordinaClassifica();
        });
      }
    })
    .catch(err => console.error('Errore nel caricamento dei campionati:', err));
});
