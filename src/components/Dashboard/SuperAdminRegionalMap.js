import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { ChatBubbleOutline, Close, LocationOn, MyLocation, Public } from "@mui/icons-material";
import { toast } from "react-hot-toast";
import { AdminApi, ResearchApi } from "../../services/api";

const BOUNDARY_BASE = "/maps/admin-boundaries";
const EMPTY_COLLECTION = { type: "FeatureCollection", features: [] };
const PIN_SOURCE = "regional-pins-source";
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 760;

const PIN_COLORS = {
  admin: "#2563eb",
  researcher: "#7c3aed",
  analysis: "#0f766e",
};

const LEVEL_META = {
  1: {
    source: "admin-level-1",
    fill: "admin-level-1-fill",
    line: "admin-level-1-line",
    color: "#0f766e",
    selected: "#2563eb",
    hover: "#14b8a6",
    label: "Viloyat",
    nextLabel: "Tumanlar",
    zoom: 6.7,
  },
  2: {
    source: "admin-level-2",
    fill: "admin-level-2-fill",
    line: "admin-level-2-line",
    color: "#f59e0b",
    selected: "#dc2626",
    hover: "#f97316",
    label: "Tuman",
    nextLabel: "Mahallalar",
    zoom: 9.1,
  },
  3: {
    source: "admin-level-3",
    fill: "admin-level-3-fill",
    line: "admin-level-3-line",
    color: "#7c3aed",
    selected: "#0f766e",
    hover: "#8b5cf6",
    label: "Mahalla",
    nextLabel: "",
    zoom: 12.8,
  },
};

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[ʻ‘’`]/g, "'")
    .replace(/вЂ|вЂ™|К»/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const baseName = (value = "") =>
  normalizeText(value)
    .replace(" respublikasi", "")
    .replace(" viloyati", "")
    .replace(" tumani", "")
    .replace(" shahri", "")
    .replace(" mahallasi", "")
    .replace(" region", "")
    .replace(" province", "")
    .trim();

const canonicalRegionName = (value = "") => {
  const normalized = baseName(value);
  const aliases = {
    fargona: "farg'ona",
    qoraqalpogiston: "qoraqalpog'iston",
    "qoraqalpog'iston": "qoraqalpog'iston",
    "toshkent sh": "toshkent",
  };
  return aliases[normalized] || normalized;
};

const featureName = (item) =>
  item?.name_uz || item?.display_name || item?.name_en || item?.name_ru || "Noma'lum hudud";

const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const formatArea = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "-";
  return `${Math.round(n / 100).toLocaleString("uz-UZ")} km²`;
};

const getBounds = (bbox) => {
  bbox = parseMaybeJson(bbox);
  if (!bbox || bbox.length !== 4) return null;
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  ];
};

const getGeometryBounds = (geometry) => {
  const points = [];
  const collectPoints = (coordinates) => {
    if (!Array.isArray(coordinates)) return;
    if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
      points.push(coordinates);
      return;
    }
    coordinates.forEach(collectPoints);
  };
  collectPoints(geometry?.coordinates);
  if (!points.length) return null;
  return [
    Math.min(...points.map(([lng]) => lng)),
    Math.min(...points.map(([, lat]) => lat)),
    Math.max(...points.map(([lng]) => lng)),
    Math.max(...points.map(([, lat]) => lat)),
  ];
};

const getFeatureBounds = (feature) =>
  parseMaybeJson(feature?.bbox || feature?.properties?.bbox) ||
  getGeometryBounds(feature?.geometry);

const getCollectionBounds = (geoJson) => {
  const boxes = (geoJson?.features || [])
    .map(getFeatureBounds)
    .filter((bbox) => Array.isArray(bbox) && bbox.length === 4);
  if (!boxes.length) return null;
  return [
    Math.min(...boxes.map((bbox) => bbox[0])),
    Math.min(...boxes.map((bbox) => bbox[1])),
    Math.max(...boxes.map((bbox) => bbox[2])),
    Math.max(...boxes.map((bbox) => bbox[3])),
  ];
};

const bboxArea = (bbox) => {
  bbox = parseMaybeJson(bbox);
  if (!Array.isArray(bbox) || bbox.length !== 4) return Number.MAX_SAFE_INTEGER;
  return Math.abs((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]));
};

const createProjector = (bbox, width = 1000, height = 650, padding = 18) => {
  const [minLng, minLat, maxLng, maxLat] = bbox || [55.9, 37.1, 73.3, 45.7];
  const lngSpan = Math.max(maxLng - minLng, 0.0001);
  const latSpan = Math.max(maxLat - minLat, 0.0001);
  const scale = Math.min((width - padding * 2) / lngSpan, (height - padding * 2) / latSpan);
  const xOffset = (width - lngSpan * scale) / 2;
  const yOffset = (height - latSpan * scale) / 2;
  return ([lng, lat]) => [
    xOffset + (lng - minLng) * scale,
    height - (yOffset + (lat - minLat) * scale),
  ];
};

const ringToPath = (ring, project) => {
  if (!Array.isArray(ring) || ring.length === 0) return "";
  return ring
    .map((point, index) => {
      const [x, y] = project(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(4)} ${y.toFixed(4)}`;
    })
    .join(" ")
    .concat(" Z");
};

const geometryToPath = (geometry, project) => {
  if (!geometry) return "";
  if (geometry.type === "Polygon") {
    return (geometry.coordinates || []).map((ring) => ringToPath(ring, project)).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates || [])
      .flatMap((polygon) => polygon || [])
      .map((ring) => ringToPath(ring, project))
      .join(" ");
  }
  return "";
};

const featureFromItem = (item) => {
  if (!item?.geometry) return null;
  return {
    type: "Feature",
    id: item.boundary_id || `admin-${item.admin_leve}-${item.id}`,
    bbox: parseMaybeJson(item.bbox),
    geometry: item.geometry,
    properties: {
      ...item,
      bbox: parseMaybeJson(item.bbox),
      center: parseMaybeJson(item.center),
      boundary_id: item.boundary_id || `admin-${item.admin_leve}-${item.id}`,
    },
  };
};

const collectionFromFeatures = (features = []) => ({
  type: "FeatureCollection",
  features: features.filter(Boolean),
});

const getNumericValue = (row, keys) => {
  for (const key of keys) {
    const value = key.split(".").reduce((acc, part) => acc?.[part], row);
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const pct = (value, total) => Math.round((value / Math.max(total, 1)) * 100);

const getCenter = (item) => {
  const center = parseMaybeJson(item?.center);
  const bbox = parseMaybeJson(item?.bbox);
  if (Array.isArray(center)) return center;
  if (Array.isArray(bbox)) return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
  return [64.5853, 41.3775];
};

const jitterPoint = (center, index, distance = 0.12) => {
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = distance * (0.25 + ((index % 7) + 1) / 10);
  return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius * 0.65];
};

const getRiskColor = (riskRate) => {
  if (riskRate >= 45) return "#dc2626";
  if (riskRate >= 25) return "#f59e0b";
  if (riskRate > 0) return "#0f766e";
  return "#64748b";
};

const addBoundaryLayers = (map, level, beforeId, isDark) => {
  const meta = LEVEL_META[level];
  const beforeLayer = beforeId && map.getLayer(beforeId) ? beforeId : undefined;
  map.addSource(meta.source, {
    type: "geojson",
    data: EMPTY_COLLECTION,
    promoteId: "boundary_id",
  });
  map.addLayer(
    {
      id: meta.fill,
      type: "fill",
      source: meta.source,
      paint: {
        "fill-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          meta.selected,
          ["boolean", ["feature-state", "hover"], false],
          meta.hover,
          meta.color,
        ],
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          level === 3 ? 0.42 : 0.36,
          ["boolean", ["feature-state", "hover"], false],
          0.3,
          level === 1 ? 0.74 : level === 2 ? 0.18 : 0.12,
        ],
      },
    },
    beforeLayer,
  );
  map.addLayer(
    {
      id: meta.line,
      type: "line",
      source: meta.source,
      paint: {
        "line-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          meta.selected,
          level === 1 ? "#ffffff" : isDark ? "#e2e8f0" : "#0f172a",
        ],
        "line-opacity": level === 1 ? 0.76 : level === 2 ? 0.64 : 0.5,
        "line-width": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          level === 3 ? 2.2 : 2.8,
          level === 1 ? 1.25 : level === 2 ? 1.05 : 0.75,
        ],
      },
    },
    beforeLayer,
  );
};

const clearLayerSelection = (map, featureIdsByLevel, level) => {
  (featureIdsByLevel.current[level] || []).forEach((id) => {
    map.setFeatureState(
      { source: LEVEL_META[level].source, id },
      { selected: false, hover: false },
    );
  });
};

const StatPill = ({ label, value, color = "primary.main" }) => (
  <Box
    sx={{
      px: 1.5,
      py: 1,
      borderRadius: 1.5,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      minWidth: 100,
    }}
  >
    <Typography variant="caption" color="text.secondary" fontWeight={700}>
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={900} sx={{ color, lineHeight: 1.1 }}>
      {value}
    </Typography>
  </Box>
);

const ScientificBarChart = ({ title, subtitle, rows, maxValue }) => (
  <Box
    sx={{
      p: 1.4,
      borderRadius: 1.5,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
    }}
  >
    <Typography variant="body2" fontWeight={900}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {subtitle}
      </Typography>
    )}
    <Stack spacing={0.9} mt={1.2}>
      {rows.map((row) => (
        <Box key={row.label}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.35}>
            <Typography variant="caption" color="text.secondary" fontWeight={850}>
              {row.label}
            </Typography>
            <Typography variant="caption" fontWeight={900}>
              {row.value}
            </Typography>
          </Stack>
          <Box sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(100,116,139,0.14)" }}>
            <Box
              sx={{
                height: "100%",
                width: `${Math.max((row.value / Math.max(maxValue, 1)) * 100, row.value ? 7 : 0)}%`,
                borderRadius: 4,
                bgcolor: row.color,
              }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  </Box>
);

const ScientificIndexChart = ({ rows }) => {
  const points = rows.map((row, index) => {
    const x = 22 + index * (156 / Math.max(rows.length - 1, 1));
    const y = 78 - Math.min(Math.max(row.value, 0), 100) * 0.56;
    return `${x},${y}`;
  });
  return (
    <Box
      sx={{
        p: 1.4,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="body2" fontWeight={900}>
        Klinik indeks profili
      </Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        Normalizatsiya qilingan BMI, Z-score va risk ko'rsatkichlari
      </Typography>
      <Box component="svg" viewBox="0 0 200 92" sx={{ width: "100%", height: 110, mt: 1 }}>
        {[20, 40, 60, 80].map((tick) => (
          <line
            key={tick}
            x1="18"
            x2="184"
            y1={82 - tick * 0.56}
            y2={82 - tick * 0.56}
            stroke="rgba(100,116,139,0.18)"
            strokeWidth="1"
          />
        ))}
        <polyline fill="none" stroke="#2563eb" strokeWidth="2.4" points={points.join(" ")} />
        {rows.map((row, index) => {
          const [x, y] = points[index].split(",").map(Number);
          return (
            <g key={row.label}>
              <circle cx={x} cy={y} r="3.6" fill={row.color} stroke="#fff" strokeWidth="1.5" />
              <text x={x} y="90" textAnchor="middle" fontSize="8" fill="currentColor">
                {row.short}
              </text>
            </g>
          );
        })}
      </Box>
    </Box>
  );
};

export default function SuperAdminRegionalMap({ stats, statsLoading, admins = [] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const mapContainerRef = useRef(null);
  const mapInteractionRef = useRef(null);
  const svgRef = useRef(null);
  const mapRef = useRef(null);
  const indexRef = useRef(null);
  const featureIdsByLevel = useRef({ 1: [], 2: [], 3: [] });
  const hoveredRef = useRef({ level: null, id: null });
  const hoveredSvgRef = useRef(null);
  const loadedFilesRef = useRef({});
  const level1GeoJsonRef = useRef(EMPTY_COLLECTION);
  const level3FeaturesRef = useRef([]);
  const panDragRef = useRef(null);
  const suppressSvgClickRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [boundaryIndex, setBoundaryIndex] = useState(null);
  const [visibleGeoJson, setVisibleGeoJson] = useState(EMPTY_COLLECTION);
  const [countryBbox, setCountryBbox] = useState(null);
  const [svgViewport, setSvgViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [svgSelectedId, setSvgSelectedId] = useState("");
  const [svgHoveredId, setSvgHoveredId] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedPath, setSelectedPath] = useState({ region: null, district: null, mahalla: null });
  const [level3Features, setLevel3Features] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [researchRecords, setResearchRecords] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [loadingBoundary, setLoadingBoundary] = useState(false);

  const allRecords = useMemo(
    () => [
      ...admins.map((item) => ({ ...item, __type: "admin" })),
      ...analyses.map((item) => ({ ...item, __type: "analysis" })),
      ...researchRecords.map((item) => ({ ...item, __type: "researcher" })),
    ],
    [admins, analyses, researchRecords],
  );

  useEffect(() => {
    level3FeaturesRef.current = level3Features;
  }, [level3Features]);

  const level1ByName = useMemo(() => {
    const map = new Map();
    (boundaryIndex?.levels?.["1"] || []).forEach((item) => {
      map.set(canonicalRegionName(featureName(item)), item);
    });
    return map;
  }, [boundaryIndex]);

  const selectedRecords = useMemo(() => {
    if (!selected) return allRecords;
    const regionKey = selectedPath.region
      ? canonicalRegionName(featureName(selectedPath.region))
      : "";
    const districtKey = selectedPath.district ? baseName(featureName(selectedPath.district)) : "";
    const mahallaKey = selectedPath.mahalla ? baseName(featureName(selectedPath.mahalla)) : "";

    return allRecords.filter((record) => {
      const text = normalizeText(
        [
          record.region,
          record.district,
          record.address,
          record.settlement,
          record.school_name,
          record.birth_place,
        ]
          .filter(Boolean)
          .join(" "),
      );
      if (regionKey && !text.includes(regionKey)) return false;
      if (districtKey && !text.includes(districtKey)) return false;
      if (mahallaKey && !text.includes(mahallaKey)) return false;
      return true;
    });
  }, [allRecords, selected, selectedPath]);

  const regionMetrics = useMemo(() => {
    const byRegion = new Map();
    (boundaryIndex?.levels?.["1"] || []).forEach((region) => {
      byRegion.set(region.id, {
        analyses: 0,
        admins: 0,
        researchers: 0,
        risk: 0,
        riskRate: 0,
      });
    });

    (stats?.by_region || []).forEach((row) => {
      const region = level1ByName.get(canonicalRegionName(row.region));
      const metric = region ? byRegion.get(region.id) : null;
      if (metric) metric.analyses = row.count || 0;
    });

    (stats?.top_risk_regions || []).forEach((row) => {
      const region = level1ByName.get(canonicalRegionName(row.region));
      const metric = region ? byRegion.get(region.id) : null;
      if (metric) {
        metric.risk = row.count || 0;
        metric.riskRate = Number(row.risk_rate || 0);
      }
    });

    allRecords.forEach((row) => {
      const region = level1ByName.get(
        canonicalRegionName(row.region || row.settlement || row.address),
      );
      const metric = region ? byRegion.get(region.id) : null;
      if (!metric) return;
      if (row.__type === "admin") metric.admins += 1;
      if (row.__type === "researcher") metric.researchers += 1;
    });

    return byRegion;
  }, [allRecords, boundaryIndex, level1ByName, stats]);

  const selectedMetric = useMemo(() => {
    const analyses = selectedRecords.filter((row) => row.__type === "analysis").length;
    const admins = selectedRecords.filter((row) => row.__type === "admin").length;
    const researchers = selectedRecords.filter((row) => row.__type === "researcher").length;
    const regionRisk = selected?.admin_leve === 1 ? regionMetrics.get(selected.id) || {} : {};
    return {
      analyses,
      admins,
      researchers,
      risk: regionRisk.risk || 0,
      riskRate: regionRisk.riskRate || 0,
    };
  }, [regionMetrics, selected, selectedRecords]);

  const pinFeatures = useMemo(() => {
    const counters = {};
    return allRecords
      .map((item) => {
        const region = level1ByName.get(
          canonicalRegionName(item.region || item.settlement || item.address),
        );
        const center = getCenter(region);
        if (!region) return null;
        const key = `${region.id}:${item.__type}`;
        counters[key] = (counters[key] || 0) + 1;
        const lng = Number(item.longitude ?? item.lon ?? item.lng);
        const lat = Number(item.latitude ?? item.lat);
        const coordinates =
          Number.isFinite(lng) && Number.isFinite(lat)
            ? [lng, lat]
            : jitterPoint(center, counters[key]);
        return {
          type: "Feature",
          geometry: { type: "Point", coordinates },
          properties: {
            id: `${item.__type}-${item.id || item.email || counters[key]}`,
            type: item.__type,
            name: item.name || item.full_name || item.id_code || "Noma'lum",
            email: item.email || "",
            phone: item.phone || item.parents_phone || "",
            region: featureName(region),
            district: item.district || "",
            role: item.role || (item.__type === "analysis" ? "izlanuvchi yozuvi" : "researcher"),
            address: item.address || item.settlement || item.school_name || "",
          },
        };
      })
      .filter(Boolean);
  }, [allRecords, level1ByName]);

  const pinsGeoJson = useMemo(
    () => ({ type: "FeatureCollection", features: pinFeatures }),
    [pinFeatures],
  );

  const svgMap = useMemo(() => {
    const features = [...(visibleGeoJson?.features || [])].sort(
      (a, b) => bboxArea(b.bbox || b.properties?.bbox) - bboxArea(a.bbox || a.properties?.bbox),
    );
    const focusedBbox = selected ? getCollectionBounds(visibleGeoJson) : null;
    const bbox = focusedBbox || countryBbox || getCollectionBounds(visibleGeoJson);
    const project = createProjector(bbox);
    return { features, project };
  }, [countryBbox, selected, visibleGeoJson]);

  const mapColors = useMemo(
    () => ({
      background: isDark ? "#0b1620" : "#eef3f0",
      label: isDark ? "#e7edf3" : "#21303f",
      labelHalo: isDark ? "rgba(11,22,32,0.92)" : "rgba(255,255,255,0.94)",
      region: isDark ? "#2d6f73" : "#6f9f8d",
      regionHover: isDark ? "#3e8a8f" : "#5a8d7b",
      district: isDark ? "#496f9b" : "#86a6c9",
      districtHover: isDark ? "#5c84b4" : "#6f92ba",
      mahalla: isDark ? "#8b7651" : "#c7ae78",
      mahallaHover: isDark ? "#a48e65" : "#b49a63",
      selected: isDark ? "#d86645" : "#d95f4a",
      stroke: isDark ? "rgba(238,243,240,0.76)" : "rgba(255,255,255,0.88)",
    }),
    [isDark],
  );

  const getSvgFill = useCallback(
    (level, active, hovered) => {
      if (active) return mapColors.selected;
      if (level === 1) return hovered ? mapColors.regionHover : mapColors.region;
      if (level === 2) return hovered ? mapColors.districtHover : mapColors.district;
      return hovered ? mapColors.mahallaHover : mapColors.mahalla;
    },
    [mapColors],
  );

  const svgLabels = useMemo(() => {
    const scale = Math.max(svgViewport.scale || 1, 1);
    return svgMap.features
      .map((feature) => {
        const props = feature.properties || {};
        const level = Number(props.admin_leve || 1);
        const bbox = parseMaybeJson(props.bbox || feature.bbox);
        if (!Array.isArray(bbox) || bbox.length !== 4) return null;
        const center = parseMaybeJson(props.center) || getCenter({ bbox });
        if (!Array.isArray(center)) return null;
        const [x, y] = svgMap.project(center);
        const [x1, y1] = svgMap.project([bbox[0], bbox[1]]);
        const [x2, y2] = svgMap.project([bbox[2], bbox[3]]);
        const boxWidth = Math.abs(x2 - x1);
        const boxHeight = Math.abs(y2 - y1);
        const shortSide = Math.min(boxWidth, boxHeight);
        const active = (props.boundary_id || feature.id) === svgSelectedId;
        const rawLabel = featureName(props);
        const label = rawLabel.length > 22 ? `${rawLabel.slice(0, 21)}...` : rawLabel;
        const screenSize = active ? 13 : level === 1 ? 12 : level === 2 ? 10.5 : 8.5;
        const maxByBox = Math.min(
          shortSide * 0.5,
          (boxWidth * 0.96) / Math.max(label.length * 0.52, 1),
        );
        const size = Math.min(screenSize / scale, maxByBox);
        const visualWidth = boxWidth * scale;
        const visualHeight = boxHeight * scale;
        const visualSize = size * scale;
        const minVisible = active ? 4.5 : level === 1 ? 4.2 : level === 2 ? 3.8 : 3.2;
        if (visualSize < minVisible || visualWidth < 18 || visualHeight < 8) return null;
        return {
          id: props.boundary_id || feature.id,
          x,
          y,
          level,
          active,
          label,
          size,
        };
      })
      .filter(Boolean);
  }, [svgMap, svgSelectedId, svgViewport.scale]);

  const setSourceData = useCallback((level, geoJson, makeVisible = true) => {
    const map = mapRef.current;
    if (makeVisible && (level === 1 || level === 2 || level === 3)) {
      setVisibleGeoJson(geoJson || EMPTY_COLLECTION);
    }
    const source = map?.getSource(LEVEL_META[level].source);
    if (!source) {
      console.warn(`Map source is not ready for admin level ${level}`);
      return;
    }
    featureIdsByLevel.current[level] = (geoJson.features || []).map((feature) => {
      const id = feature.properties?.boundary_id || feature.id;
      const bbox = getFeatureBounds(feature);
      feature.id = id;
      feature.bbox = bbox;
      feature.properties = {
        ...feature.properties,
        bbox,
        center:
          feature.properties?.center ||
          (bbox ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] : undefined),
      };
      return id;
    });
    source.setData(geoJson);
    if (level === 1 && map.getLayer(LEVEL_META[1].fill)) {
      map.setLayoutProperty(LEVEL_META[1].fill, "visibility", "visible");
      map.setLayoutProperty(LEVEL_META[1].line, "visibility", "visible");
    }
  }, []);

  const loadBoundaryFile = useCallback(async (level, path) => {
    if (!path) return EMPTY_COLLECTION;
    const cacheKey = `${level}:${path}`;
    if (loadedFilesRef.current[cacheKey]) return loadedFilesRef.current[cacheKey];
    setLoadingBoundary(true);
    try {
      const data = await fetch(`${BOUNDARY_BASE}/${path}`).then((response) => response.json());
      data.features = (data.features || []).map((feature) => {
        const bbox = getFeatureBounds(feature);
        return {
          ...feature,
          id: feature.properties?.boundary_id || feature.id,
          bbox,
          properties: {
            ...feature.properties,
            bbox,
            center:
              feature.properties?.center ||
              (bbox ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] : undefined),
          },
        };
      });
      loadedFilesRef.current[cacheKey] = data;
      return data;
    } finally {
      setLoadingBoundary(false);
    }
  }, []);

  const fitToBoundary = useCallback((item, fallbackZoom) => {
    const map = mapRef.current;
    if (!map || !item) return;
    const bounds = getBounds(item.bbox);
    if (bounds) {
      map.fitBounds(bounds, { padding: 22, duration: 900, maxZoom: fallbackZoom });
    } else {
      map.easeTo({ center: getCenter(item), zoom: fallbackZoom, duration: 850 });
    }
  }, []);

  const selectBoundary = useCallback(
    async (item, level) => {
      if (!item || !indexRef.current) return;
      const map = mapRef.current;

      if (map?.getSource(LEVEL_META[level].source)) {
        clearLayerSelection(map, featureIdsByLevel, 1);
        clearLayerSelection(map, featureIdsByLevel, 2);
        clearLayerSelection(map, featureIdsByLevel, 3);
      }

      const boundaryId = item.boundary_id || `admin-${level}-${item.id}`;
      setSvgSelectedId(boundaryId);
      if (map?.getSource(LEVEL_META[level].source)) {
        map.setFeatureState(
          { source: LEVEL_META[level].source, id: boundaryId },
          { selected: true },
        );
      }

      setSelected({ ...item, admin_leve: level, boundary_id: boundaryId });
      setSelectedPin(null);
      let focusItem = item;
      let focusLevel = level;

      if (level === 1) {
        setSelectedPath({ region: item, district: null, mahalla: null });
        setLevel3Features([]);
        setSourceData(3, EMPTY_COLLECTION, false);
        const path =
          indexRef.current.files?.["2"]?.[String(item.id)] || `level2/${item.id}.geojson`;
        const geoJson = await loadBoundaryFile(2, path);
        setSourceData(2, geoJson);
        setVisibleGeoJson(geoJson);
        setSvgViewport({ scale: 1, x: 0, y: 0 });
        setSvgHoveredId("");
      }

      if (level === 2) {
        const region = (indexRef.current.levels?.["1"] || []).find(
          (regionItem) => String(regionItem.id) === String(item.parent_id),
        );
        setSelectedPath({ region, district: item, mahalla: null });
        const path =
          indexRef.current.files?.["3"]?.[String(item.id)] || `level3/${item.id}.geojson`;
        const geoJson = await loadBoundaryFile(3, path);
        setLevel3Features(geoJson.features || []);
        setSourceData(3, geoJson);
        setVisibleGeoJson(geoJson);
        setSvgViewport({ scale: 1, x: 0, y: 0 });
      }

      if (level === 3) {
        const district = (indexRef.current.levels?.["2"] || []).find(
          (districtItem) => String(districtItem.id) === String(item.parent_id),
        );
        const region = (indexRef.current.levels?.["1"] || []).find(
          (regionItem) => String(regionItem.id) === String(district?.parent_id),
        );
        setSelectedPath({ region, district, mahalla: item });
        focusItem = item;
        focusLevel = 3;
        const selectedFeature = featureFromItem(item);
        if (selectedFeature) {
          setVisibleGeoJson(collectionFromFeatures([selectedFeature]));
        }
        setSvgViewport({ scale: 1, x: 0, y: 0 });
      }

      fitToBoundary(focusItem, LEVEL_META[focusLevel].zoom);
    },
    [fitToBoundary, loadBoundaryFile, setSourceData],
  );

  const resetToCountry = useCallback(() => {
    setSelected(null);
    setSelectedPin(null);
    setSelectedPath({ region: null, district: null, mahalla: null });
    setSvgSelectedId("");
    setSvgHoveredId("");
    hoveredSvgRef.current = null;
    setLevel3Features([]);
    setSvgViewport({ scale: 1, x: 0, y: 0 });
    setSourceData(1, level1GeoJsonRef.current || EMPTY_COLLECTION);
    setSourceData(2, EMPTY_COLLECTION, false);
    setSourceData(3, EMPTY_COLLECTION, false);
    const fullBounds = getBounds(getCollectionBounds(level1GeoJsonRef.current));
    if (fullBounds && mapRef.current) {
      mapRef.current.fitBounds(fullBounds, { padding: 18, duration: 850, maxZoom: 5.1 });
    } else {
      mapRef.current?.easeTo({ center: [64.5853, 41.3775], zoom: 4.65, duration: 800 });
    }
  }, [setSourceData]);

  const loadRows = useCallback(async () => {
    setLoadingRows(true);
    try {
      const [analysisResult, researchResult] = await Promise.allSettled([
        AdminApi.analyses.list({ page: 1, page_size: 500, pageSize: 500 }),
        ResearchApi.list({ page: 1, page_size: 500, pageSize: 500 }),
      ]);
      if (analysisResult.status === "fulfilled") {
        const value = analysisResult.value;
        setAnalyses(Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : []);
      }
      if (researchResult.status === "fulfilled") {
        const value = researchResult.value;
        setResearchRecords(
          Array.isArray(value?.items)
            ? value.items
            : Array.isArray(value?.data)
              ? value.data
              : Array.isArray(value)
                ? value
                : [],
        );
      }
    } catch (error) {
      console.error("Regional map rows error:", error);
    } finally {
      setLoadingRows(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch(`${BOUNDARY_BASE}/index.json`).then((response) => response.json()),
      fetch(`${BOUNDARY_BASE}/level1-preview.geojson`).then((response) => response.json()),
    ])
      .then(([index, level1]) => {
        if (!mounted) return;
        indexRef.current = index;
        level1GeoJsonRef.current = level1;
        setCountryBbox(getCollectionBounds(level1));
        setBoundaryIndex(index);
        setVisibleGeoJson(level1);
        setMapReady(true);
      })
      .catch((error) => {
        console.error("Boundary preview load error:", error);
        if (mounted) setMapReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [64.5853, 41.3775],
      zoom: 4.65,
      minZoom: 4,
      maxZoom: 15,
      attributionControl: false,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "map-background",
            type: "background",
            paint: {
              "background-color": mapColors.background,
            },
          },
        ],
      },
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", async () => {
      map.addSource(PIN_SOURCE, { type: "geojson", data: EMPTY_COLLECTION });
      addBoundaryLayers(map, 1, null, isDark);
      addBoundaryLayers(map, 2, null, isDark);
      addBoundaryLayers(map, 3, null, isDark);

      map.addLayer({
        id: "regional-pin-halo",
        type: "circle",
        source: PIN_SOURCE,
        paint: {
          "circle-radius": 12,
          "circle-color": [
            "match",
            ["get", "type"],
            "admin",
            PIN_COLORS.admin,
            "researcher",
            PIN_COLORS.researcher,
            PIN_COLORS.analysis,
          ],
          "circle-opacity": 0.18,
        },
      });
      map.addLayer({
        id: "regional-pins",
        type: "circle",
        source: PIN_SOURCE,
        paint: {
          "circle-radius": ["match", ["get", "type"], "admin", 6.5, "researcher", 5.5, 4.5],
          "circle-color": [
            "match",
            ["get", "type"],
            "admin",
            PIN_COLORS.admin,
            "researcher",
            PIN_COLORS.researcher,
            PIN_COLORS.analysis,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.8,
          "circle-opacity": 0.94,
        },
      });

      [1, 2, 3].forEach((level) => {
        map.on("mousemove", LEVEL_META[level].fill, (event) => {
          map.getCanvas().style.cursor = "pointer";
          const id = event.features?.[0]?.properties?.boundary_id || event.features?.[0]?.id;
          if (!id) return;
          if (hoveredRef.current.id && hoveredRef.current.id !== id) {
            map.setFeatureState(
              { source: LEVEL_META[hoveredRef.current.level].source, id: hoveredRef.current.id },
              { hover: false },
            );
          }
          hoveredRef.current = { level, id };
          map.setFeatureState({ source: LEVEL_META[level].source, id }, { hover: true });
        });
        map.on("mouseleave", LEVEL_META[level].fill, () => {
          map.getCanvas().style.cursor = "";
          if (hoveredRef.current.id) {
            map.setFeatureState(
              { source: LEVEL_META[hoveredRef.current.level].source, id: hoveredRef.current.id },
              { hover: false },
            );
          }
          hoveredRef.current = { level: null, id: null };
        });
        map.on("click", LEVEL_META[level].fill, (event) => {
          const props = event.features?.[0]?.properties;
          if (!props) return;
          const id = Number(props.id);
          const fromIndex =
            level < 3
              ? (indexRef.current?.levels?.[String(level)] || []).find(
                  (item) => Number(item.id) === id,
                )
              : level3FeaturesRef.current.find((feature) => Number(feature.properties?.id) === id)
                  ?.properties;
          selectBoundary(
            fromIndex || {
              ...props,
              id,
              parent_id: Number(props.parent_id),
              admin_leve: Number(props.admin_leve),
              bbox: parseMaybeJson(props.bbox),
              center: parseMaybeJson(props.center),
              geometry: event.features?.[0]?.geometry,
            },
            level,
          );
        });
      });

      map.on("click", "regional-pins", (event) => {
        event.preventDefault();
        const props = event.features?.[0]?.properties;
        if (!props) return;
        setSelectedPin(props);
        map.easeTo({
          center: event.features[0].geometry.coordinates,
          zoom: Math.max(map.getZoom(), 10),
          duration: 700,
        });
      });

      const [index, level1] = await Promise.all([
        fetch(`${BOUNDARY_BASE}/index.json`).then((response) => response.json()),
        fetch(`${BOUNDARY_BASE}/level1-preview.geojson`).then((response) => response.json()),
      ]);
      indexRef.current = index;
      level1GeoJsonRef.current = level1;
      setCountryBbox(getCollectionBounds(level1));
      setBoundaryIndex(index);
      setSourceData(1, level1);
      setMapReady(true);
      const fullBounds = getBounds(getCollectionBounds(level1));
      if (fullBounds) {
        map.resize();
        map.fitBounds(fullBounds, { padding: 18, duration: 0, maxZoom: 5.1 });
      }
      setTimeout(() => map.resize(), 80);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // MapLibre instance is intentionally initialized once; live source data is updated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource(PIN_SOURCE);
    if (source) source.setData(pinsGeoJson);
  }, [pinsGeoJson]);

  const zoomToSelected = () => {
    if (selected) {
      fitToBoundary(selected, LEVEL_META[selected.admin_leve]?.zoom || 6);
      return;
    }
    resetToCountry();
  };

  const handleMapWheel = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const cursor = point.matrixTransform(svg.getScreenCTM().inverse());
    const zoomFactor = event.deltaY < 0 ? 1.18 : 1 / 1.18;
    setSvgViewport((current) => {
      const currentScale = Math.max(current.scale || 1, 1);
      const nextScale = Math.min(Math.max(currentScale * zoomFactor, 1), 240);
      if (nextScale === 1) return { scale: 1, x: 0, y: 0 };
      const currentMinX = -current.x / currentScale;
      const currentMinY = -current.y / currentScale;
      const currentWidth = SVG_WIDTH / currentScale;
      const currentHeight = SVG_HEIGHT / currentScale;
      const nextWidth = SVG_WIDTH / nextScale;
      const nextHeight = SVG_HEIGHT / nextScale;
      const cursorRatioX = (cursor.x - currentMinX) / currentWidth;
      const cursorRatioY = (cursor.y - currentMinY) / currentHeight;
      const nextMinX = cursor.x - cursorRatioX * nextWidth;
      const nextMinY = cursor.y - cursorRatioY * nextHeight;
      return {
        scale: nextScale,
        x: -nextMinX * nextScale,
        y: -nextMinY * nextScale,
      };
    });
  }, []);

  const handleMapPointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const target = event.target.closest?.("[data-boundary-id]");
      panDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        width: rect.width,
        height: rect.height,
        viewport: svgViewport,
        moved: false,
        boundaryId: target?.dataset?.boundaryId || "",
        level: Number(target?.dataset?.level || 0),
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [svgViewport],
  );

  const handleMapPointerMove = useCallback((event) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    setSvgViewport({
      ...drag.viewport,
      x: drag.viewport.x + (dx * SVG_WIDTH) / Math.max(drag.width, 1),
      y: drag.viewport.y + (dy * SVG_HEIGHT) / Math.max(drag.height, 1),
    });
  }, []);

  const handleMapPointerUp = useCallback(
    (event) => {
      const drag = panDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (drag.moved) {
        suppressSvgClickRef.current = true;
        window.setTimeout(() => {
          suppressSvgClickRef.current = false;
        }, 0);
      } else if (drag.boundaryId && drag.level) {
        const feature = (visibleGeoJson?.features || []).find(
          (item) => (item.properties?.boundary_id || item.id) === drag.boundaryId,
        );
        const props = feature?.properties || {};
        if (feature) {
          selectBoundary(
            {
              ...props,
              id: Number(props.id),
              parent_id: Number(props.parent_id),
              admin_leve: drag.level,
              bbox: getFeatureBounds(feature),
              center: parseMaybeJson(props.center),
              boundary_id: drag.boundaryId,
              geometry: feature.geometry,
            },
            drag.level,
          );
        }
      }
      panDragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [selectBoundary, visibleGeoJson],
  );

  const svgViewBox = useMemo(() => {
    const scale = Math.max(svgViewport.scale || 1, 1);
    return [
      -svgViewport.x / scale,
      -svgViewport.y / scale,
      SVG_WIDTH / scale,
      SVG_HEIGHT / scale,
    ].join(" ");
  }, [svgViewport]);

  useEffect(() => {
    const node = mapInteractionRef.current;
    if (!node) return undefined;
    node.addEventListener("wheel", handleMapWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", handleMapWheel);
    };
  }, [handleMapWheel]);

  const breadcrumbItems = useMemo(
    () =>
      [
        { label: "O'zbekiston", onClick: resetToCountry, active: !selected },
        selectedPath.region && {
          label: featureName(selectedPath.region),
          onClick: () => selectBoundary(selectedPath.region, 1),
          active: selected?.admin_leve === 1,
        },
        selectedPath.district && {
          label: featureName(selectedPath.district),
          onClick: () => selectBoundary(selectedPath.district, 2),
          active: selected?.admin_leve === 2,
        },
        selectedPath.mahalla && {
          label: featureName(selectedPath.mahalla),
          onClick: () => selectBoundary(selectedPath.mahalla, 3),
          active: selected?.admin_leve === 3,
        },
      ].filter(Boolean),
    [resetToCountry, selectBoundary, selected, selectedPath],
  );

  const childCount = useMemo(() => {
    if (!selected) return boundaryIndex?.levels?.["1"]?.length || 0;
    if (selected.admin_leve === 1)
      return (boundaryIndex?.levels?.["2"] || []).filter(
        (item) => String(item.parent_id) === String(selected.id),
      ).length;
    if (selected.admin_leve === 2) return level3Features.length;
    return 0;
  }, [boundaryIndex, level3Features, selected]);

  const chartRows = useMemo(
    () => [
      { label: "Analiz", value: selectedMetric.analyses || 0, color: "#0f766e" },
      { label: "Admin", value: selectedMetric.admins || 0, color: "#2563eb" },
      { label: "Izlanuvchi", value: selectedMetric.researchers || 0, color: "#7c3aed" },
    ],
    [selectedMetric],
  );

  const chartMax = Math.max(...chartRows.map((row) => row.value), 1);

  const clinicalChartData = useMemo(() => {
    const clinicalRows = selectedRecords.filter((row) => row.__type !== "admin");
    const bmiValues = clinicalRows
      .map((row) => getNumericValue(row, ["bmi", "analysis.bmi", "result.bmi", "metrics.bmi"]))
      .filter((value) => value !== null);
    const zValues = clinicalRows
      .map((row) =>
        getNumericValue(row, [
          "z_score",
          "zScore",
          "bmi_z_score",
          "z_bmi",
          "analysis.z_score",
          "result.z_score",
        ]),
      )
      .filter((value) => value !== null);

    const bmiRows = [
      { label: "Kam vazn", value: bmiValues.filter((v) => v < 18.5).length, color: "#3b82f6" },
      {
        label: "Norma",
        value: bmiValues.filter((v) => v >= 18.5 && v < 25).length,
        color: "#0f766e",
      },
      {
        label: "Ortiqcha",
        value: bmiValues.filter((v) => v >= 25 && v < 30).length,
        color: "#f59e0b",
      },
      { label: "Semizlik", value: bmiValues.filter((v) => v >= 30).length, color: "#dc2626" },
    ];
    const zRows = [
      { label: "Z < -2", value: zValues.filter((v) => v < -2).length, color: "#3b82f6" },
      {
        label: "-2 .. +1",
        value: zValues.filter((v) => v >= -2 && v <= 1).length,
        color: "#0f766e",
      },
      { label: "+1 .. +2", value: zValues.filter((v) => v > 1 && v <= 2).length, color: "#f59e0b" },
      { label: "Z > +2", value: zValues.filter((v) => v > 2).length, color: "#dc2626" },
    ];
    const avgBmi = bmiValues.length
      ? bmiValues.reduce((sum, value) => sum + value, 0) / bmiValues.length
      : 0;
    const avgZ = zValues.length
      ? zValues.reduce((sum, value) => sum + value, 0) / zValues.length
      : 0;
    return {
      bmiRows,
      zRows,
      maxBmi: Math.max(...bmiRows.map((row) => row.value), 1),
      maxZ: Math.max(...zRows.map((row) => row.value), 1),
      indexRows: [
        { label: "BMI", short: "BMI", value: Math.min((avgBmi / 35) * 100, 100), color: "#2563eb" },
        {
          label: "Z-score",
          short: "Z",
          value: Math.min(((avgZ + 3) / 6) * 100, 100),
          color: "#7c3aed",
        },
        {
          label: "Risk",
          short: "Risk",
          value: Math.min(
            selectedMetric.riskRate || pct(bmiRows[3].value + zRows[3].value, clinicalRows.length),
            100,
          ),
          color: getRiskColor(selectedMetric.riskRate || 0),
        },
        {
          label: "Qamrov",
          short: "Qam",
          value: Math.min(pct(clinicalRows.length, Math.max(childCount, 1)), 100),
          color: "#0f766e",
        },
      ],
      sampleCount: clinicalRows.length,
    };
  }, [childCount, selectedMetric.riskRate, selectedRecords]);

  const analyticsCards = useMemo(
    () => [
      {
        label: "Qamrov indeksi",
        value: `${Math.min(
          Math.round(((selectedRecords.length || 0) / Math.max(childCount, 1)) * 10),
          100,
        )}%`,
        color: "#0f766e",
      },
      {
        label: "Aloqa nuqtalari",
        value: pinFeatures.length,
        color: "#2563eb",
      },
      {
        label: "Risk yozuvlari",
        value: selectedMetric.risk || 0,
        color: getRiskColor(selectedMetric.riskRate || 0),
      },
      {
        label: "Quyi qatlam",
        value: childCount,
        color: "#f59e0b",
      },
    ],
    [childCount, pinFeatures.length, selectedMetric, selectedRecords.length],
  );

  const analyticalRows = useMemo(
    () => [
      {
        label: "Analiz ulushi",
        value: selectedMetric.analyses || 0,
        total: selectedRecords.length,
        color: "#0f766e",
      },
      {
        label: "Admin faolligi",
        value: selectedMetric.admins || 0,
        total: selectedRecords.length,
        color: "#2563eb",
      },
      {
        label: "Izlanuvchi bazasi",
        value: selectedMetric.researchers || 0,
        total: selectedRecords.length,
        color: "#7c3aed",
      },
      {
        label: "Hududiy zichlik",
        value: childCount,
        total: selected ? 120 : boundaryIndex?.counts?.["2"] || 206,
        color: "#f59e0b",
      },
    ],
    [boundaryIndex, childCount, selected, selectedMetric, selectedRecords.length],
  );

  const levelLabel = selected ? LEVEL_META[selected.admin_leve]?.label : "O'zbekiston";

  const handleChat = (pin = selectedPin) => {
    window.dispatchEvent(new CustomEvent("close-ai-chat"));
    toast.success(
      pin?.name
        ? `${pin.name} bilan aloqa uchun chat oynasini oching`
        : "Chat oynasi orqali admin yoki izlanuvchiga yozishingiz mumkin",
    );
  };

  const loading = !mapReady || loadingBoundary;
  const dataLoading = loadingRows || statsLoading;

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          p: 2.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: isDark ? "rgba(148,163,184,0.18)" : "rgba(15,118,110,0.16)",
          bgcolor: isDark ? "rgba(15,23,42,0.78)" : "rgba(255,255,255,0.96)",
        }}
      >
        <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Public color="primary" />
              <Typography variant="h4" fontWeight={900}>
                Hududiy tahlil xaritasi
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Viloyat, tuman va mahalla kesimida analizlar, adminlar va izlanuvchilar holatini
              kuzating.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <StatPill label="Viloyat" value={boundaryIndex?.counts?.["1"] || 14} color="#0f766e" />
            <StatPill label="Tuman" value={boundaryIndex?.counts?.["2"] || 206} color="#f59e0b" />
            <StatPill
              label="Mahalla"
              value={boundaryIndex?.counts?.["3"] || 8991}
              color="#7c3aed"
            />
            {dataLoading && <Chip label="Analitika yuklanmoqda" sx={{ fontWeight: 800 }} />}
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 390px" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            height: { xs: 720, lg: 900 },
            minHeight: 680,
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: mapColors.background,
          }}
        >
          <Box
            ref={mapContainerRef}
            sx={{ position: "absolute", inset: 0, opacity: 0.01, pointerEvents: "none" }}
          />
          <Box
            ref={mapInteractionRef}
            onPointerDown={handleMapPointerDown}
            onPointerMove={handleMapPointerMove}
            onPointerUp={handleMapPointerUp}
            onPointerCancel={handleMapPointerUp}
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              bgcolor: mapColors.background,
              overscrollBehavior: "contain",
              touchAction: "none",
              cursor: panDragRef.current ? "grabbing" : "grab",
              "@keyframes svgLayerFade": {
                "0%": { opacity: 0.42 },
                "100%": { opacity: 1 },
              },
            }}
          >
            <svg
              ref={svgRef}
              viewBox={svgViewBox}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
              role="img"
              aria-label="O'zbekiston hududiy xaritasi"
              style={{ shapeRendering: "geometricPrecision" }}
            >
              <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill={mapColors.background} />
              <text
                x={SVG_WIDTH / 2}
                y={SVG_HEIGHT / 2}
                textAnchor="middle"
                fill={mapColors.label}
                opacity="0.12"
                fontSize="20"
                fontWeight="800"
              >
                UZBEKISTAN
              </text>
              <g>
                <g
                  key={`${svgMap.features.length}-${selected?.admin_leve || 0}-${svgSelectedId}`}
                  style={{ animation: "svgLayerFade 260ms ease-out both" }}
                >
                  {svgMap.features.map((feature) => {
                    const props = feature.properties || {};
                    const level = Number(props.admin_leve || 1);
                    const boundaryId = props.boundary_id || feature.id;
                    const active = boundaryId === svgSelectedId;
                    const hovered = boundaryId === svgHoveredId;
                    const path = geometryToPath(feature.geometry, svgMap.project);
                    if (!path) return null;
                    const item = {
                      ...props,
                      id: Number(props.id),
                      parent_id: Number(props.parent_id),
                      admin_leve: level,
                      bbox: parseMaybeJson(props.bbox || feature.bbox),
                      center: parseMaybeJson(props.center),
                      boundary_id: boundaryId,
                      geometry: feature.geometry,
                    };
                    return (
                      <path
                        key={boundaryId}
                        data-boundary-id={boundaryId}
                        data-level={level}
                        d={path}
                        fill={getSvgFill(level, active, hovered)}
                        fillOpacity={level === 1 ? (active ? 0.94 : 0.78) : active ? 0.68 : 0.4}
                        stroke={mapColors.stroke}
                        strokeWidth={active ? (level === 1 ? 2.2 : 1.5) : level === 1 ? 1.15 : 0.85}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        shapeRendering="geometricPrecision"
                        paintOrder="fill stroke"
                        style={{
                          cursor: "pointer",
                          transition:
                            "fill 180ms ease, fill-opacity 180ms ease, stroke-width 180ms ease",
                        }}
                        onMouseEnter={() => {
                          hoveredSvgRef.current = { item, level };
                          setSvgHoveredId(boundaryId);
                        }}
                        onMouseLeave={() => {
                          hoveredSvgRef.current = null;
                          setSvgHoveredId("");
                        }}
                        onClick={() => {
                          if (suppressSvgClickRef.current) return;
                          selectBoundary(item, level);
                        }}
                      />
                    );
                  })}
                </g>
                <g pointerEvents="none">
                  {svgLabels.map((label) => (
                    <text
                      key={`label-${label.id}`}
                      x={label.x}
                      y={label.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={mapColors.label}
                      stroke={mapColors.labelHalo}
                      strokeWidth={label.active ? 1.8 : 1.15}
                      paintOrder="stroke fill"
                      fontSize={label.size}
                      fontWeight={label.active ? 850 : label.level === 1 ? 780 : 700}
                      opacity={label.active ? 0.88 : label.level === 3 ? 0.42 : 0.56}
                      style={{
                        textShadow: isDark
                          ? "0 1px 1px rgba(0,0,0,0.22)"
                          : "0 1px 1px rgba(255,255,255,0.28)",
                        userSelect: "none",
                      }}
                    >
                      {label.label}
                    </text>
                  ))}
                </g>
                <g pointerEvents="none">
                  {svgMap.features.map((feature) => {
                    const props = feature.properties || {};
                    const level = Number(props.admin_leve || 1);
                    const boundaryId = props.boundary_id || feature.id;
                    const active = boundaryId === svgSelectedId;
                    const hovered = boundaryId === svgHoveredId;
                    const path = geometryToPath(feature.geometry, svgMap.project);
                    if (!path) return null;
                    return (
                      <path
                        key={`line-${boundaryId}`}
                        d={path}
                        fill="none"
                        stroke={active || hovered ? mapColors.label : mapColors.stroke}
                        strokeOpacity={active ? 1 : hovered ? 0.92 : 0.78}
                        strokeWidth={active ? 2.35 : level === 1 ? 1.25 : level === 2 ? 1 : 0.78}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        shapeRendering="geometricPrecision"
                      />
                    );
                  })}
                </g>
              </g>
            </svg>
          </Box>
          {loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: isDark ? "rgba(2,6,23,0.56)" : "rgba(248,250,252,0.48)",
                zIndex: 4,
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <CircularProgress />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Hududiy qatlam yuklanmoqda
                </Typography>
              </Stack>
            </Box>
          )}

          <Paper
            elevation={0}
            sx={{
              position: "absolute",
              left: 16,
              top: 16,
              zIndex: 3,
              maxWidth: "calc(100% - 96px)",
              p: 1,
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: isDark ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.1)",
              bgcolor: isDark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.94)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
              {breadcrumbItems.map((item, index) => (
                <React.Fragment key={item.label}>
                  {index > 0 && (
                    <Typography variant="caption" color="text.secondary" fontWeight={900}>
                      /
                    </Typography>
                  )}
                  <Button
                    size="small"
                    onClick={item.onClick}
                    variant={item.active ? "contained" : "text"}
                    sx={{
                      minWidth: 0,
                      px: 1,
                      py: 0.35,
                      borderRadius: 1,
                      textTransform: "none",
                      fontWeight: 900,
                      maxWidth: { xs: 140, sm: 220 },
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </Button>
                </React.Fragment>
              ))}
            </Stack>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" mt={0.75}>
              <Chip
                size="small"
                label="Viloyat"
                sx={{ bgcolor: mapColors.region, color: "#fff", fontWeight: 800 }}
              />
              <Chip
                size="small"
                label="Tuman"
                sx={{ bgcolor: mapColors.district, color: "#fff", fontWeight: 800 }}
              />
              <Chip
                size="small"
                label="Mahalla"
                sx={{ bgcolor: mapColors.mahalla, color: "#fff", fontWeight: 800 }}
              />
              <Chip
                size="small"
                icon={<LocationOn />}
                label="Pin"
                sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 800 }}
              />
            </Stack>
          </Paper>
          <Tooltip title="Tanlangan hududga qaytish">
            <IconButton
              onClick={zoomToSelected}
              sx={{
                position: "absolute",
                right: 16,
                bottom: 16,
                zIndex: 3,
                bgcolor: "background.paper",
                boxShadow: 3,
                "&:hover": { bgcolor: "background.paper" },
              }}
            >
              <MyLocation />
            </IconButton>
          </Tooltip>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            height: { xs: "auto", lg: 900 },
            overflow: "hidden",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: isDark ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.98)",
          }}
        >
          <Box sx={{ p: 2.25, height: "100%", overflowY: "auto" }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1}
            >
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={900}>
                  {levelLabel}
                </Typography>
                <Typography variant="h5" fontWeight={900}>
                  {selected ? featureName(selected) : "O'zbekiston"}
                </Typography>
                {selectedPath.region && (
                  <Typography variant="caption" color="text.secondary">
                    {[selectedPath.region, selectedPath.district, selectedPath.mahalla]
                      .filter(Boolean)
                      .map(featureName)
                      .join(" / ")}
                  </Typography>
                )}
              </Box>
              {selectedPin && (
                <IconButton size="small" onClick={() => setSelectedPin(null)}>
                  <Close fontSize="small" />
                </IconButton>
              )}
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={2}>
              <StatPill label="Analiz" value={selectedMetric.analyses || 0} color="#0f766e" />
              <StatPill label="Admin" value={selectedMetric.admins || 0} color="#2563eb" />
              <StatPill
                label="Izlanuvchi"
                value={selectedMetric.researchers || 0}
                color="#7c3aed"
              />
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={1}>
              <StatPill label="Keyingi qatlam" value={childCount} color="#f59e0b" />
              <StatPill
                label="Maydon"
                value={formatArea(selected?.total_area)}
                color="text.primary"
              />
            </Stack>

            <Box mt={2.25}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
                <Typography variant="body2" fontWeight={900}>
                  Klinik risk signali
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={900}
                  sx={{ color: getRiskColor(selectedMetric.riskRate || 0) }}
                >
                  {selectedMetric.riskRate || 0}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(selectedMetric.riskRate || 0, 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: "rgba(100,116,139,0.14)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: getRiskColor(selectedMetric.riskRate || 0),
                  },
                }}
              />
            </Box>

            {selectedPin && (
              <Box
                mt={2.5}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "primary.main",
                  bgcolor: isDark ? "rgba(37,99,235,0.14)" : "rgba(37,99,235,0.06)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <LocationOn sx={{ color: PIN_COLORS[selectedPin.type] || "#2563eb" }} />
                  <Typography variant="h6" fontWeight={900}>
                    {selectedPin.name}
                  </Typography>
                </Stack>
                <Stack spacing={0.7}>
                  <Typography variant="body2">
                    <strong>Rol:</strong> {selectedPin.role || selectedPin.type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Hudud:</strong>{" "}
                    {[selectedPin.region, selectedPin.district].filter(Boolean).join(" / ")}
                  </Typography>
                  {(selectedPin.email || selectedPin.phone) && (
                    <Typography variant="body2">
                      <strong>Aloqa:</strong>{" "}
                      {[selectedPin.email, selectedPin.phone].filter(Boolean).join(" / ")}
                    </Typography>
                  )}
                  {selectedPin.address && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedPin.address}
                    </Typography>
                  )}
                </Stack>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ChatBubbleOutline />}
                  onClick={() => handleChat(selectedPin)}
                  sx={{ mt: 1.5, borderRadius: 1.5, textTransform: "none", fontWeight: 800 }}
                >
                  Chat ochish
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 2.25 }} />

            <Typography variant="h6" fontWeight={900} mb={1.25}>
              Ilmiy klinik profil
            </Typography>
            <Stack spacing={1.2}>
              <ScientificIndexChart rows={clinicalChartData.indexRows} />
              <ScientificBarChart
                title="BMI taqsimoti"
                subtitle={`Hudud bo'yicha n=${clinicalChartData.sampleCount}`}
                rows={clinicalChartData.bmiRows}
                maxValue={clinicalChartData.maxBmi}
              />
              <ScientificBarChart
                title="BMI Z-score bandlari"
                subtitle="WHO LMS bo'yicha klinik guruhlash"
                rows={clinicalChartData.zRows}
                maxValue={clinicalChartData.maxZ}
              />
            </Stack>

            <Divider sx={{ my: 2.25 }} />

            <Typography variant="h6" fontWeight={900} mb={1.25}>
              Tahliliy indikatorlar
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
              }}
            >
              {analyticsCards.map((card) => (
                <Box
                  key={card.label}
                  sx={{
                    p: 1.4,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: isDark ? "rgba(15,23,42,0.74)" : "rgba(248,250,252,0.92)",
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>
                    {card.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ color: card.color }}>
                    {card.value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box mt={2.25}>
              <Typography variant="h6" fontWeight={900} mb={1.25}>
                Faoliyat tarkibi
              </Typography>
              <Stack spacing={1.2}>
                {chartRows.map((row) => (
                  <Box key={row.label}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary" fontWeight={900}>
                        {row.label}
                      </Typography>
                      <Typography variant="caption" fontWeight={900}>
                        {row.value}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        height: 9,
                        borderRadius: 4.5,
                        bgcolor: "rgba(100,116,139,0.14)",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          height: "100%",
                          width: `${Math.max((row.value / chartMax) * 100, row.value ? 8 : 0)}%`,
                          bgcolor: row.color,
                          borderRadius: 4.5,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Divider sx={{ my: 2.25 }} />

            <Typography variant="h6" fontWeight={900} mb={1.25}>
              Operatsion tahlil
            </Typography>
            <Stack spacing={1.35}>
              {analyticalRows.map((row) => {
                const percent = Math.min(
                  Math.round((row.value / Math.max(row.total, 1)) * 100),
                  100,
                );
                return (
                  <Box key={row.label}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" color="text.secondary" fontWeight={900}>
                        {row.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={900}>
                        {percent}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: "rgba(100,116,139,0.14)",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: row.color,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
