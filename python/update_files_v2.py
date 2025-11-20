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
    
BONUS_PIAZZAMENTO = {1: 20,
                     2: 15,
                     3: 10,
                     4: 5,
                     5: 0}


def compute_single_match_points(punti, piazzamento, obiettivo_compleatato, giocatori_eliminati, eliminato, N=5):
    punteggioFinale = ((punti + BONUS_PIAZZAMENTO[piazzamento] + (5 * giocatori_eliminati) + (10 * obiettivo_compleatato) - (5 * eliminato)) * (N / 4));
    #print("Punteggio calcolato:", punteggioFinale)
    return int(round(punteggioFinale, 0)) 

def aggiorna_classifica(json_path, csv_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        partite = json.load(f)

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
    print(f"Numero minimo di partite disputate: {min_partite}")

    # Per chi ha giocato di più, elimina i peggiori risultati (punteggi più bassi)
    for giocatore, matches in player_matches.items():

        if len(matches) > min_partite:
            
            # Ordina per punteggio crescente → scarta i peggiori
            matches.sort(key=lambda x: x["punti_singoli"], reverse=True)
            player_matches[giocatore] = matches[:min_partite]
            # Riordina per data per ricostruire il trend temporale
            player_matches[giocatore].sort(key=lambda x: x["data"])
            #print("Giocatore:", giocatore)
            #print("partite scartate:",  matches[min_partite:])
    ### NEW: Ricostruisci punteggi cumulativi uniformati ###
    records = []
    punteggi_cumulativi = {g: 0 for g in player_matches.keys()}

    # Per ogni data (globale) in ordine cronologico
    tutte_date = sorted(set(m["data"] for matches in player_matches.values() for m in matches), key=lambda d: datetime.strptime(d, "%Y-%m-%d"))
    #print("Tutte le date:", tutte_date)
    for data in tutte_date:
        for giocatore, matches in player_matches.items():
            # Trova la partita di quella data, se esiste
            match = next((m for m in matches if m["data"] == data), None)
            if match:
                punteggi_cumulativi[giocatore] += match["punti_singoli"]

                records.append({
                    "Data": data,
                    "Giocatore": giocatore,
                    "Punti_totali": punteggi_cumulativi[giocatore],
                })

    # Scrivi il CSV aggiornato
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['Data', 'Giocatore', 'Punti_totali'])
        writer.writeheader()
        writer.writerows(records)

    print(f"Classifica equalizzata salvata in {csv_path}")


def update_obiective_points(json_path, csv_path):

    with open(json_path, 'r', encoding='utf-8') as f:
        partite = json.load(f)

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
            if giocatore not in player_matches:
                player_matches[giocatore] = []
            player_matches[giocatore].append({
                "data": data,
                "punti_singoli": punti
            })

    min_partite = min(len(matches) for matches in player_matches.values())
    print(f"Numero minimo di partite disputate: {min_partite}")

    records = []
    
    # segna peggiori risultati (punteggi più bassi)
    for giocatore, matches in player_matches.items():
        # Ordina per punteggio crescente → scarta i peggiori
        matches.sort(key=lambda x: x["punti_singoli"], reverse=True)
        print("Giocatore:", giocatore)
        print("punti partite:", [m["punti_singoli"] for m in matches])

        for i, match in enumerate(matches):
            if i+1 <= min_partite:
                records.append({
                    "Data": match["data"],
                    "Giocatore": giocatore,
                    "Punti_obiettivo": match["punti_singoli"],
                    "Scartata": False
                })
            else:
                records.append({
                    "Data": match["data"],
                    "Giocatore": giocatore,
                    "Punti_obiettivo": match["punti_singoli"],
                    "Scartata": True
                })

    records_sorted = sorted(records, key=lambda r: datetime.strptime(r["Data"], "%Y-%m-%d"))


    # Scrivi il CSV aggiornato
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['Data', 'Giocatore', 'Punti_obiettivo', 'Scartata'])
        writer.writeheader()
        writer.writerows(records)

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