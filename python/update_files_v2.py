import json
import os
from datetime import datetime
import argparse
import csv

'''
def argparse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date',  type=str, required=True, help='Date in the format YYYY-MM-DD')
    parser.add_argument('--players', nargs='+', default=["matte, sacha, riky, ale"], help='List of players. Deafult: ["matte, sacha, riky, ale"]')
    parser.add_argument('--points', nargs='+', default=[], help='List of points for each player. The list should respect the order of players. Default: []')
    parser.add_argument('--pos', nargs='+', default=[], help='List of positions for each player. The list should respect the order of players. Default: []')
    parser.add_argument('--points', nargs='+', default=[], help='description for option3')


    return parser
'''

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
    #print("Punteggio calcolato:", punteggioFinale)
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

            print("giocatore:", giocatore, "ha giocato", len(matches), "partite; minimo è", min_partite)
            if len(matches) > min_partite:
                matches.sort(key=lambda x: x["punti_singoli"], reverse=True)
                #print("matches ordinati per punti_singoli:", matches)
                player_matches[giocatore] = matches[:min_partite]
                #print("matches dopo scarto peggiori:", player_matches[giocatore])
                player_matches[giocatore].sort(key=lambda x: x["data"])
                #print("partite scartate: ", matches[min_partite:])
                #print("matches riordinati per data:", player_matches[giocatore])
               # print("\n")

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

    print(f"Classifica equalizzata salvata in {csv_path}")

def update_obiective_points(json_path, csv_path):
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
                    "Scartata": i + 1 > min_partite
                })

    records_sorted = sorted(records, key=lambda r: datetime.strptime(r["Data"], "%Y-%m-%d"))

    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['Campionato', 'Data', 'Giocatore', 'Punti_obiettivo', 'Scartata'])
        writer.writeheader()
        writer.writerows(records_sorted)

    print(f"Classifica obiettivo salvata in {csv_path}")
    

def main():
    json_path = "../history.json"

    ######################################## UPDATE GENERAL TREND CSV #################################
    general_trend_csv_path = "../js/statistiche/chart1/general_trend.csv"
    objective_points_csv_path = "../js/statistiche/chart2/objective_points.csv"
    aggiorna_classifica(json_path, general_trend_csv_path)
    update_obiective_points(json_path, objective_points_csv_path)

if __name__ == "__main__":
    main()