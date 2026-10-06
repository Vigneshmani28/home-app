import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson';

import type { TamilNaduDistrict } from '@/constants/tamil-nadu-districts';
import type { Coordinates } from '@/features/location/types';

import { matchTamilNaduDistrict } from '../utils/match-district';

type DistrictFeature = Feature<Polygon | MultiPolygon, { name: string }>;

interface DistrictBoundary {
  district: TamilNaduDistrict;
  feature: DistrictFeature;
  /** [minLng, minLat, maxLng, maxLat] — cheap reject before the exact polygon test. */
  bbox: [number, number, number, number];
}

/**
 * The boundary data is simplified, so a point on the coast or right on a district line can fall in
 * a sliver that no polygon covers. Within this distance of a boundary we snap to the nearest
 * district instead of calling the user "outside Tamil Nadu".
 */
const EDGE_TOLERANCE_KM = 5;

let boundaries: DistrictBoundary[] | null = null;

function ringsOf(feature: DistrictFeature): Position[][] {
  const { geometry } = feature;
  return geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();
}

/** Parsed on first use (the file is ~1.2 MB), not at app start. */
function loadBoundaries(): DistrictBoundary[] {
  if (boundaries) return boundaries;
  const collection = require('../../../../assets/tamil-nadu.json') as { features: DistrictFeature[] };
  const loaded: DistrictBoundary[] = [];
  for (const feature of collection.features) {
    // The file's spellings differ from ours ("Sivagangai", "Nagapattinam District"…).
    const district = matchTamilNaduDistrict([feature.properties.name]);
    if (!district) {
      if (__DEV__) console.warn(`[district] no canonical district for boundary "${feature.properties.name}"`);
      continue;
    }
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const ring of ringsOf(feature)) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
    loaded.push({ district, feature, bbox: [minLng, minLat, maxLng, maxLat] });
  }
  boundaries = loaded;
  return loaded;
}

function isValidCoordinate({ lat, lng }: Coordinates): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/** Distance in km from a point to a line segment, on a local flat-earth approximation (fine at this scale). */
function distanceToSegmentKm(p: Coordinates, a: Position, b: Position): number {
  const kmPerDegLat = 111.32;
  const kmPerDegLng = kmPerDegLat * Math.cos((p.lat * Math.PI) / 180);
  const px = p.lng * kmPerDegLng;
  const py = p.lat * kmPerDegLat;
  const ax = a[0] * kmPerDegLng;
  const ay = a[1] * kmPerDegLat;
  const bx = b[0] * kmPerDegLng;
  const by = b[1] * kmPerDegLat;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distanceToBoundaryKm(p: Coordinates, boundary: DistrictBoundary): number {
  let min = Infinity;
  for (const ring of ringsOf(boundary.feature)) {
    for (let i = 0; i < ring.length - 1; i++) {
      min = Math.min(min, distanceToSegmentKm(p, ring[i], ring[i + 1]));
    }
  }
  return min;
}

/**
 * Finds the Tamil Nadu district containing a coordinate, fully offline. Returns null when the point
 * is not in (or within a few km of) Tamil Nadu, or the coordinate is invalid.
 */
export function findDistrictByCoordinates(coords: Coordinates): TamilNaduDistrict | null {
  if (!isValidCoordinate(coords)) return null;
  const all = loadBoundaries();
  const target = point([coords.lng, coords.lat]);

  for (const boundary of all) {
    const [minLng, minLat, maxLng, maxLat] = boundary.bbox;
    if (coords.lng < minLng || coords.lng > maxLng || coords.lat < minLat || coords.lat > maxLat) continue;
    if (booleanPointInPolygon(target, boundary.feature)) return boundary.district;
  }

  // Not inside any polygon: snap to a district only if we're just outside its (simplified) edge.
  const margin = 0.1; // ~11 km in degrees, a loose bbox pre-filter for the distance check
  let nearest: { district: TamilNaduDistrict; km: number } | null = null;
  for (const boundary of all) {
    const [minLng, minLat, maxLng, maxLat] = boundary.bbox;
    if (
      coords.lng < minLng - margin ||
      coords.lng > maxLng + margin ||
      coords.lat < minLat - margin ||
      coords.lat > maxLat + margin
    ) {
      continue;
    }
    const km = distanceToBoundaryKm(coords, boundary);
    if (km <= EDGE_TOLERANCE_KM && (!nearest || km < nearest.km)) nearest = { district: boundary.district, km };
  }
  return nearest?.district ?? null;
}
