#!/usr/bin/env bash
# scripts 统一运行入口
# 用法: ./run.sh <脚本路径> [参数...]
# 例如: ./run.sh sports-sync/sync_all.py --full
#        ./run.sh preview_server.py 8642
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON="$SCRIPT_DIR/.venv/bin/python"

if [ ! -x "$PYTHON" ]; then
    echo "❌ 未找到统一虚拟环境: $SCRIPT_DIR/.venv"
    echo "   请先创建: $SCRIPT_DIR/.venv/bin/python -m venv $SCRIPT_DIR/.venv"
    echo "   再装依赖: $SCRIPT_DIR/.venv/bin/python -m pip install -r $SCRIPT_DIR/requirements.txt"
    exit 1
fi

if [ $# -lt 1 ]; then
    echo "用法: $0 <脚本路径> [参数...]"
    echo ""
    echo "可用脚本:"
    echo "  sports-sync/sync_all.py       运动数据同步"
    echo "  sports-sync/fix_location.py   位置信息升级"
    echo "  fit/check_dup_runid.py        FIT 查重"
    echo "  fit/json_to_fit.py            JSON 转 FIT"
    echo "  fit/merge_fit_dup.py          合并重复 FIT"
    echo "  fit/merge_keep_fit.py         保留合并 FIT"
    echo "  tickets/_merge_ticket.py      票据合并"
    echo "  tickets/regen_ticket_images.py 票据图片重生成"
    echo "  convert-douban.py             豆瓣 Excel → JSON 转换"
    echo "  preview_server.py             本地预览服务器"
    exit 0
fi

TARGET="$SCRIPT_DIR/$1"
shift

if [ ! -f "$TARGET" ]; then
    echo "❌ 脚本不存在: $TARGET"
    exit 1
fi

# 运行时把脚本所在目录加入 PYTHONPATH(sports-sync 依赖同目录模块)
RUN_DIR="$(dirname "$TARGET")"
cd "$RUN_DIR"
PYTHONPATH="$RUN_DIR" exec "$PYTHON" "$(basename "$TARGET")" "$@"
