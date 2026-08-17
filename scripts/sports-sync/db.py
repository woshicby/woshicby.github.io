import datetime
import os
import json
import time

from config import LOCATION_CACHE_FILE, MUNICIPALITIES, DEFAULT_COUNTRY, DEFAULT_COUNTRY_EN, LOCATION_CACHE_GRID_PRECISION

from sqlalchemy import (
    Column,
    Float,
    Integer,
    Interval,
    String,
    create_engine,
    inspect,
    text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


# ============ 位置缓存 ============
_location_cache = {}

# 加载缓存
if os.path.exists(LOCATION_CACHE_FILE):
    try:
        with open(LOCATION_CACHE_FILE, "r", encoding="utf-8") as f:
            _location_cache = json.load(f)
        print(f"[信息] 已加载位置缓存: {len(_location_cache)} 条记录")
    except Exception:
        _location_cache = {}


# ============ Nominatim 逆地理编码(本地缓存 + 网络,统一省/市判断) ============
_geocoder = None


def _get_geocoder():
    """惰性初始化 Nominatim geocoder"""
    global _geocoder
    if _geocoder is None:
        import random
        import string
        from geopy.geocoders import options, Nominatim

        def randomword():
            letters = string.ascii_lowercase
            return "".join(random.choice(letters) for i in range(6))

        options.default_user_agent = "running_page"
        _geocoder = Nominatim(user_agent=randomword())
    return _geocoder


def _reverse_geocode(lat, lon, max_retries=3, retry_delay=2):
    """逆地理编码(网络),带重试。返回完整地址字符串或 None"""
    geocoder = _get_geocoder()
    for attempt in range(max_retries):
        try:
            location = geocoder.reverse(f"{lat}, {lon}", language="zh-CN", timeout=15)
            if location:
                return str(location)
        except Exception:
            time.sleep(retry_delay)
    return None


def _find_location_by_coords(lat, lon):
    """根据坐标查找位置信息(同步时使用)。

    优先级: 本地缓存 -> Nominatim 网络 -> 坐标兜底。
    省份和城市统一由 Nominatim 返回的完整地址决定,不再依赖本地 GeoJSON。
    """
    # 先查缓存
    cached = _get_location_from_cache(lat, lon)
    if cached:
        return cached

    # Nominatim 网络查询
    result = _reverse_geocode(lat, lon)
    if result:
        _set_location_cache(lat, lon, result)
        return result

    # 网络失败兜底: 仅国家 + 坐标
    location_country = f"{DEFAULT_COUNTRY} ({lat:.2f}, {lon:.2f})"
    _set_location_cache(lat, lon, location_country)
    return location_country


def _save_location_cache():
    """保存位置缓存到文件"""
    try:
        with open(LOCATION_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(_location_cache, f, ensure_ascii=False)
    except Exception as e:
        print(f"[警告] 保存位置缓存失败: {e}")


def _get_location_from_cache(lat, lon):
    """从缓存获取位置信息，使用网格化坐标作为缓存键"""
    # 网格化到 0.01 度（约1km），同一区域共享缓存
    grid_lat = round(lat, LOCATION_CACHE_GRID_PRECISION)
    grid_lon = round(lon, LOCATION_CACHE_GRID_PRECISION)
    key = f"{grid_lat},{grid_lon}"
    return _location_cache.get(key)


def _set_location_cache(lat, lon, location_str):
    """设置位置缓存"""
    grid_lat = round(lat, LOCATION_CACHE_GRID_PRECISION)
    grid_lon = round(lon, LOCATION_CACHE_GRID_PRECISION)
    key = f"{grid_lat},{grid_lon}"
    _location_cache[key] = location_str


ACTIVITY_KEYS = [
    "run_id",
    "name",
    "distance",
    "moving_time",
    "type",
    "subtype",
    "start_date",
    "start_date_local",
    "location_country",
    "summary_polyline",
    "average_heartrate",
    "average_speed",
    "elevation_gain",
]


class Activity(Base):
    __tablename__ = "activities"

    run_id = Column(Integer, primary_key=True)
    name = Column(String)
    distance = Column(Float)
    moving_time = Column(Interval)
    elapsed_time = Column(Interval)
    type = Column(String)
    subtype = Column(String)
    start_date = Column(String)
    start_date_local = Column(String)
    location_country = Column(String)
    summary_polyline = Column(String)
    average_heartrate = Column(Float)
    average_speed = Column(Float)
    elevation_gain = Column(Float)
    streak = None

    def to_dict(self):
        out = {}
        for key in ACTIVITY_KEYS:
            attr = getattr(self, key)
            if isinstance(attr, (datetime.timedelta, datetime.datetime)):
                out[key] = str(attr)
            else:
                out[key] = attr

        if self.streak:
            out["streak"] = self.streak

        return out


def update_or_create_activity(session, run_activity):
    created = False
    try:
        activity = (
            session.query(Activity).filter_by(run_id=int(run_activity.id)).first()
        )

        current_elevation_gain = 0.0  # default value

        if (
            hasattr(run_activity, "total_elevation_gain")
            and run_activity.total_elevation_gain is not None
        ):
            current_elevation_gain = float(run_activity.total_elevation_gain)
        elif (
            hasattr(run_activity, "elevation_gain")
            and run_activity.elevation_gain is not None
        ):
            current_elevation_gain = float(run_activity.elevation_gain)

        if not activity:
            start_point = run_activity.start_latlng
            location_country = getattr(run_activity, "location_country", "")
            if not location_country and start_point or location_country == DEFAULT_COUNTRY_EN:
                try:
                    lat, lon = start_point.lat, start_point.lon
                    location_country = _find_location_by_coords(lat, lon)
                except Exception:
                    pass

            activity = Activity(
                run_id=run_activity.id,
                name=run_activity.name,
                distance=run_activity.distance,
                moving_time=run_activity.moving_time,
                elapsed_time=run_activity.elapsed_time,
                type=run_activity.type,
                subtype=run_activity.subtype,
                start_date=run_activity.start_date,
                start_date_local=run_activity.start_date_local,
                location_country=location_country,
                average_heartrate=run_activity.average_heartrate,
                average_speed=float(run_activity.average_speed),
                elevation_gain=current_elevation_gain,
                summary_polyline=(
                    run_activity.map and run_activity.map.summary_polyline or ""
                ),
            )
            session.add(activity)
            created = True
        else:
            activity.name = run_activity.name
            activity.distance = float(run_activity.distance)
            activity.moving_time = run_activity.moving_time
            activity.elapsed_time = run_activity.elapsed_time
            activity.type = run_activity.type
            activity.subtype = run_activity.subtype
            activity.average_heartrate = run_activity.average_heartrate
            activity.average_speed = float(run_activity.average_speed)
            activity.elevation_gain = current_elevation_gain
            activity.summary_polyline = (
                run_activity.map and run_activity.map.summary_polyline or ""
            )
    except Exception as e:
        print(f"[错误] 处理活动数据失败: run_id={run_activity.id}")
        print(f"  异常类型: {type(e).__name__}")
        print(f"  异常信息: {e}")

    return created


def add_missing_columns(engine, model):
    inspector = inspect(engine)
    table_name = model.__tablename__
    columns = {col["name"] for col in inspector.get_columns(table_name)}
    missing_columns = []

    for column in model.__table__.columns:
        if column.name not in columns:
            missing_columns.append(column)
    if missing_columns:
        with engine.connect() as conn:
            for column in missing_columns:
                column_type = str(column.type)
                conn.execute(
                    text(
                        f"ALTER TABLE {table_name} ADD COLUMN {column.name} {column_type}"
                    )
                )


def init_db(db_path):
    engine = create_engine(
        f"sqlite:///{db_path}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(engine)

    add_missing_columns(engine, Activity)

    sm = sessionmaker(bind=engine)
    session = sm()
    session.commit()
    return session
