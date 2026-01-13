// ===============================
// BONUS PIAZZAMENTO
// ===============================
function getBonusPiazzamento(piazzamento) {
    switch (piazzamento) {
        case 1: return 100;
        case 2: return 50;
        case 3: return 25;
        case 4: return 10;
        case 5: return 5;
        case 6: return 0;
        default: return 0;
    }
}

// ===============================
// PUNTEGGIO SINGOLA PARTITA
// ===============================
function calcolaPunteggioPartita(game, N, i) {
    const A = Number(game.punti_obiettivo[i]);
    const P = getBonusPiazzamento(Number(game.piazzamento[i]));
    const E = Number(game.giocatori_eliminati[i]);
    const O = Number(game.obiettivo_completato[i]);
    const S = Number(game.eliminato[i]);

    // FORMULA FINALE
    return Math.round((A + P + (50 * E) + (150 * O) - (50 * S)) * (N / 4));
}

// ===============================
// CARICAMENTO E CREAZIONE TABELLA
// ===============================
function caricaClassificaPosizione() {
    fetch('../../history.json')
        .then(response => response.json())
        .then(data => {

            const partitePerGiocatore = {};

            // 1. Raccoglie tutte le partite
            data.forEach(game => {
                const N = game.giocatori.length;
                game.giocatori.forEach((player, i) => {

                    if (!partitePerGiocatore[player]) {
                        partitePerGiocatore[player] = [];
                    }

                    partitePerGiocatore[player].push({
                        punteggio: calcolaPunteggioPartita(game, N, i),
                        piazzamento: Number(game.piazzamento[i])
                    });
                });
            });

            // 2. Numero minimo di partite giocate
            const minPartite = Math.min(
                ...Object.values(partitePerGiocatore).map(p => p.length)
            );

            //console.log('Partite considerate per tutti:', minPartite);

            // 3. Scarta peggiori partite e conta posizioni
            const posizioniGiocatori = {};

            Object.entries(partitePerGiocatore).forEach(([player, partite]) => {

                // Ordina per punteggio (migliori prima)
                const migliori = partite
                    .slice()
                    .sort((a, b) => b.punteggio - a.punteggio)
                    .slice(0, minPartite);

                posizioniGiocatori[player] = {
                    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
                };

                migliori.forEach(p => {
                    if (p.piazzamento >= 1 && p.piazzamento <= 6) {
                        posizioniGiocatori[player][p.piazzamento]++;
                    }
                });
            });

            // 4. Riempimento tabella HTML
            const tbody = document.querySelector('#classifica_posizione tbody');
            tbody.innerHTML = '';

            Object.entries(posizioniGiocatori).forEach(([player, posizioni]) => {
                const tr = document.createElement('tr');

                const tdNome = document.createElement('td');
                tdNome.textContent = player;
                tr.appendChild(tdNome);

                for (let p = 1; p <= 6; p++) {
                    const td = document.createElement('td');
                    td.textContent = posizioni[p];
                    tr.appendChild(td);
                }

                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error('Errore caricamento classifica:', err));
}

// ===============================
// AVVIO
// ===============================
document.addEventListener('DOMContentLoaded', caricaClassificaPosizione);
