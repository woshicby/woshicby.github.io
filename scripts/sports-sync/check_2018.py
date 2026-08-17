"""Check which offset activities are indoor-replaced vs polyline precision"""
import json
import os
import sys
import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from garmin_fit_sdk import Decoder, Stream
from garmin_fit_sdk.util import FIT_EPOCH_S
from config import FIT_FOLDER, SQL_FILE, SEMICIRCLE, COORD_OFFSET_THRESHOLD, METERS_PER_DEGREE_LAT
from db import init_db, Activity
from gpxtrackposter.track import SEMICIRCLE as TRACK_SEMICIRCLE, FIT_EPOCH_S as TRACK_FIT_EPOCH_S
import polyline as pl

# Build FIT index
print("Building FIT file index...")
fit_index = {}
fit_files = [f for f in os.listdir(FIT_FOLDER) if f.endswith('.fit')]
for i, fit_file in enumerate(fit_files):
    fit_path = os.path.join(FIT_FOLDER, fit_file)
    try:
        stream = Stream.from_file(fit_path)
        decoder = Decoder(stream)
        messages, errors = decoder.read(convert_datetimes_to_dates=False)
        if errors or not messages.get("session_mesgs"):
            continue
        session_msg = messages["session_mesgs"][0]
        start_ts = session_msg["start_time"] + FIT_EPOCH_S
        fit_index[start_ts] = (fit_file, messages)
    except:
        continue
print(f"Indexed {len(fit_index)} FIT files")

session = init_db(SQL_FILE)
activities_2018 = session.query(Activity).filter(
    Activity.start_date_local.like('2018%')
).order_by(Activity.start_date_local).all()

print("\n=== Large offset analysis ===\n")

for act in activities_2018:
    poly = act.summary_polyline or ''
    if not poly:
        continue
    try:
        db_coords = pl.decode(poly)
    except:
        continue
    if len(db_coords) < 2:
        continue

    start_ts = act.run_id // 1000
    matched = None
    for offset in range(-2, 3):
        if start_ts + offset in fit_index:
            matched = fit_index[start_ts + offset]
            break
    if not matched:
        continue

    fit_file, messages = matched
    record_mesgs = messages.get("record_mesgs", [])
    fit_coords = []
    for record in record_mesgs:
        if "position_lat" in record and "position_long" in record:
            lat = record["position_lat"] / SEMICIRCLE
            lng = record["position_long"] / SEMICIRCLE
            fit_coords.append((lat, lng))

    if not fit_coords:
        # No GPS in FIT file - this activity was likely replaced by _fix_indoor_locations
        print(f"NO GPS IN FIT: {act.start_date_local} | {fit_file}")
        print(f"  DB has polyline with {len(db_coords)} points")
        print(f"  DB subtype: {act.subtype}")
        print(f"  DB first: ({db_coords[0][0]:.6f}, {db_coords[0][1]:.6f})")
        print()
        continue

    # Check for large offset
    db_first = db_coords[0]
    db_last = db_coords[-1]
    fit_first = fit_coords[0]
    fit_last = fit_coords[-1]

    max_diff = max(
        abs(db_first[0] - fit_first[0]), abs(db_first[1] - fit_first[1]),
        abs(db_last[0] - fit_last[0]), abs(db_last[1] - fit_last[1])
    )

    if max_diff > COORD_OFFSET_THRESHOLD:  # > ~500m offset
        print(f"LARGE OFFSET: {act.start_date_local} | {fit_file}")
        print(f"  FIT first: ({fit_first[0]:.6f}, {fit_first[1]:.6f}) | DB first: ({db_first[0]:.6f}, {db_first[1]:.6f})")
        print(f"  FIT last:  ({fit_last[0]:.6f}, {fit_last[1]:.6f}) | DB last:  ({db_last[0]:.6f}, {db_last[1]:.6f})")
        print(f"  FIT points: {len(fit_coords)}, DB points: {len(db_coords)}")
        print(f"  DB subtype: {act.subtype}")
        # Check if FIT has GPS spread suggesting indoor
        lats = [c[0] for c in fit_coords]
        lngs = [c[1] for c in fit_coords]
        spread = max(max(lats) - min(lats), max(lngs) - min(lngs))
        print(f"  FIT GPS spread: {spread:.6f} deg ({spread*METERS_PER_DEGREE_LAT:.0f}m)")
        print()

session.close()
