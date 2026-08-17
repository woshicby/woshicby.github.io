import os
import json
import time
from config import IMPORTED_FILE


def save_synced_data_file_list(file_names):
    if not file_names:
        return
    imported_dict = {}
    if os.path.exists(IMPORTED_FILE):
        with open(IMPORTED_FILE, encoding="utf-8") as f:
            imported_dict = json.load(f)
    for f in file_names:
        imported_dict[f] = int(time.time())
    with open(IMPORTED_FILE, "w", encoding="utf-8") as f:
        json.dump(imported_dict, f, ensure_ascii=False)


def get_synced_data_file_list():
    imported_dict = {}
    if os.path.exists(IMPORTED_FILE):
        with open(IMPORTED_FILE, encoding="utf-8") as f:
            imported_dict = json.load(f)
    return imported_dict
