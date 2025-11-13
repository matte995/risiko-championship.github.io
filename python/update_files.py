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
    print("Punteggio calcolato:", punteggioFinale)
    return punteggioFinale 

def aggiorna_classifica(json_path, csv_path):

    with open(json_path, 'r', encoding='utf-8') as f:
        partite = json.load(f)

    partite.sort(key=lambda x: datetime.strptime(x['data'], '%Y-%m-%d'))

    punteggi_cumulativi = {}
    records = []

    for partita in partite:
        data = partita['data']
        for giocatore, punti, piazzamento, obiettivo_compleatato, giocatori_eliminati, eliminato  in zip(partita['giocatori'], partita['punti_obiettivo'], partita['piazzamento'], partita['obiettivo_completato'], partita['giocatori_eliminati'], partita['eliminato']):
            
            punteggio_totale = compute_single_match_points(punti, piazzamento, obiettivo_compleatato, giocatori_eliminati, eliminato,  N=len(partita['giocatori']))
            #print("Punteggio totale:", punteggio_totale)
            # Aggiorna punteggio cumulativo
            punteggi_cumulativi[giocatore] = punteggi_cumulativi.get(giocatore, 0) + int(round(punteggio_totale, 0))
            if giocatore == "Riky":
                print("data: ", data)# Registra record per CSV
                print("punti: ", punti)
                print("piazzamento: ", piazzamento)
                
                print("punti totali: ", punteggio_totale)
                print("punteggio totale arrotondato: ", int(round(punteggio_totale, 0)))
                print("punteggio cumulativo: ", punteggi_cumulativi[giocatore])
            records.append({
                'Data': data,
                'Giocatore': giocatore,
                'Punti_totali': punteggi_cumulativi[giocatore],
                'Punti_obiettivo': punti
            })

    # 5. Scrive il CSV
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['Data', 'Giocatore', 'Punti_totali', 'Punti_obiettivo'])
        writer.writeheader()
        writer.writerows(records)

    print(f"Classifica aggiornata salvata in {csv_path}")
    

def main():
    json_path = "../history.json"
    #args = argparse_args()

    #date = args.date

    '''
    if os.path.exists(data_path):
        with open(data_path, "r") as file:
            data = json.load(file)
    else:
        data = []
        new_entry = {
    '''

    ######################################## UPDATE GENERAL TREND CSV #################################
    general_trend_csv_path = "../js/statistiche/general_trend.csv"
    aggiorna_classifica(json_path, general_trend_csv_path)


if __name__ == "__main__":
    main()