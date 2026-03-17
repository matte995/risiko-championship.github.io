import json
import os
from datetime import datetime
import csv


def convert_date(date_str):
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        return date_obj.strftime("%Y-%m-%d")
    except ValueError:
        raise ValueError("Incorrect date format, should be YYYY-MM-DD")
    
BONUS_PIAZZAMENTO = {1: 100,
                     2: 50,
                     3: 25,
                     4: 10,
                     5: 5,
                     6: 0}


def compute_single_match_points(punti, piazzamento, obiettivo_compleatato, giocatori_eliminati, eliminato, N=5):
    punteggioFinale = ((punti + BONUS_PIAZZAMENTO[piazzamento] + (50 * giocatori_eliminati) + (150 * obiettivo_compleatato) - (50 * eliminato)) * (N / 4));
    
    return int(round(punteggioFinale, 0)) 

def aggiorna_classifica(json_path, csv_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        campionati = json.load(f)

    records = []
    punteggi_cumulativi = {}

    for idx_campionato, partite in enumerate(campionati, start=1):
        partite.sort(key=lambda x: datetime.strptime(x['data'], '%Y-%m-%d'))

        # Dizionario per tenere traccia delle partite di ogni giocatore
        player_matches = {}

        # Prima passata: calcola il punteggio di ogni singola partita
        for partita in partite:
            data = partita['data']
            for giocatore, punti, piazzamento, obiettivo_compleatato, giocatori_eliminati, eliminato in zip(
                partita['giocatori'],
                partita['punti_obiettivo'],
                partita['piazzamento'],
                partita['obiettivo_completato'],
                partita['giocatori_eliminati'],
                partita['eliminato']
            ):
                punti_match = compute_single_match_points(
                    punti, piazzamento, obiettivo_compleatato, giocatori_eliminati, eliminato, N=len(partita['giocatori'])
                )

                if giocatore not in player_matches:
                    player_matches[giocatore] = []
                player_matches[giocatore].append({
                    "data": data,
                    "punti_singoli": punti_match
                })

        ### NEW: Normalizzazione del numero di partite ###
        # Trova il numero minimo di partite disputate
        min_partite = min(len(matches) for matches in player_matches.values())

        # Per chi ha giocato di più, elimina i peggiori risultati (punteggi più bassi)
        for giocatore, matches in player_matches.items():

            if len(matches) > min_partite:
                matches.sort(key=lambda x: x["punti_singoli"], reverse=True)
                player_matches[giocatore] = matches[:min_partite]
                player_matches[giocatore].sort(key=lambda x: x["data"])
    
        ### NEW: Ricostruisci punteggi cumulativi uniformati ###
        if idx_campionato not in punteggi_cumulativi:
            punteggi_cumulativi[idx_campionato] = {g: 0 for g in player_matches.keys()}

        tutte_date = sorted(set(m["data"] for matches in player_matches.values() for m in matches), key=lambda d: datetime.strptime(d, "%Y-%m-%d"))
        for data in tutte_date:
            for giocatore, matches in player_matches.items():
                match = next((m for m in matches if m["data"] == data), None)
                if match:
                    punteggi_cumulativi[idx_campionato][giocatore] += match["punti_singoli"]

                    records.append({
                        "Campionato": idx_campionato,
                        "Data": data,
                        "Giocatore": giocatore,
                        "Punti_totali": punteggi_cumulativi[idx_campionato][giocatore],
                    })

    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['Campionato', 'Data', 'Giocatore', 'Punti_totali'])
        writer.writeheader()
        writer.writerows(records)


def update_obiective_points(json_path, objective_points_csv_path, total_points_csv_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        campionati = json.load(f)

    records = []

    for idx_campionato, partite in enumerate(campionati, start=1):
        partite.sort(key=lambda x: datetime.strptime(x['data'], '%Y-%m-%d'))

        player_matches = {}

        for partita in partite:
            data = partita['data']
            for giocatore, punti, piazzamento, obiettivo_compleatato, giocatori_eliminati, eliminato in zip(
                partita['giocatori'],
                partita['punti_obiettivo'],
                partita['piazzamento'],
                partita['obiettivo_completato'],
                partita['giocatori_eliminati'],
                partita['eliminato']
            ):
                if giocatore not in player_matches:
                    player_matches[giocatore] = []
                player_matches[giocatore].append({
                    "data": data,
                    "punti_obiettivo": punti,
                    "punti_totali": compute_single_match_points(punti, piazzamento, obiettivo_compleatato, giocatori_eliminati, eliminato, N=len(partita['giocatori']))                
                })

        min_partite = min(len(matches) for matches in player_matches.values())

        for giocatore, matches in player_matches.items():
            matches.sort(key=lambda x: x["punti_totali"], reverse=True)

            for i, match in enumerate(matches):
                records.append({
                    "Campionato": idx_campionato,
                    "Data": match["data"],
                    "Giocatore": giocatore,
                    "Punti_obiettivo": match["punti_obiettivo"],
                    "Punti_totali": match["punti_totali"],
                    "Scartata": i + 1 > min_partite
                })

    records_sorted = sorted(records, key=lambda r: datetime.strptime(r["Data"], "%Y-%m-%d"))

    # Filtra i record per ogni file in base alle fieldnames
    objective_fields = ['Campionato', 'Data', 'Giocatore', 'Punti_obiettivo', 'Scartata']
    total_fields = ['Campionato', 'Data', 'Giocatore', 'Punti_totali', 'Scartata']

    objective_records = [
        {k: r[k] for k in objective_fields if k in r}
        for r in records_sorted if 'Punti_obiettivo' in r
    ]
    total_records = [
        {k: r[k] for k in total_fields if k in r}
        for r in records_sorted if 'Punti_totali' in r
    ]

    with open(objective_points_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=objective_fields)
        writer.writeheader()
        writer.writerows(objective_records)

    with open(total_points_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=total_fields)
        writer.writeheader()
        writer.writerows(total_records)



def main():
    json_path = "../history.json"

    ######################################## UPDATE GENERAL TREND CSV #################################
    general_trend_csv_path = "../js/statistiche/chart1/general_trend.csv"
    objective_points_csv_path = "../js/statistiche/chart2/objective_points.csv"
    total_points_csv_path = "../js/statistiche/chart3/total_points.csv"
    aggiorna_classifica(json_path, general_trend_csv_path)
    update_obiective_points(json_path, objective_points_csv_path, total_points_csv_path)

if __name__ == "__main__":
    main()