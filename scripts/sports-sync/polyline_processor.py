from typing import List, Tuple
import polyline
import warnings
from haversine import haversine

from config import IGNORE_POLYLINE, IGNORE_RANGE, IGNORE_START_END_RANGE


def point_distance_in_range(
    point: Tuple[float], center_point: Tuple[float], distance: int
) -> bool:
    """Check if a point is within a certain distance of a center point."""
    return haversine(point, center_point) < distance


def filter_out(
    polyline_str: str,
    start_point: Tuple[float] = None,
    end_point: Tuple[float] = None,
) -> str:
    """Filter a polyline string based on privacy settings.

    Returns the original polyline if no filtering is needed,
    or a filtered version with sensitive areas removed.
    """
    if not polyline_str:
        return polyline_str

    # If no privacy filters are set, return as-is
    if not IGNORE_POLYLINE and IGNORE_RANGE == 0 and IGNORE_START_END_RANGE == 0:
        return polyline_str

    try:
        coords = polyline.decode(polyline_str)
    except Exception:
        return polyline_str

    if not coords:
        return polyline_str

    filtered = []
    for point in coords:
        skip = False

        # Filter by specific polyline areas
        if IGNORE_POLYLINE:
            for ignore_point in IGNORE_POLYLINE:
                if haversine(point, ignore_point) < IGNORE_RANGE:
                    skip = True
                    break

        # Filter by start/end point proximity
        if not skip and IGNORE_START_END_RANGE > 0:
            if start_point and haversine(point, start_point) < IGNORE_START_END_RANGE:
                skip = True
            if end_point and haversine(point, end_point) < IGNORE_START_END_RANGE:
                skip = True

        if not skip:
            filtered.append(point)

    if not filtered:
        return polyline_str

    try:
        return polyline.encode(filtered)
    except Exception:
        return polyline_str
