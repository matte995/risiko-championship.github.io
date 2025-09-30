import json
import os
from datetime import datetime
import argparse

def argparse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date',  type=str, required=True, help='Date in the format YYYY-MM-DD')
    parser.add_argument('--players', nargs='+', default=["matte, sacha, riky, ale"], help='List of players. Deafult: ["matte, sacha, riky, ale"]')
    parser.add_argument('--points', nargs='+', default=[], help='List of points for each player. The list should respect the order of players. Default: []')
    parser.add_argument('--pos', nargs='+', default=[], help='List of positions for each player. The list should respect the order of players. Default: []')
    parser.add_argument('--points', nargs='+', default=[], help='description for option3')


    return parser


def convert_date(date_str):
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        return date_obj.strftime("%Y-%m-%d")
    except ValueError:
        raise ValueError("Incorrect date format, should be YYYY-MM-DD")
    

def main():
    data_path = "../history.json"
    args = argparse_args()

    date = args.date

    if os.path.exists(data_path):
        with open(data_path, "r") as file:
            data = json.load(file)
    else:
        data = []
        new_entry = {


if name__ == "__main__":
    main()