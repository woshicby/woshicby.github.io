// ============ 共享配置（所有页面使用） ============

// Mapbox 访问令牌
var MAPBOX_TOKEN = 'pk.eyJ1IjoieWlob25nMDYxOCIsImEiOiJjbWYxdXR4YncwMTJtMm5zOTE4eTZpMGdtIn0.OnsXdwkZFztR8a5Ph_T-xg';

// 当前瓦片供应商
var currentTileVendor = 'carto';

// GCJ-02 坐标系瓦片供应商（这些供应商的瓦片使用 GCJ-02 坐标系）
var GCJ02_VENDORS = new Set(['amap']);

// 需要 GCJ-02 坐标转换的活动（在 OSM 瓦片上偏移的活动）
// 修改此列表即可统一影响所有页面
var GCJ02_ACTIVITIES = new Set([
  1535447197000,  // 2018-08-28 矿大北京
  1535360899000,  // 2018-08-27 矿大北京
  1535360898000,  // 2018-08-27 矿大北京
  1535363453000,  // 2018-08-27 矿大北京
  1535360288000,  // 2018-08-27 矿大北京
  1535274272000,  // 2018-08-26 北京奥森
  1535272577000,  // 2018-08-26 矿大北京
  1535274271000,  // 2018-08-26 矿大北京
  1535190577000,  // 2018-08-25 矿大北京
  1535104770000,  // 2018-08-24 矿大北京
  1535101855000,  // 2018-08-24 矿大北京
  1535104771000,  // 2018-08-24 矿大北京
  1535016796000,  // 2018-08-23 北京奥森
  1535014841000,  // 2018-08-23 矿大北京
  1534928519000,  // 2018-08-22 矿大北京
  1534930905000,  // 2018-08-22 矿大北京
  1534930906000,  // 2018-08-22 矿大北京
  1534843700000,  // 2018-08-21 北京奥森
  1534841996000,  // 2018-08-21 矿大北京
  1534843699000,  // 2018-08-21 矿大北京
  1534669119000,  // 2018-08-19 矿大北京
  1534671927000,  // 2018-08-19 矿大北京
  // 在此添加更多需要转换的活动 run_id
]);

// 直辖市列表（城市统计时直辖市不按区拆分）
var MUNICIPALITIES = ['北京市', '上海市', '天津市', '重庆市', '香港特别行政区', '澳门特别行政区'];

// 地图瓦片样式配置
var MAP_TILE_STYLES = {
  carto: {
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    name: 'Carto'
  },
  openfreemap: {
    light: 'https://tiles.openfreemap.org/styles/bright',
    dark: 'https://tiles.openfreemap.org/styles/dark',
    name: 'OpenFreeMap'
  },
  mapbox: {
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
    name: 'Mapbox'
  },
  amap: {
    light: {
      version: 8,
      sources: {
        'amap-tiles': {
          type: 'raster',
          tiles: [
            'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            'https://webrd03.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
          ],
          tileSize: 256
        }
      },
      layers: [{ id: 'amap-layer', type: 'raster', source: 'amap-tiles' }],
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
    },
    dark: {
      version: 8,
      sources: {
        'amap-tiles': {
          type: 'raster',
          tiles: [
            'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            'https://webrd03.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            'https://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
          ],
          tileSize: 256
        }
      },
      layers: [{ id: 'amap-layer', type: 'raster', source: 'amap-tiles' }],
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
    },
    name: '高德'
  }
};
