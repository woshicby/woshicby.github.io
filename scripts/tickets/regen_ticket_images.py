# -*- coding: utf-8 -*-
"""重新生成票据收藏图片索引（双版本机制, 2026-10-13）。

输出（格式: BOM + 2 空格缩进 + LF + 结尾换行, 与既有发布版字节级 round-trip 一致）:
  JSON/ticket-images.json          发布版(进 git): 只索引图片已全部上传(git ls-files)的 key
  JSON/ticket-images.local.json    本地版(gitignored): 索引本地磁盘存在图片的全部 key(含未上传/隐私图)

用法（images/tickets/ 增删图片、或图片上传 commit 后运行, 再与图片同批提交发布版）:
    python3 scripts/tickets/regen_ticket_images.py

key 规则（必须与前端 JS/pages/tickets.js、reviews.js 一致）:
  前端按卡片(tickets.json)的 key = date8_title 查索引, 所以:
  - 标准: 目录名 == key（images/tickets/<key>/）→ 自动扫描
  - 非标准: 目录名 ≠ key（缩写/店名等）→ 映射来自
      a. 发布版既有条目（自保持, 如 20260906_超市购物→20260906_家佳源购物/）
      b. JSON/ticket-image-dirs.local.json（本地专用映射, gitignored,
         用于永不上传的隐私图, 如 20250909_哈工大宿舍费（2025-2026学年）→20250909_哈工大宿舍费/）

铁律: 发布版不得含任何引用未上传图片的 key（远端死链 404）——脚本按
"该 key 的全部图片路径都在 git ls-files 中"过滤, 机械保证。
"""
import json, os, subprocess, sys
from collections import OrderedDict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
IMG_DIR = os.path.join(ROOT, 'images', 'tickets')
TICKETS_JSON = os.path.join(ROOT, 'JSON', 'tickets.json')
OUT_PUBLIC = os.path.join(ROOT, 'JSON', 'ticket-images.json')
OUT_LOCAL = os.path.join(ROOT, 'JSON', 'ticket-images.local.json')
OUT_DIRS = os.path.join(ROOT, 'JSON', 'ticket-image-dirs.local.json')
IMG_EXTS = ('.jpg', '.jpeg', '.png')

warns = []


def rel(p):
    """绝对路径 → 仓库相对 posix 路径"""
    return os.path.relpath(p, ROOT).replace(os.sep, '/')


def load_ordered(path):
    if not os.path.exists(path):
        return OrderedDict()
    with open(path, encoding='utf-8-sig') as f:
        return json.load(f, object_pairs_hook=OrderedDict)


def card_key(c):
    d8 = (c.get('date') or '')[:10].replace('-', '')
    return f"{d8}_{c.get('title') or ''}"


def scan(dir_name):
    """扫描 images/tickets/<dir_name>/ 下图片（排序）, 返回相对路径列表"""
    d = os.path.join(IMG_DIR, dir_name)
    if not os.path.isdir(d):
        return []
    files = sorted(fn for fn in os.listdir(d)
                   if fn.lower().endswith(IMG_EXTS) and not fn.startswith('.'))
    return [f'images/tickets/{dir_name}/{fn}' for fn in files]


def tracked_files():
    # -z: NUL 分隔且不加引号/转义(core.quotePath 默认会把 CJK 路径八进制转义, 导致全部匹配落空)
    out = subprocess.run(['git', '-c', 'core.quotePath=false', 'ls-files', '-z', 'images/tickets/'],
                         cwd=ROOT, capture_output=True, text=True)
    if out.returncode != 0:
        print('[ERROR] git ls-files 失败:', out.stderr[:300])
        sys.exit(1)
    return set(p for p in out.stdout.split('\0') if p)


def write_json(path, mapping):
    """BOM + 2 空格缩进 + LF + 结尾换行（与既有发布版字节级一致）"""
    data = json.dumps(mapping, ensure_ascii=False, indent=2) + '\n'
    with open(path, 'wb') as f:
        f.write(b'\xef\xbb\xbf' + data.encode('utf-8'))


def main():
    if not os.path.isdir(IMG_DIR):
        print(f'[ERROR] 图片目录不存在: {IMG_DIR}')
        sys.exit(1)

    with open(TICKETS_JSON, encoding='utf-8-sig') as f:
        cards = json.load(f)
    card_keys = {card_key(c) for c in cards}

    pub_existing = load_ordered(OUT_PUBLIC)   # 发布版既有条目（含非标准映射, 自保持）
    loc_existing = load_ordered(OUT_LOCAL)    # 本地版既有条目（自保持）
    dir_map = load_ordered(OUT_DIRS) or {}    # 本地专用映射: key → 目录名

    tracked = tracked_files()
    all_dirs = {d for d in os.listdir(IMG_DIR)
                if os.path.isdir(os.path.join(IMG_DIR, d)) and not d.startswith('.')}

    local = OrderedDict()

    def put(key, paths):
        """合入条目: 保持既有顺序, 新路径按出现序追加, 去重"""
        paths = [p for p in paths if p]
        if not paths:
            return
        cur = local.get(key)
        if cur is None:
            local[key] = list(dict.fromkeys(paths))
        else:
            extra = [p for p in paths if p not in cur]
            if extra:
                cur.extend(extra)

    # 1) 发布版既有条目（非标准映射的权威来源, 如 20260906_超市购物→家佳源购物/）
    for k, v in pub_existing.items():
        if k not in card_keys:
            warns.append(f'发布版 key 无对应卡片, 已剔除: {k}')
            continue
        on_disk = [p for p in v if os.path.isfile(os.path.join(ROOT, p))]
        if len(on_disk) != len(v):
            warns.append(f'{k}: {len(v) - len(on_disk)} 张图片磁盘缺失, 已过滤')
        put(k, on_disk)

    # 2) 本地版既有条目（自保持, 覆盖发布版没有的本地专用条目）
    for k, v in loc_existing.items():
        if k not in card_keys:
            warns.append(f'本地版 key 无对应卡片, 已剔除: {k}')
            continue
        on_disk = [p for p in v if os.path.isfile(os.path.join(ROOT, p))]
        if len(on_disk) != len(v):
            warns.append(f'{k}(本地版): {len(v) - len(on_disk)} 张图片磁盘缺失, 已过滤')
        put(k, on_disk)

    # 3) 本地专用映射文件（永不上传的隐私图等, key → 非标准目录名）
    for k, d in dir_map.items():
        if k not in card_keys:
            warns.append(f'本地映射文件 key 无对应卡片, 已跳过: {k}')
            continue
        files = scan(d)
        if not files:
            warns.append(f'本地映射文件目录无图片: {d}')
        put(k, files)

    # 4) 标准目录自动扫描（目录名 == key, 尚未覆盖的卡片）
    warned_empty = set()
    for k in sorted(card_keys - set(local.keys())):
        d = os.path.join(IMG_DIR, k)
        if not os.path.isdir(d):
            continue
        files = scan(k)
        if files:
            put(k, files)
        else:
            warned_empty.add(k)
            warns.append(f'空目录(无图片, 不索引): {k}')

    # 5) 未认领目录检查（正常应为 0: 要么标准扫描、要么已被条目/映射认领）
    #    注意: 必须在第 4 步之后计算, 否则标准扫描新增的目录会被误报
    claimed = {os.path.basename(os.path.dirname(p)) for v in local.values() for p in v}
    for d in sorted(all_dirs - claimed):
        n = len(scan(d))
        if n:
            warns.append(f'未认领目录(无卡片映射, 未索引): {d} ({n} 张)')
        elif d not in warned_empty:
            warns.append(f'空目录: {d}')

    # 6) 发布版 = 图片全部已上传的 key（铁律: 不得引用未上传图片）
    pub = OrderedDict((k, v) for k, v in local.items() if all(p in tracked for p in v))
    dropped = [k for k in local if k not in pub]

    write_json(OUT_PUBLIC, pub)
    write_json(OUT_LOCAL, local)

    n_pub_imgs = sum(len(v) for v in pub.values())
    n_loc_imgs = sum(len(v) for v in local.values())
    print(f'卡片 {len(cards)} 条 | 本地版 {len(local)} keys / {n_loc_imgs} 张 | '
          f'发布版 {len(pub)} keys / {n_pub_imgs} 张')
    for k in dropped:
        print(f'  未入发布版(图片未全部上传): {k}')
    for w in warns:
        print(f'  [警告] {w}')
    if warns:
        print(f'共 {len(warns)} 条警告')
    print(f'已写入 {OUT_PUBLIC}')
    print(f'已写入 {OUT_LOCAL}')


if __name__ == '__main__':
    main()
