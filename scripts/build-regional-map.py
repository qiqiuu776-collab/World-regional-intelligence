#!/usr/bin/env python3
"""Build the site’s regional SVG from Natural Earth 1:10m country polygons.

Install pyshp and shapely, download Natural Earth’s ne_10m_admin_0_countries
shapefile, then run this script with the shapefile path as its first argument.
"""

from collections import defaultdict
from html import escape
from pathlib import Path
import sys

import shapefile
from shapely.geometry import shape
from shapely.ops import transform, unary_union


SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("ne_10m_admin_0_countries.shp")
OUTPUT = Path(__file__).resolve().parents[1] / "_includes" / "regional-map.svg"
WIDTH, HEIGHT = 1200, 620
SCALE = 220
CX, CY = WIDTH / 2, HEIGHT / 2
ROBINSON = (
    (0, 1.0, 0.0), (5, .9986, .0620), (10, .9954, .1240),
    (15, .9900, .1860), (20, .9822, .2480), (25, .9730, .3100),
    (30, .9600, .3720), (35, .9427, .4340), (40, .9216, .4958),
    (45, .8962, .5571), (50, .8679, .6176), (55, .8350, .6769),
    (60, .7986, .7346), (65, .7597, .7903), (70, .7186, .8435),
    (75, .6732, .8936), (80, .6213, .9394), (85, .5722, .9761),
    (90, .5322, 1.0000),
)

REGIONS = {
    "Northern America": ("north-america", "North America", "#a8bbb6"),
    "Central America": ("central-america", "Central America", "#bdc6ae"),
    "Caribbean": ("caribbean", "Caribbean", "#d8bd8c"),
    "South America": ("south-america", "South America", "#97b6ab"),
    "Europe": ("europe", "Europe", "#d7bd8b"),
    "Northern Africa": ("north-africa", "North Africa", "#c39a78"),
    "Western Africa": ("west-africa", "West Africa", "#d1a98b"),
    "Middle Africa": ("central-africa", "Central Africa", "#b98870"),
    "Eastern Africa": ("east-africa", "East Africa", "#c7967a"),
    "Southern Africa": ("southern-africa", "Southern Africa", "#b47f69"),
    "Western Asia": ("west-asia", "West Asia", "#9eafc4"),
    "Central Asia": ("central-asia", "Central Asia", "#aebbd0"),
    "Southern Asia": ("south-asia", "South Asia", "#91a9c3"),
    "Eastern Asia": ("east-asia", "East Asia", "#9eb5c2"),
    "South-Eastern Asia": ("southeast-asia", "Southeast Asia", "#a6b7a2"),
    "Oceania": ("oceania", "Oceania", "#c5b59b"),
    "Antarctica": ("antarctica", "Antarctica", "#ddd9cf"),
}
SUBREGION_TO_REGION = {
    "Northern America": "Northern America",
    "Central America": "Central America",
    "Caribbean": "Caribbean",
    "South America": "South America",
    "Northern Europe": "Europe", "Western Europe": "Europe",
    "Eastern Europe": "Europe", "Southern Europe": "Europe",
    "Northern Africa": "Northern Africa", "Western Africa": "Western Africa",
    "Middle Africa": "Middle Africa", "Eastern Africa": "Eastern Africa",
    "Southern Africa": "Southern Africa", "Western Asia": "Western Asia",
    "Central Asia": "Central Asia", "Southern Asia": "Southern Asia",
    "Eastern Asia": "Eastern Asia", "South-Eastern Asia": "South-Eastern Asia",
    "Australia and New Zealand": "Oceania", "Melanesia": "Oceania",
    "Micronesia": "Oceania", "Polynesia": "Oceania",
    "Seven seas (open ocean)": "Oceania", "Antarctica": "Antarctica",
}


def interpolate(latitude):
    latitude = abs(max(-90, min(90, latitude)))
    for i in range(1, len(ROBINSON)):
        if latitude <= ROBINSON[i][0]:
            a, b = ROBINSON[i - 1], ROBINSON[i]
            f = (latitude - a[0]) / (b[0] - a[0])
            return a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f
    return ROBINSON[-1][1], ROBINSON[-1][2]


def project(longitude, latitude, z=None):
    if hasattr(longitude, "__iter__"):
        return ([project(x, y)[0] for x, y in zip(longitude, latitude)],
                [project(x, y)[1] for x, y in zip(longitude, latitude)])
    x_ratio, y_ratio = interpolate(latitude)
    x = CX + SCALE * 0.8487 * (longitude * 3.141592653589793 / 180) * x_ratio
    y = CY - SCALE * 1.3523 * (1 if latitude >= 0 else -1) * y_ratio
    return (x, y) if z is None else (x, y, z)


def fmt(value):
    return f"{value:.1f}".rstrip("0").rstrip(".")


def ring_path(ring):
    coords = list(ring.coords)
    if not coords:
        return ""
    return "M" + " L".join(f"{fmt(x)} {fmt(y)}" for x, y, *_ in coords) + " Z"


def polygon_path(polygon):
    return " ".join([ring_path(polygon.exterior)] + [ring_path(r) for r in polygon.interiors])


def main():
    reader = shapefile.Reader(str(SOURCE), encoding="utf-8")
    fields = [field[0] for field in reader.fields[1:]]
    index = {field: fields.index(field) for field in ("ADMIN", "SUBREGION")}
    grouped = defaultdict(list)
    country_paths = defaultdict(list)

    for item in reader.iterShapeRecords():
        country = str(item.record[index["ADMIN"]]).strip()
        subregion = str(item.record[index["SUBREGION"]]).strip()
        region_name = SUBREGION_TO_REGION.get(subregion)
        if not region_name:
            continue
        geometry = shape(item.shape.__geo_interface__)
        geometry = transform(project, geometry).simplify(.35, preserve_topology=True)
        if geometry.is_empty:
            continue
        grouped[region_name].append(geometry)
        pieces = list(geometry.geoms) if geometry.geom_type == "MultiPolygon" else [geometry]
        for polygon in pieces:
            if polygon.geom_type == "Polygon" and polygon.area > .005:
                country_paths[region_name].append((country, polygon_path(polygon)))

    chunks = [
        '<svg class="world-map" viewBox="0 0 1200 620" role="img" aria-labelledby="world-map-title world-map-desc" preserveAspectRatio="xMidYMid meet">',
        '<title id="world-map-title">World map divided into real regional blocks</title>',
        '<desc id="world-map-desc">Natural Earth 1:10 million country boundaries grouped into real world regions. Choose real position or connection view, then move through the timeline.</desc>',
        '<rect class="map-ocean" width="1200" height="620" />',
    ]
    order = [name for name in REGIONS if name != "Antarctica"] + ["Antarctica"]
    for region_name in order:
        if not grouped[region_name]:
            continue
        rid, label, color = REGIONS[region_name]
        union = unary_union(grouped[region_name])
        point = union.representative_point()
        minx, miny, maxx, maxy = union.bounds
        radius = max(18, min(230, ((maxx - minx) ** 2 + (maxy - miny) ** 2) ** .5 / 2))
        chunks.append(
            f'<g class="region-block" data-region="{rid}" data-region-name="{label}" '
            f'data-cx="{fmt(point.x)}" data-cy="{fmt(point.y)}" data-radius="{fmt(radius)}" '
            f'style="--region-fill:{color}" role="group" tabindex="0" aria-label="{label}">'
        )
        chunks.append(f'<title>{escape(label)}</title>')
        for country, path in country_paths[region_name]:
            if path:
                chunks.append(f'<path d="{path}" fill-rule="evenodd"><title>{escape(country)}</title></path>')
        chunks.append(f'<text class="region-label" x="{fmt(point.x)}" y="{fmt(point.y)}">{label.upper()}</text>')
        chunks.append('</g>')
    chunks.append('</svg>')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(chunks) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes; {sum(map(len, country_paths.values())):,} country polygons)")


if __name__ == "__main__":
    main()
