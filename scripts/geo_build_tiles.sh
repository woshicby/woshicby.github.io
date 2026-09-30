#!/bin/bash
# 边界矢量瓦片构建: JSON/sports-*.json(GeoJSON 母本) → tiles/<layer>/{z}/{x}/{y}.pbf(静态瓦片金字塔)
#
# 为什么: 城市边界那份 GeoJSON 有 25 MB, 以前每个访客打开运动主页都要整包下载。
# 改成矢量瓦片后, 浏览器只取当前视口需要的瓦片(几 KB~几十 KB)。
#
# 为什么交付"目录式 XYZ 瓦片"而不是单文件 PMTiles(2026-09-30 实测教训):
#   本站地图库是 mapbox-gl v3.0.0, 而 **mapbox-gl 没有 addProtocol** —— 自定义协议是 MapLibre 的能力
#   (mapbox-gl v2.15/v3.0/v3.3/v3.7/v3.9 全部 0 命中, maplibre-gl 4.7.1 有)。
#   PMTiles 必须靠 pmtiles.js 的协议插件读, 在 mapbox-gl 上无法注册 → 填色根本不会出现, 且不报错。
#   XYZ 目录是瓦片金字塔最经典的形式, 与 mapbox-gl 的 { type:'vector', tiles:[...] } 直接兼容,
#   也保住了现有四个瓦片供应商(其中 mapbox:// 那个换成 MapLibre 就会失效)。
#
# 依赖: brew install tippecanoe
# 用法: bash scripts/geo_build_tiles.sh      (仓库任意位置执行; 改完母本后重跑, 然后提交 tiles/)
set -euo pipefail

cd "$(dirname "$0")/.."
rm -rf tiles
mkdir -p tiles

# --include=name : 只保留 name 属性(前端按 name 过滤填色)
# --no-feature-limit / --no-tile-size-limit : 不许 tippecanoe 为压体积丢要素(丢了那个区县就不填色)
# --no-tile-compression : **关键**。tippecanoe 默认把每个瓦片 gzip 压一层, 但静态托管(GitHub Pages/本地
#   预览服务器)不会给 .pbf 加 Content-Encoding 头 → 浏览器把 gzip 字节当 MVT 直接丢给地图库,
#   worker 里抛 "Unimplemented type: 3"(无栈)、该源静默不渲染(2026-09-30 实测踩到)。
#   不压之后由 HTTP 层负责压缩(CDN 会对可压缩类型自动 gzip)。
OPTS=(--quiet --force --include=name --no-feature-limit --no-tile-size-limit --no-tile-compression)

echo "=== 1/3 国家层 z0-3 (世界 239 国) ==="
tippecanoe -e tiles/country "${OPTS[@]}" -Z0 -z3 --simplification=6 -l country JSON/sports-world.zh.json

echo "=== 2/3 省级 z3-7 (34 省) ==="
tippecanoe -e tiles/province "${OPTS[@]}" -Z3 -z7 --simplification=6 -l province JSON/sports-china_provinces.json

# 城市层只到 z9: 再往上放大由 z9 瓦片过采样(半透明区县填色看不出明显差别), 换来瓦片文件数少 3/4
# (z6-9 约 3.9k 个文件/1.7MB; 到 z10 会涨到 14.8k 个文件 —— 目录式瓦片的代价就是文件数)
echo "=== 3/3 城市级 z6-9 (475 区县) ==="
tippecanoe -e tiles/city "${OPTS[@]}" -Z6 -z9 --simplification=6 -l city JSON/sports-china_cities.json

echo
echo "=== 产出(文件数 / 体积) ==="
for d in country province city; do
  n=$(find "tiles/$d" -name '*.pbf' | wc -l | tr -d ' ')
  sz=$(du -sh "tiles/$d" | cut -f1)
  echo "  tiles/$d : $n 个 .pbf / $sz"
done
echo "  合计: $(find tiles -name '*.pbf' | wc -l | tr -d ' ') 个文件 / $(du -sh tiles | cut -f1)"
echo
echo "=== 抽查瓦片(图层名与属性应只有 name) ==="
tippecanoe-decode tiles/province/4/13/6.pbf 2>/dev/null | head -5 || echo "(该坐标无瓦片, 跳过)"
