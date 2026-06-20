import os

# 获取当前文件所在目录
current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(os.path.dirname(current))  # scripts/sports-sync -> scripts -> project root

# ============ 文件路径配置 ============
FIT_FOLDER = os.path.join(parent, "FIT")
JSON_FILE = os.path.join(parent, "JSON", "sports-activities.json")
SQL_FILE = os.path.join(parent, "data.db")
IMPORTED_FILE = os.path.join(parent, "JSON", "imported_activities.json")
DETAIL_DIR = os.path.join(parent, "activities_detail")
ASSETS_DIR = os.path.join(parent, "assets")
LOCATION_CACHE_FILE = os.path.join(parent, "JSON", "location_cache.json")
PROVINCE_GEOJSON_PATH = os.path.join(parent, "JSON", "china_provinces.json")

# ============ 时区配置 ============
BASE_TIMEZONE = "Asia/Shanghai"
UTC_TIMEZONE = "UTC"

# ============ 地理坐标常量 ============
SEMICIRCLE = 11930465  # 半圆单位转换常量
EARTH_RADIUS_M = 6_371_000  # 地球半径（米）
METERS_PER_DEGREE_LAT = 111000  # 每度纬度对应的米数近似值
POLYLINE_PRECISION = 1e5  # Google Polyline 编码的精度因子

# ============ 位置缓存配置 ============
LOCATION_CACHE_GRID_PRECISION = 2  # 网格精度（小数位数），0.01度≈1km
LOCATION_CACHE_EXPAND_OFFSETS = [-0.01, 0, 0.01]  # 缓存扩展偏移量

# ============ 中国行政区划 ============
MUNICIPALITIES = {
    "北京市", "上海市", "天津市", "重庆市",
    "香港特别行政区", "澳门特别行政区",
}
DEFAULT_COUNTRY = "中国"
DEFAULT_COUNTRY_EN = "China"  # 英文国家名（用于 Strava 数据兼容）

# ============ Nominatim 逆地理编码配置 ============
NOMINATIM_USER_AGENT = "running_page"
NOMINATIM_LANGUAGE = "zh-CN"
NOMINATIM_TIMEOUT = 15
NOMINATIM_MAX_RETRIES = 3
NOMINATIM_RETRY_DELAY = 2  # 重试间隔（秒）
NOMINATIM_RATE_LIMIT_SECONDS = 1  # 查询限速间隔（秒）
NOMINATIM_RANDOM_SUFFIX_LENGTH = 6  # 随机 user_agent 后缀长度

# ============ 运动数据处理配置 ============
IGNORE_BEFORE_SAVING = os.getenv("IGNORE_BEFORE_SAVING", False)
INDOOR_SPREAD_THRESHOLD = float(os.getenv("INDOOR_SPREAD_THRESHOLD", "0.002"))
LOOP_CLOSE_THRESHOLD = 0.003  # 判断环线的距离阈值（度），约330m
MAX_ROUTE_POINTS = 50000  # 路线最大点数
INDOOR_SUBTYPES = {"treadmill", "indoor", "virtualrun", "virtual_run"}
TINY_SPREAD_THRESHOLD = 0.0001  # 极小GPS散布阈值
MIN_SEGMENT_DISTANCE_M = 0.01  # 最小线段距离（米），过滤极短线段
INDOOR_DISTANCE_THRESHOLD_M = 100  # 有距离但无GPS时判断为室内的阈值（米）
STRAVA_SYNC_LOOKBACK_DAYS = 7  # Strava 增量同步回溯天数
SUSPICIOUS_ELEVATION_THRESHOLD_M = 20000  # 可疑海拔增益阈值（米）
COORD_OFFSET_THRESHOLD = 0.005  # 坐标偏移阈值（度），约500m

# ============ 折线隐私过滤配置 ============
IGNORE_POLYLINE = []
_ignore_polyline_env = os.getenv("IGNORE_POLYLINE")
if _ignore_polyline_env:
    try:
        import polyline as _polyline
        IGNORE_POLYLINE = _polyline.decode(_ignore_polyline_env)
    except Exception:
        IGNORE_POLYLINE = []

IGNORE_RANGE = 0.0
IGNORE_START_END_RANGE = 0.0
try:
    IGNORE_RANGE = int(os.getenv("IGNORE_RANGE", "0")) / 1000
except ValueError:
    IGNORE_RANGE = 0.0
try:
    IGNORE_START_END_RANGE = int(os.getenv("IGNORE_START_END_RANGE", "0")) / 1000
except ValueError:
    IGNORE_START_END_RANGE = 0.0

# ============ SVG 图表配置 ============
SVG_SPECIAL_DISTANCE = 10
SVG_SPECIAL_DISTANCE2 = 20
MARATHON_DISTANCE_M = 42000  # 马拉松距离（米）
HALF_MARATHON_DISTANCE_M = 21000  # 半马距离（米）
TEN_K_DISTANCE_M = 10000  # 10K距离（米）
SVG_COLORS = {
    "background": "#171717",
    "text": "#e0ed5e",
    "track": "#4DD2FF",
    "track2": "#4DD2FF",
    "special": "#f7d02c",
    "special2": "#f56c6c",
    "special_distance": "#e0ed5e",
    "special_distance2": "#e0ed5e",
    "empty": "#444444",
    "dim": "#555555",
}

# ============ 运动类型映射 ============
# FIT 枚举值 -> 英文名
SPORT_MAP = {
    0: "generic", 1: "running", 2: "cycling", 3: "transition",
    5: "fitness_equipment", 11: "walking", 12: "cross_country_skiing",
    13: "alpine_skiing", 14: "snowboarding", 15: "rowing",
    17: "hiking", 19: "swimming", 26: "elliptical",
    27: "stair_climbing", 28: "yoga", 32: "stand_up_paddleboarding",
    36: "treadmill_running", 37: "gravel_cycling", 39: "mountain_biking",
    44: "indoor_rowing", 45: "indoor_cycling", 46: "indoor_running",
    71: "strength_training", 82: "pilates",
}

SUB_SPORT_MAP = {
    0: "generic", 1: "treadmill", 2: "street", 3: "trail",
    4: "track", 5: "spin", 6: "indoor_cycling", 7: "road",
    8: "mountain", 9: "downhill", 10: "recumbent",
    11: "cyclocross", 12: "hand_cycling", 13: "track_cycling",
    14: "indoor_running", 15: "indoor_rower", 16: "indoor_skiing",
    17: "elliptical", 18: "stair_climbing", 19: "lap_swimming",
    20: "open_water", 21: "flexibility_training", 22: "strength_training",
    23: "warm_up", 24: "match", 25: "exercise", 26: "challenge",
    27: "indoor_skiing", 28: "cardio_training", 29: "indoor_walking",
    30: "e_bike_fitness", 31: "bmx", 32: "casual_walking",
    33: "speed_walking", 34: "bike_to_run_transition",
    35: "run_to_bike_transition", 36: "swim_to_bike_transition",
    37: "atv", 38: "motocross", 39: "backcountry", 40: "resort",
    41: "rc_drone", 42: "wingsuit", 43: "whitewater",
    44: "skate_skiing", 45: "yoga", 46: "pilates",
    47: "indoor_running", 48: "indoor_cycling", 49: "indoor_rower",
    50: "indoor_skiing", 51: "indoor_walking",
}

# 最详细运动类型 -> 中文名（优先使用 sub_sport，若为 generic 则回退到 sport）
SPORT_CN = {
    # running 系列
    "running": "跑步", "treadmill": "跑步机", "trail": "越野跑",
    "track": "场地跑", "street": "路跑", "indoor_running": "室内跑步",
    # walking 系列
    "walking": "步行", "casual_walking": "休闲走", "speed_walking": "健走",
    "indoor_walking": "室内步行",
    # hiking
    "hiking": "徒步",
    # cycling 系列
    "cycling": "骑行", "road": "公路骑行", "mountain": "山地骑行",
    "indoor_cycling": "室内骑行", "spin": "动感单车", "commuting": "通勤骑行",
    "gravel_cycling": "砾石骑行", "track_cycling": "场地骑行",
    "cyclocross": "公路越野骑行", "downhill": "速降骑行",
    "recumbent": "躺车骑行", "e_bike_fitness": "电助力骑行",
    # swimming 系列
    "swimming": "游泳", "lap_swimming": "泳池游泳", "open_water": "公开水域游泳",
    # training / fitness_equipment 系列
    "fitness_equipment": "健身", "training": "训练",
    "strength_training": "力量训练", "cardio_training": "有氧训练",
    "yoga": "瑜伽", "pilates": "普拉提", "elliptical": "椭圆机",
    "stair_climbing": "爬楼梯", "indoor_rowing": "室内划船",
    "indoor_rower": "室内划船", "indoor_skiing": "室内滑雪",
    "warm_up": "热身", "exercise": "锻炼", "flexibility_training": "柔韧训练",
    "breathing": "呼吸训练",
    # rock_climbing
    "rock_climbing": "攀岩", "bouldering": "抱石", "indoor_climbing": "室内攀岩",
    # boating
    "boating": "划船",
    # 其他
    "generic": "其他", "transition": "转换",
    "treadmill_running": "跑步机",
    "mountain_biking": "山地骑行",
}
