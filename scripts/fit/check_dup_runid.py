import os, sys
from garmin_fit_sdk import Decoder, Stream
from garmin_fit_sdk.util import FIT_EPOCH_S
import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

fit_dir = os.path.join(PROJECT_ROOT, "FIT")
files = sorted([f for f in os.listdir(fit_dir) if f.endswith('.fit')])

run_ids = {}
dup_run_ids = {}
for i, f in enumerate(files):
    if (i+1) % 500 == 0:
        print(f'  进度: {i+1}/{len(files)}')
    fp = os.path.join(fit_dir, f)
    stream = Stream.from_file(fp)
    decoder = Decoder(stream)
    msgs, errs = decoder.read(convert_datetimes_to_dates=False)
    if not msgs.get('session_mesgs'):
        print(f'无session: {f}')
        continue
    s = msgs['session_mesgs'][0]
    start_ts = s['start_time'] + FIT_EPOCH_S
    run_id = int(start_ts * 1000)
    if run_id in run_ids:
        if run_id not in dup_run_ids:
            dup_run_ids[run_id] = [run_ids[run_id]]
        dup_run_ids[run_id].append(f)
    else:
        run_ids[run_id] = f

print(f'文件数: {len(files)}')
print(f'唯一run_id数: {len(run_ids)}')
print(f'重复run_id组数: {len(dup_run_ids)}')
if dup_run_ids:
    print(f'\n重复的run_id:')
    for rid, fnames in dup_run_ids.items():
        dt = datetime.datetime.fromtimestamp(rid/1000, tz=datetime.timezone.utc).astimezone(datetime.timezone(datetime.timedelta(hours=8)))
        print(f'  run_id={rid} ({dt}):')
        for fn in fnames:
            print(f'    {fn}')
