"use client";

import { useState, useRef, useEffect } from "react";

// Allow override via NEXT_PUBLIC_QUOTE_API_URL so branch previews can hit a matching backend preview.
// Falls back to the live production endpoint for main + local dev.
const QUOTE_API =
  process.env.NEXT_PUBLIC_QUOTE_API_URL ||
  "https://quotes.johnsontileinstallation.com/api/quote/request";
const PHOTO_API =
  process.env.NEXT_PUBLIC_PHOTO_API_URL ||
  "https://quotes.johnsontileinstallation.com/api/quote/photos";
const PHOTO_STAGE_API = PHOTO_API.replace(/\/photos$/, "/photos-stage");

// ---------------------------------------------------------------------------
// Client-side image compression (Canvas-based, zero dependencies).
// Resizes large photos and re-encodes as JPEG to stay well under the Vercel
// Hobby plan 4.5 MB serverless body limit. Target: ≤ 3 MB output.
// ---------------------------------------------------------------------------
const COMPRESS_MAX_DIMENSION = 2400; // px — longest edge after resize
const COMPRESS_TARGET_BYTES = 3 * 1024 * 1024; // 3 MB
const COMPRESS_INITIAL_QUALITY = 0.82;
const COMPRESS_MIN_QUALITY = 0.5;

function compressImage(file: File): Promise<File> {
  // Skip non-image or already-tiny files
  if (!file.type.startsWith("image/") && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
    return Promise.resolve(file);
  }
  if (file.size <= COMPRESS_TARGET_BYTES) {
    return Promise.resolve(file);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate scaled dimensions (keep aspect ratio)
      let { width, height } = img;
      if (width > COMPRESS_MAX_DIMENSION || height > COMPRESS_MAX_DIMENSION) {
        const ratio = Math.min(COMPRESS_MAX_DIMENSION / width, COMPRESS_MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);

      // Iteratively lower quality until under target size
      let quality = COMPRESS_INITIAL_QUALITY;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size <= COMPRESS_TARGET_BYTES || quality <= COMPRESS_MIN_QUALITY) {
              const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: file.lastModified,
              });
              console.log(
                `[compressImage] ${file.name}: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressed.size / 1024 / 1024).toFixed(1)}MB (q=${quality.toFixed(2)}, ${width}x${height})`
              );
              resolve(compressed);
            } else {
              quality -= 0.08;
              tryCompress();
            }
          },
          "image/jpeg",
          quality
        );
      };
      tryCompress();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original if we can't decode it
    };
    img.src = url;
  });
}

const PROJECT_TYPES = [
  "Bathroom Remodel",
  "Shower",
  "Tub Surround",
  "Floor Tile",
  "Backsplash Tile",
  "Tile Repair",
  "Other",
];

// Features available per project type
const FEATURES_BY_PROJECT: Record<string, string[]> = {
  "Bathroom Remodel": [
    "Niche (built-in shelf)",
    "Corner Bench",
    "Floating Corner Bench",
    "Corner Shelf",
    "Custom Curb",
    "Curbless Entry",
  ],
  "Shower": [
    "Niche (built-in shelf)",
    "Corner Bench",
    "Floating Corner Bench",
    "Corner Shelf",
    "Custom Curb",
    "Curbless Entry",
  ],
  "Tub Surround": [
    "Niche (built-in shelf)",
    "Corner Shelf",
  ],
  "Floor Tile": [],
  "Backsplash Tile": [],
  "Tile Repair": [],
  "Other": [
    "Niche (built-in shelf)",
    "Corner Bench",
    "Floating Corner Bench",
    "Corner Shelf",
    "Custom Curb",
    "Curbless Entry",
  ],
};

// Area types available per project type
const AREA_TYPES_BY_PROJECT: Record<string, { key: string; label: string }[]> = {
  "Bathroom Remodel": [
    { key: "bathroom_floor", label: "Bathroom Floor" },
    { key: "shower_floor", label: "Shower Floor" },
    { key: "shower_walls", label: "Shower Walls" },
    { key: "shower_ceiling", label: "Shower Ceiling" },
    { key: "bathroom_walls", label: "Bathroom Walls" },
    { key: "tub_surround_walls", label: "Tub Surround Walls" },
    { key: "backsplash", label: "Backsplash" },
  ],
  "Shower": [
    { key: "shower_floor", label: "Shower Floor" },
    { key: "shower_walls", label: "Shower Walls" },
    { key: "shower_ceiling", label: "Shower Ceiling" },
  ],
  "Tub Surround": [
    { key: "tub_surround_walls", label: "Tub Surround Walls" },
  ],
  "Floor Tile": [
    { key: "floor", label: "Floor" },
    { key: "bathroom_floor", label: "Bathroom Floor" },
    { key: "backsplash", label: "Backsplash" },
  ],
  "Backsplash Tile": [
    { key: "backsplash", label: "Backsplash" },
  ],
  "Tile Repair": [
    { key: "shower_floor", label: "Shower Floor" },
    { key: "shower_walls", label: "Shower Walls" },
    { key: "floor", label: "Floor" },
    { key: "backsplash", label: "Backsplash" },
    { key: "bathroom_floor", label: "Bathroom Floor" },
  ],
  "Other": [
    { key: "shower_floor", label: "Shower Floor" },
    { key: "bathroom_floor", label: "Bathroom Floor" },
    { key: "shower_walls", label: "Shower Walls" },
    { key: "shower_ceiling", label: "Shower Ceiling" },
    { key: "bathroom_walls", label: "Bathroom Walls" },
    { key: "tub_surround_walls", label: "Tub Surround Walls" },
    { key: "floor", label: "Floor" },
    { key: "backsplash", label: "Backsplash" },
  ],
};

// Tile shape options
const TILE_SHAPES = [
  { key: "rectangle", label: "Rectangle / Square" },
  { key: "subway", label: "Subway" },
  { key: "hexagon", label: "Hexagon" },
  { key: "penny_round", label: "Penny Round" },
  { key: "mosaic", label: "Mosaic / Mixed" },
  { key: "plank", label: "Plank" },
  { key: "other", label: "Other" },
];

// Inch options 1-48
const INCH_OPTIONS = Array.from({ length: 48 }, (_, i) => i + 1);

// Hex size options
const HEX_SIZES = [
  { key: "1in", label: '1"' },
  { key: "2in", label: '2"' },
  { key: "3in", label: '3"' },
  { key: "4in", label: '4"' },
  { key: "6in", label: '6"' },
  { key: "8in", label: '8"' },
  { key: "other", label: "Other" },
];

// Penny round is always ~1" (0.75" actual). No size needed.

type TileSize = {
  shape: string;
  dim1: number;  // inches
  dim2: number;  // inches
  hexSize: string;
  customDesc: string;
};

type AreaDimensions = {
  // For floors (floor, bathroom_floor, shower_floor)
  widthInches: number;   // 36-600", or custom >600 (use -1)
  lengthInches: number;  // 36-600", or custom >600 (use -1)
  customWidth: string;   // used when widthInches === -1 (">600")
  customLength: string;  // used when lengthInches === -1 (">600")
  // For walls (shower_walls, tub_surround_walls)
  heightInches: number;  // 72-144"
  walls: { widthInches: number; customWidth: string; label: string }[]; // per-wall widths, 6-240" or custom >240
  slopedCeiling: boolean;
  wallCount: number;     // default 3 for shower
  // For backsplash
  // uses heightInches + one wall width + outlets/switches
  outlets: number;       // number of electrical outlets in tiled area
  lightSwitches: number; // number of light switches in tiled area
};

const emptyDimensions: AreaDimensions = {
  widthInches: 0, lengthInches: 0, customWidth: "", customLength: "",
  heightInches: 0, walls: [{ widthInches: 0, customWidth: "", label: "" }],
  slopedCeiling: false, wallCount: 3,
  outlets: 0, lightSwitches: 0,
};

function makeDefaultDimensions(areaType: string): AreaDimensions {
  if (areaType === "shower_walls") {
    return {
      ...emptyDimensions,
      wallCount: 3,
      walls: [
        { widthInches: 0, customWidth: "", label: "Center Wall" },
        { widthInches: 0, customWidth: "", label: "Left Wall" },
        { widthInches: 0, customWidth: "", label: "Right Wall" },
      ],
    };
  }
  if (areaType === "tub_surround_walls") {
    return {
      ...emptyDimensions,
      wallCount: 3,
      walls: [
        { widthInches: 0, customWidth: "", label: "Back Wall" },
        { widthInches: 0, customWidth: "", label: "Left Wall" },
        { widthInches: 0, customWidth: "", label: "Right Wall" },
      ],
    };
  }
  if (areaType === "bathroom_walls") {
    return {
      ...emptyDimensions,
      wallCount: 4,
      walls: [
        { widthInches: 0, customWidth: "", label: "Wall 1" },
        { widthInches: 0, customWidth: "", label: "Wall 2" },
        { widthInches: 0, customWidth: "", label: "Wall 3" },
        { widthInches: 0, customWidth: "", label: "Wall 4" },
      ],
    };
  }
  return { ...emptyDimensions, walls: [{ widthInches: 0, customWidth: "", label: "" }] };
}

// Dimension dropdown option ranges (generated programmatically)
const FLOOR_INCH_OPTIONS = [...Array.from({ length: 600 - 36 + 1 }, (_, i) => i + 36), -1]; // 36-600 + ">600"
const WALL_HEIGHT_OPTIONS = Array.from({ length: 144 - 72 + 1 }, (_, i) => i + 72); // 72-144
const WALL_WIDTH_OPTIONS = [...Array.from({ length: 240 - 6 + 1 }, (_, i) => i + 6), -1]; // 6-240 + ">240"
const BACKSPLASH_HEIGHT_OPTIONS = Array.from({ length: 144 - 6 + 1 }, (_, i) => i + 6); // 6-144
const COUNT_OPTIONS_0_10 = Array.from({ length: 11 }, (_, i) => i); // 0-10

// Tile layout patterns
const TILE_LAYOUTS = [
  { key: "straight", label: "Straight Lay (Grid)" },
  { key: "half_offset", label: "1/2 Offset (Brick Lay)" },
  { key: "third_offset", label: "1/3 Offset" },
  { key: "herringbone", label: "Herringbone" },
  { key: "soldier", label: "Soldier Lay (Vertically Stacked)" },
  { key: "other", label: "Other / Custom" },
] as const;

// Grout joint width options
const GROUT_WIDTHS = [
  { key: "1/16", label: '1/16"' },
  { key: "1/8", label: '1/8"' },
  { key: "3/16", label: '3/16"' },
  { key: "1/4", label: '1/4"' },
  { key: "other", label: "Other" },
] as const;

// Schluter drain options (shown when shower floor has dimensions)
const DRAIN_OPTIONS = [
  { key: "4in", label: "4 inch Schluter Drain" },
  { key: "linear", label: "Linear Drain (Kerdi-Line)" },
] as const;

function getEffectiveInches(value: number, customValue: string): number {
  if (value === -1) return parseFloat(customValue) || 0;
  return value;
}

function calcSqft(areaType: string, dimensions: AreaDimensions): number {
  const isFloor = areaType === "floor" || areaType === "bathroom_floor" || areaType === "shower_floor" || areaType === "shower_ceiling";
  const isWall = areaType === "shower_walls" || areaType === "tub_surround_walls" || areaType === "bathroom_walls";
  const isBacksplash = areaType === "backsplash";

  if (isFloor) {
    const w = getEffectiveInches(dimensions.widthInches, dimensions.customWidth);
    const l = getEffectiveInches(dimensions.lengthInches, dimensions.customLength);
    if (w > 0 && l > 0) return Math.round((w * l) / 144 * 100) / 100;
    return 0;
  }
  if (isWall) {
    const h = dimensions.heightInches;
    const totalWidth = dimensions.walls.reduce((sum, wall) => sum + getEffectiveInches(wall.widthInches, wall.customWidth), 0);
    if (h > 0 && totalWidth > 0) return Math.round((h * totalWidth) / 144 * 100) / 100;
    return 0;
  }
  if (isBacksplash) {
    const h = dimensions.heightInches;
    const totalWidth = dimensions.walls.reduce((sum, wall) => sum + getEffectiveInches(wall.widthInches, wall.customWidth), 0);
    if (h > 0 && totalWidth > 0) return Math.round((h * totalWidth) / 144 * 100) / 100;
    return 0;
  }
  return 0;
}

function areaReviewText(areaType: string, dimensions: AreaDimensions, displayName: string, layout?: string): string {
  const sqft = calcSqft(areaType, dimensions);
  const layoutLabel = layout
    ? (TILE_LAYOUTS.find((l) => l.key === layout)?.label
      || (layout === "hex_point_up" ? "Point Facing Up" : null)
      || (layout === "hex_flat_top" ? "Flat Side Up" : null)
      || layout)
    : "";
  const isFloor = areaType === "floor" || areaType === "bathroom_floor" || areaType === "shower_floor" || areaType === "shower_ceiling";
  const isWall = areaType === "shower_walls" || areaType === "tub_surround_walls" || areaType === "bathroom_walls";
  const isBacksplash = areaType === "backsplash";
  const layoutSuffix = layoutLabel ? ` — ${layoutLabel}` : "";

  if (isFloor) {
    const w = getEffectiveInches(dimensions.widthInches, dimensions.customWidth);
    const l = getEffectiveInches(dimensions.lengthInches, dimensions.customLength);
    if (w > 0 && l > 0) {
      return `${displayName}: ${w}" x ${l}" (${sqft} sq ft)${layoutSuffix}`;
    }
    return `${displayName}: dimensions not set`;
  }
  if (isWall) {
    const h = dimensions.heightInches;
    const wallWidths = dimensions.walls.map((wall) => getEffectiveInches(wall.widthInches, wall.customWidth)).filter((v) => v > 0);
    if (h > 0 && wallWidths.length > 0) {
      const wallStr = dimensions.walls
        .filter((wall) => getEffectiveInches(wall.widthInches, wall.customWidth) > 0)
        .map((wall) => {
          const w = getEffectiveInches(wall.widthInches, wall.customWidth);
          return wall.label ? `${wall.label}: ${w}"` : `${w}"`;
        })
        .join(", ");
      return `${displayName}: ${h}"H x ${wallWidths.length} wall${wallWidths.length !== 1 ? "s" : ""} (${wallStr}) = ${sqft} sq ft${layoutSuffix}`;
    }
    return `${displayName}: dimensions not set`;
  }
  if (isBacksplash) {
    const h = dimensions.heightInches;
    const totalWidth = dimensions.walls.reduce((sum, wall) => sum + getEffectiveInches(wall.widthInches, wall.customWidth), 0);
    if (h > 0 && totalWidth > 0) {
      let widthStr = dimensions.walls.length > 1
        ? dimensions.walls.map((w, i) => `${getEffectiveInches(w.widthInches, w.customWidth)}"`).join(" + ")
        : `${totalWidth}"W`;
      let text = `${displayName}: ${h}"H x ${widthStr} (${sqft} sq ft)${layoutSuffix}`;
      if (dimensions.outlets > 0) text += `, ${dimensions.outlets} outlet${dimensions.outlets !== 1 ? "s" : ""}`;
      if (dimensions.lightSwitches > 0) text += `, ${dimensions.lightSwitches} switch outlet${dimensions.lightSwitches !== 1 ? "s" : ""}`;
      return text;
    }
    return `${displayName}: dimensions not set`;
  }
  return `${displayName}: ${sqft > 0 ? sqft + " sq ft" : "dimensions not set"}`;
}

type AreaEntry = {
  id: string;
  areaType: string;
  dimensions: AreaDimensions;
  tileSize: TileSize;
  layout: string;
  groutWidth: string;       // "1/16", "1/8", "3/16", "1/4", "other"
  groutWidthCustom: string; // custom grout width when groutWidth === "other"
  heatedFloor: boolean;     // DITRA-HEAT checkbox for floor areas
  drainType: string;        // "4in" or "linear" — shower floor only
  drainStyle: string;       // customer-chosen drain style text
  drainColor: string;       // customer-chosen drain color text
};

// A staged photo — uploaded to blob immediately when the customer picks it.
// Stored as plain data (URL + metadata strings) so it survives navigation
// across the multi-step form even if iOS evicts the original File object.
type StagedPhoto = {
  url: string;
  filename: string;
  category: "area" | "tile";
};

// A project the user has finished filling out (snapshotted from the live form).
// Each project has its own photos so multi-project quotes keep them separated.
type SavedProject = {
  id: string;
  projectType: string;
  categoryLabel: string;
  areas: AreaEntry[];
  features: string[];
  customFeature: string;          // free-text "other feature" input
  details: string;
  includeSchluterMaterials: string;
  // Tile Repair specific
  repairDescription: string;
  repairTileDescription: string;
  // Backsplash / Tile Repair: mortar & grout selections
  includeMortarGrout: boolean;
  mortarSelected: boolean;
  premixedGroutSelected: boolean;
  sandedGroutSelected: boolean;
  nonsandedGroutSelected: boolean;
  areaPhotos: StagedPhoto[];
  tilePhotos: StagedPhoto[];
};

function tileSqft(size: TileSize): number {
  if (size.shape === "hexagon") {
    const inchMap: Record<string, number> = { "1in": 1, "2in": 2, "3in": 3, "4in": 4, "6in": 6, "8in": 8 };
    const d = inchMap[size.hexSize] || 0;
    // hex area ≈ (3√3/2) × (d/2)² but for pricing we use bounding box equivalent
    return d > 0 ? Math.round((d * d) * 100) / 100 / 144 : 0;
  }
  if (size.shape === "penny_round") {
    return 0.75 * 0.75 / 144; // ~0.004 sqft per penny
  }
  if (size.dim1 > 0 && size.dim2 > 0) {
    return (size.dim1 * size.dim2) / 144;
  }
  return 0;
}

function tileDisplayLabel(size: TileSize): string {
  if (size.shape === "hexagon") {
    if (size.hexSize === "other") return "Hexagon (custom size)";
    const label = HEX_SIZES.find((h) => h.key === size.hexSize)?.label || size.hexSize;
    return `${label} hexagon`;
  }
  if (size.shape === "penny_round") return "Penny round";
  if (size.shape === "mosaic") return size.customDesc || "Mosaic / mixed";
  if (size.shape === "other") return size.customDesc || "Other";
  if (size.dim1 > 0 && size.dim2 > 0) {
    const shapeLabel = TILE_SHAPES.find((s) => s.key === size.shape)?.label || size.shape;
    if (size.dim1 === size.dim2) return `${size.dim1}x${size.dim2} square`;
    return `${size.dim1}x${size.dim2} ${shapeLabel.toLowerCase()}`;
  }
  return "";
}

const emptyTileSize: TileSize = { shape: "", dim1: 0, dim2: 0, hexSize: "", customDesc: "" };

let nextAreaId = 1;
function makeAreaId() {
  return `area_${nextAreaId++}_${Date.now()}`;
}

// Dropdown component for inch selection
function InchDropdown({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full border rounded-lg px-3 py-3 text-base text-left flex items-center justify-between ${open ? "border-navy ring-2 ring-navy/20" : "border-gray-300"}`}
      >
        <span className={value > 0 ? "text-gray-900" : "text-gray-400"}>
          {value > 0 ? `${value}"` : "Select"}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {INCH_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { onChange(n); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-navy/5 ${value === n ? "bg-navy/10 text-navy font-medium" : "text-gray-700"}`}
            >
              {n}&quot;
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Shape picker
function ShapePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = TILE_SHAPES.find((s) => s.key === value)?.label || "";

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-gray-500 mb-1">Tile shape</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full border rounded-lg px-4 py-3 text-base text-left flex items-center justify-between ${open ? "border-navy ring-2 ring-navy/20" : "border-gray-300"}`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {selectedLabel || "Select shape"}
        </span>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {TILE_SHAPES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => { onChange(s.key); setOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-navy/5 ${value === s.key ? "bg-navy/10 text-navy font-medium" : "text-gray-700"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Full tile size picker for an area
function TileSizePicker({ size, onChange }: { size: TileSize; onChange: (s: TileSize) => void }) {
  const needsDimensions = ["rectangle", "subway", "plank"].includes(size.shape);
  const isHex = size.shape === "hexagon";
  const needsCustom = size.shape === "mosaic" || size.shape === "other";

  return (
    <div className="space-y-3">
      <ShapePicker value={size.shape} onChange={(shape) => onChange({ ...size, shape, dim1: 0, dim2: 0, hexSize: "", customDesc: "" })} />

      {needsDimensions && (
        <div className="flex gap-3 items-end">
          <InchDropdown value={size.dim1} onChange={(v) => onChange({ ...size, dim1: v })} label="Width" />
          <span className="pb-3 text-gray-400 font-bold">&times;</span>
          <InchDropdown value={size.dim2} onChange={(v) => onChange({ ...size, dim2: v })} label="Height" />
        </div>
      )}

      {isHex && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hex size (point to point)</label>
          <div className="flex flex-wrap gap-2">
            {HEX_SIZES.map((h) => (
              <button
                key={h.key}
                type="button"
                onClick={() => onChange({ ...size, hexSize: h.key })}
                className={`px-4 py-2.5 rounded-lg border text-sm transition-all ${
                  size.hexSize === h.key
                    ? "border-navy bg-navy/5 text-navy font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
          {size.hexSize === "other" && (
            <input
              type="text"
              value={size.customDesc}
              onChange={(e) => onChange({ ...size, customDesc: e.target.value })}
              className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
              placeholder="Describe hex size"
            />
          )}
        </div>
      )}

      {needsCustom && (
        <input
          type="text"
          value={size.customDesc}
          onChange={(e) => onChange({ ...size, customDesc: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
          placeholder="Describe your tile"
        />
      )}
    </div>
  );
}

// Area type picker dropdown
function AreaTypePicker({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { key: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.key === value)?.label || "";

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-gray-500 mb-1">Area type</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full border rounded-lg px-4 py-3 text-base text-left flex items-center justify-between ${open ? "border-navy ring-2 ring-navy/20" : "border-gray-300"}`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {selectedLabel || "Select area type"}
        </span>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => { onChange(o.key); setOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-navy/5 ${value === o.key ? "bg-navy/10 text-navy font-medium" : "text-gray-700"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Generic dimension dropdown — same visual style as InchDropdown
function DimensionDropdown({
  value,
  onChange,
  label,
  options,
  overflowValue,
  overflowLabel,
  placeholder,
  displayFn,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  options: number[];
  overflowValue?: number;  // e.g. -1 for ">600"
  overflowLabel?: string;  // e.g. ">600"
  placeholder?: string;
  displayFn?: (v: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = (() => {
    if (value === 0) return "";
    if (overflowValue !== undefined && value === overflowValue) return overflowLabel || `>${options[options.length - (options.includes(overflowValue) ? 2 : 1)]}`;
    if (displayFn) return displayFn(value);
    return `${value}"`;
  })();

  return (
    <div ref={ref} className="relative flex-1">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full border rounded-lg px-3 py-3 text-base text-left flex items-center justify-between ${open ? "border-navy ring-2 ring-navy/20" : "border-gray-300"}`}
      >
        <span className={displayValue ? "text-gray-900" : "text-gray-400"}>
          {displayValue || placeholder || "Select"}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((n) => {
            const isOverflow = overflowValue !== undefined && n === overflowValue;
            const itemLabel = isOverflow ? (overflowLabel || `>${n}`) : (displayFn ? displayFn(n) : `${n}"`);
            return (
              <button
                key={n}
                type="button"
                onClick={() => { onChange(n); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-navy/5 ${value === n ? "bg-navy/10 text-navy font-medium" : "text-gray-700"}`}
              >
                {itemLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Floor dimension inputs (floor, bathroom_floor, shower_floor)
function FloorDimensionInputs({
  dimensions,
  onChange,
  areaType,
  allAreas,
}: {
  dimensions: AreaDimensions;
  onChange: (d: AreaDimensions) => void;
  areaType: string;
  allAreas: AreaEntry[];
}) {
  // Track whether the user has manually edited the shower floor dimensions
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // Shower floor auto-fill from wall widths
  useEffect(() => {
    if (areaType !== "shower_floor" || manuallyEdited) return;
    const wallArea = allAreas.find((a) => a.areaType === "shower_walls");
    if (!wallArea) return;
    const wallWidths = wallArea.dimensions.walls
      .map((w) => getEffectiveInches(w.widthInches, w.customWidth))
      .filter((v) => v > 0)
      .sort((a, b) => a - b);
    if (wallWidths.length < 2) return;
    // Use the two longest wall widths
    const sorted = [...wallWidths].sort((a, b) => b - a);
    const newWidth = sorted[0];
    const newLength = sorted[1];
    // Only auto-fill if the values would actually change
    const currentW = getEffectiveInches(dimensions.widthInches, dimensions.customWidth);
    const currentL = getEffectiveInches(dimensions.lengthInches, dimensions.customLength);
    if (currentW === newWidth && currentL === newLength) return;
    // Determine if values are in range or need custom
    const wInRange = newWidth >= 36 && newWidth <= 600;
    const lInRange = newLength >= 36 && newLength <= 600;
    onChange({
      ...dimensions,
      widthInches: wInRange ? newWidth : -1,
      customWidth: wInRange ? "" : String(newWidth),
      lengthInches: lInRange ? newLength : -1,
      customLength: lInRange ? "" : String(newLength),
    });
    setAutoFilled(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaType, allAreas, manuallyEdited]);

  const handleWidthChange = (v: number) => {
    setManuallyEdited(true);
    setAutoFilled(false);
    onChange({ ...dimensions, widthInches: v, customWidth: v === -1 ? dimensions.customWidth : "" });
  };
  const handleLengthChange = (v: number) => {
    setManuallyEdited(true);
    setAutoFilled(false);
    onChange({ ...dimensions, lengthInches: v, customLength: v === -1 ? dimensions.customLength : "" });
  };

  const sqft = calcSqft(areaType, dimensions);

  return (
    <div className="space-y-2">
      <label className="block text-xs text-gray-500 mb-1">Dimensions (inches)</label>
      <div className="flex gap-3 items-end">
        <DimensionDropdown
          value={dimensions.widthInches}
          onChange={handleWidthChange}
          label="Width"
          options={FLOOR_INCH_OPTIONS}
          overflowValue={-1}
          overflowLabel={'>600"'}
          placeholder="Width"
        />
        <span className="pb-3 text-gray-400 font-bold">&times;</span>
        <DimensionDropdown
          value={dimensions.lengthInches}
          onChange={handleLengthChange}
          label="Length"
          options={FLOOR_INCH_OPTIONS}
          overflowValue={-1}
          overflowLabel={'>600"'}
          placeholder="Length"
        />
      </div>
      {dimensions.widthInches === -1 && (
        <input
          type="text"
          value={dimensions.customWidth}
          onChange={(e) => { setManuallyEdited(true); setAutoFilled(false); onChange({ ...dimensions, customWidth: e.target.value }); }}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
          placeholder='Custom width (inches, e.g. 720)'
        />
      )}
      {dimensions.lengthInches === -1 && (
        <input
          type="text"
          value={dimensions.customLength}
          onChange={(e) => { setManuallyEdited(true); setAutoFilled(false); onChange({ ...dimensions, customLength: e.target.value }); }}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
          placeholder='Custom length (inches, e.g. 720)'
        />
      )}
      {areaType === "shower_floor" && autoFilled && (
        <p className="text-xs text-gray-500 italic">(auto-filled from shower wall dimensions)</p>
      )}
      {areaType === "shower_floor" && autoFilled && (
        <p className="text-xs text-gray-400">Auto-filled from shower wall dimensions. Edit if your shower floor is not rectangular.</p>
      )}
      {sqft > 0 && (
        <p className="text-xs text-gray-500">Calculated: {sqft} sq ft</p>
      )}
    </div>
  );
}

// Wall dimension inputs (shower_walls, tub_surround_walls)
function WallDimensionInputs({
  dimensions,
  onChange,
  areaType,
}: {
  dimensions: AreaDimensions;
  onChange: (d: AreaDimensions) => void;
  areaType: string;
}) {
  const [newWallName, setNewWallName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);

  const addWall = () => {
    if (showNameInput) {
      const label = newWallName.trim() || `Wall ${dimensions.walls.length + 1}`;
      onChange({
        ...dimensions,
        walls: [...dimensions.walls, { widthInches: 0, customWidth: "", label }],
        wallCount: dimensions.walls.length + 1,
      });
      setNewWallName("");
      setShowNameInput(false);
    } else {
      setShowNameInput(true);
    }
  };

  const cancelAddWall = () => {
    setNewWallName("");
    setShowNameInput(false);
  };

  const removeWall = (idx: number) => {
    if (dimensions.walls.length <= 1) return;
    const newWalls = dimensions.walls.filter((_, i) => i !== idx);
    onChange({ ...dimensions, walls: newWalls, wallCount: newWalls.length });
  };

  const updateWall = (idx: number, widthInches: number, customWidth?: string) => {
    const newWalls = dimensions.walls.map((w, i) =>
      i === idx ? { ...w, widthInches, customWidth: customWidth !== undefined ? customWidth : (widthInches === -1 ? w.customWidth : "") } : w
    );
    onChange({ ...dimensions, walls: newWalls });
  };

  const sqft = calcSqft(areaType, dimensions);

  return (
    <div className="space-y-2">
      <label className="block text-xs text-gray-500 mb-1">Dimensions (inches)</label>
      <DimensionDropdown
        value={dimensions.heightInches}
        onChange={(v) => onChange({ ...dimensions, heightInches: v })}
        label="Height"
        options={WALL_HEIGHT_OPTIONS}
        placeholder="Height"
      />
      <p className="text-xs text-gray-400">If your ceiling is sloped, measure to the highest point</p>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`sloped-${areaType}`}
          checked={dimensions.slopedCeiling}
          onChange={(e) => onChange({ ...dimensions, slopedCeiling: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
        />
        <label htmlFor={`sloped-${areaType}`} className="text-sm text-gray-600">Sloped ceiling</label>
      </div>
      <div className="space-y-2 pt-1">
        {dimensions.walls.map((wall, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <DimensionDropdown
                  value={wall.widthInches}
                  onChange={(v) => updateWall(idx, v)}
                  label={`${wall.label || `Wall ${idx + 1}`} width`}
                  options={WALL_WIDTH_OPTIONS}
                  overflowValue={-1}
                  overflowLabel={'>240"'}
                  placeholder="Width"
                />
              </div>
              {dimensions.walls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeWall(idx)}
                  className="mb-0.5 text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Remove wall"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {wall.widthInches === -1 && (
              <input
                type="text"
                value={wall.customWidth}
                onChange={(e) => updateWall(idx, -1, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                placeholder="Custom width (inches)"
              />
            )}
          </div>
        ))}
      </div>
      {showNameInput ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newWallName}
            onChange={(e) => setNewWallName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWall(); } }}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy focus:border-navy outline-none"
            placeholder="Wall name (e.g. Knee Wall)"
            autoFocus
          />
          <button type="button" onClick={addWall} className="text-sm text-navy font-medium hover:underline">Add</button>
          <button type="button" onClick={cancelAddWall} className="text-sm text-gray-400 font-medium hover:underline">Cancel</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={addWall}
          className="text-sm text-navy font-medium hover:underline"
        >
          + Add Wall
        </button>
      )}
      {sqft > 0 && (
        <p className="text-xs text-gray-500">Calculated: {sqft} sq ft</p>
      )}
    </div>
  );
}

// Backsplash dimension inputs
function BacksplashDimensionInputs({
  dimensions,
  onChange,
}: {
  dimensions: AreaDimensions;
  onChange: (d: AreaDimensions) => void;
}) {
  const wall = dimensions.walls[0] || { widthInches: 0, customWidth: "", label: "" };

  const updateWall = (idx: number, widthInches: number, customWidth?: string) => {
    const newWalls = dimensions.walls.map((w, i) =>
      i === idx ? { ...w, widthInches, customWidth: customWidth !== undefined ? customWidth : (widthInches === -1 ? w.customWidth : "") } : w
    );
    onChange({ ...dimensions, walls: newWalls });
  };

  const addWidth = () => {
    onChange({
      ...dimensions,
      walls: [...dimensions.walls, { widthInches: 0, customWidth: "", label: `Section ${dimensions.walls.length + 1}` }],
    });
  };

  const removeWidth = (idx: number) => {
    if (dimensions.walls.length <= 1) return;
    onChange({ ...dimensions, walls: dimensions.walls.filter((_, i) => i !== idx) });
  };

  // Total sqft = height * sum of all widths / 144
  const totalSqft = (() => {
    const h = dimensions.heightInches;
    const totalW = dimensions.walls.reduce((sum, w) => sum + getEffectiveInches(w.widthInches, w.customWidth), 0);
    if (h > 0 && totalW > 0) return Math.round((h * totalW) / 144 * 100) / 100;
    return 0;
  })();

  return (
    <div className="space-y-2">
      <label className="block text-xs text-gray-500 mb-1">Dimensions (inches)</label>
      <DimensionDropdown
        value={dimensions.heightInches}
        onChange={(v) => onChange({ ...dimensions, heightInches: v })}
        label="Height"
        options={BACKSPLASH_HEIGHT_OPTIONS}
        placeholder="Height"
      />
      {dimensions.walls.map((w, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <DimensionDropdown
                value={w.widthInches}
                onChange={(v) => updateWall(idx, v)}
                label={dimensions.walls.length > 1 ? `Width — ${w.label || `Section ${idx + 1}`}` : "Width"}
                options={WALL_WIDTH_OPTIONS}
                overflowValue={-1}
                overflowLabel={'>240"'}
                placeholder="Width"
              />
            </div>
            {dimensions.walls.length > 1 && (
              <button
                type="button"
                onClick={() => removeWidth(idx)}
                className="mb-0.5 text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Remove width"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {w.widthInches === -1 && (
            <input
              type="text"
              value={w.customWidth}
              onChange={(e) => updateWall(idx, -1, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
              placeholder="Custom width (inches)"
            />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addWidth}
        className="text-sm text-navy font-medium hover:underline"
      >
        + Add an additional width
      </button>
      <p className="text-xs text-gray-400">Add a width for each contiguous change of plane (e.g. an L-shaped counter or wrap-around backsplash).</p>
      <DimensionDropdown
        value={dimensions.outlets}
        onChange={(v) => onChange({ ...dimensions, outlets: v })}
        label="Electrical outlets in tiled area"
        options={COUNT_OPTIONS_0_10}
        placeholder="0"
        displayFn={(v) => String(v)}
      />
      <DimensionDropdown
        value={dimensions.lightSwitches}
        onChange={(v) => onChange({ ...dimensions, lightSwitches: v })}
        label="Light switch outlets in tiled area"
        options={COUNT_OPTIONS_0_10}
        placeholder="0"
        displayFn={(v) => String(v)}
      />
      {totalSqft > 0 && (
        <p className="text-xs text-gray-500">Calculated: {totalSqft} sq ft</p>
      )}
    </div>
  );
}

// Single area card component
function AreaCard({
  area,
  index,
  areaTypeOptions,
  onUpdate,
  onRemove,
  canRemove,
  allAreas,
}: {
  area: AreaEntry;
  index: number;
  areaTypeOptions: { key: string; label: string }[];
  onUpdate: (updated: AreaEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
  allAreas: AreaEntry[];
}) {
  const areaLabel = areaTypeOptions.find((o) => o.key === area.areaType)?.label || area.areaType;
  const isFloorArea = area.areaType === "floor" || area.areaType === "bathroom_floor" || area.areaType === "shower_floor" || area.areaType === "shower_ceiling";
  const isWallArea = area.areaType === "shower_walls" || area.areaType === "tub_surround_walls" || area.areaType === "bathroom_walls";
  const isBacksplash = area.areaType === "backsplash";
  const isShowerFloor = area.areaType === "shower_floor";
  const showHeatedFloor = (area.areaType === "floor" || area.areaType === "bathroom_floor" || area.areaType === "shower_floor") && isFloorArea;
  const showGroutWidth = area.tileSize.shape && area.tileSize.shape !== "mosaic" && area.tileSize.shape !== "penny_round";
  const showerFloorHasDimensions = isShowerFloor && calcSqft(area.areaType, area.dimensions) > 0;

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3 relative">
      {/* Header row with area number and remove button */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-navy">{areaLabel}</p>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Remove area"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Area type */}
      <AreaTypePicker
        value={area.areaType}
        onChange={(v) => onUpdate({ ...area, areaType: v, dimensions: makeDefaultDimensions(v), heatedFloor: false, drainType: "", drainStyle: "", drainColor: "" })}
        options={areaTypeOptions}
      />

      {/* Dimension inputs based on area type */}
      {isFloorArea && (
        <FloorDimensionInputs
          dimensions={area.dimensions}
          onChange={(d) => onUpdate({ ...area, dimensions: d })}
          areaType={area.areaType}
          allAreas={allAreas}
        />
      )}
      {isWallArea && (
        <WallDimensionInputs
          dimensions={area.dimensions}
          onChange={(d) => onUpdate({ ...area, dimensions: d })}
          areaType={area.areaType}
        />
      )}
      {isBacksplash && (
        <BacksplashDimensionInputs
          dimensions={area.dimensions}
          onChange={(d) => onUpdate({ ...area, dimensions: d })}
        />
      )}

      {/* Heated floor checkbox — only for floor, bathroom_floor, shower_floor (NOT shower_ceiling) */}
      {showHeatedFloor && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id={`heated-${area.id}`}
            checked={area.heatedFloor}
            onChange={(e) => onUpdate({ ...area, heatedFloor: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
          />
          <label htmlFor={`heated-${area.id}`} className="text-sm text-gray-600">
            Add heated floors (DITRA-HEAT) to quote
          </label>
        </div>
      )}

      {/* Schluter drain — shower floor only, once dimensions are entered */}
      {showerFloorHasDimensions && (
        <div className="space-y-2 pt-1">
          <label className="block text-sm font-medium text-gray-700">Schluter Drain</label>
          <div className="space-y-2">
            {DRAIN_OPTIONS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => onUpdate({ ...area, drainType: area.drainType === d.key ? "" : d.key, drainStyle: area.drainType === d.key ? "" : area.drainStyle, drainColor: area.drainType === d.key ? "" : area.drainColor })}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                  area.drainType === d.key ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {area.drainType && (
            <div className="space-y-2 pl-2 border-l-2 border-navy/20">
              <p className="text-xs text-gray-500">
                <a
                  href={area.drainType === "linear"
                    ? "https://www.schluter.com/schluter-us/en_US/Shower-System/Drains/Kerdi-Line/c/KL"
                    : "https://www.schluter.com/schluter-us/en_US/Shower-System/Drains/Kerdi-Drain/c/KD"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy underline hover:text-navy-light"
                >
                  Browse {area.drainType === "linear" ? "Kerdi-Line" : "Kerdi-Drain"} options on Schluter.com →
                </a>
              </p>
              <input
                type="text"
                value={area.drainStyle}
                onChange={(e) => onUpdate({ ...area, drainStyle: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                placeholder="Drain style (e.g. Square, Floral, Pure)"
              />
              <input
                type="text"
                value={area.drainColor}
                onChange={(e) => onUpdate({ ...area, drainColor: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                placeholder="Drain color/finish (e.g. Brushed Stainless Steel)"
              />
            </div>
          )}
        </div>
      )}

      {/* Tile size picker */}
      <TileSizePicker
        size={area.tileSize}
        onChange={(ts) => {
          // Clear layout and grout width if tile shape changed
          const shapeChanged = ts.shape !== area.tileSize.shape;
          onUpdate({ ...area, tileSize: ts, layout: shapeChanged ? "" : area.layout, groutWidth: shapeChanged ? "" : area.groutWidth, groutWidthCustom: shapeChanged ? "" : area.groutWidthCustom });
        }}
      />

      {/* Grout joint width — hidden for mosaic/penny round */}
      {showGroutWidth && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Grout joint width</label>
          <select
            value={area.groutWidth}
            onChange={(e) => onUpdate({ ...area, groutWidth: e.target.value, groutWidthCustom: e.target.value !== "other" ? "" : area.groutWidthCustom })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none bg-white appearance-none"
          >
            <option value="">Select grout width...</option>
            {GROUT_WIDTHS.map((g) => (
              <option key={g.key} value={g.key}>{g.label}</option>
            ))}
          </select>
          {area.groutWidth === "other" && (
            <input
              type="text"
              value={area.groutWidthCustom}
              onChange={(e) => onUpdate({ ...area, groutWidthCustom: e.target.value })}
              className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
              placeholder="Specify grout joint width"
            />
          )}
        </div>
      )}

      {/* Layout pattern — hidden for mosaic/penny round, hex-specific options for hexagon */}
      {area.tileSize.shape && area.tileSize.shape !== "mosaic" && area.tileSize.shape !== "penny_round" && (() => {
        const isHex = area.tileSize.shape === "hexagon";
        const layoutOptions = isHex
          ? [
              { key: "hex_point_up", label: "Point Facing Up" },
              { key: "hex_flat_top", label: "Flat Side Up" },
            ]
          : TILE_LAYOUTS;
        return (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Layout pattern</label>
            <select
              value={area.layout}
              onChange={(e) => onUpdate({ ...area, layout: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none bg-white appearance-none"
            >
              <option value="">Select layout...</option>
              {layoutOptions.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
          </div>
        );
      })()}
    </div>
  );
}

type Step = "contact" | "project" | "details" | "photos" | "review";

export default function QuotePage() {
  const [step, setStep] = useState<Step>("contact");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [photoWarning, setPhotoWarning] = useState("");

  // Contact
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Multi-project model: list of saved projects + the one currently being filled
  // currentProject is "live" form state. On review, user can Add another -> save current and start fresh.
  // editingIndex !== null means we loaded a saved project back into currentProject to edit; saving updates that index instead of appending.
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Current-project state (the form being filled right now)
  const [projectType, setProjectType] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  const [areas, setAreas] = useState<AreaEntry[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState("");
  const [details, setDetails] = useState("");
  const [includeSchluterMaterials, setIncludeSchluterMaterials] = useState("");
  // Tile Repair specific
  const [repairDescription, setRepairDescription] = useState("");
  const [repairTileDescription, setRepairTileDescription] = useState("");
  // Backsplash / Tile Repair: mortar & grout
  const [includeMortarGrout, setIncludeMortarGrout] = useState(false);
  const [mortarSelected, setMortarSelected] = useState(false);
  const [premixedGroutSelected, setPremixedGroutSelected] = useState(false);
  const [sandedGroutSelected, setSandedGroutSelected] = useState(false);
  const [nonsandedGroutSelected, setNonsandedGroutSelected] = useState(false);

  // Photos — POOLED across all projects (not per-project)
  const [declinePhotos, setDeclinePhotos] = useState(false);
  const [areaPhotos, setAreaPhotos] = useState<StagedPhoto[]>([]);
  const [tilePhotos, setTilePhotos] = useState<StagedPhoto[]>([]);

  // Photo-staging UX state
  const [photoStaging, setPhotoStaging] = useState<{ area: boolean; tile: boolean }>({ area: false, tile: false });
  const [photoStageError, setPhotoStageError] = useState("");
  // Stable per-session id so blob staging paths group nicely
  const photoSessionIdRef = useRef<string>("");
  if (!photoSessionIdRef.current) {
    photoSessionIdRef.current = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // When project type changes, seed default areas
  function initAreasForProject(pt: string) {
    const defaults: Record<string, string[]> = {
      "Bathroom Remodel": ["bathroom_floor", "shower_floor", "shower_walls"],
      "Shower": ["shower_floor", "shower_walls"],
      "Tub Surround": ["tub_surround_walls"],
      "Floor Tile": ["floor"],
      "Backsplash Tile": ["backsplash"],
      "Tile Repair": [],
      "Other": [],
    };
    const areaKeys = defaults[pt] || [];
    setAreas(
      areaKeys.map((key) => ({
        id: makeAreaId(),
        areaType: key,
        dimensions: makeDefaultDimensions(key),
        tileSize: { ...emptyTileSize },
        layout: "",
        groutWidth: "",
        groutWidthCustom: "",
        heatedFloor: false,
        drainType: "",
        drainStyle: "",
        drainColor: "",
      }))
    );
  }

  // Snapshot the current form into a SavedProject
  function snapshotCurrentProject(): SavedProject {
    return {
      id: makeAreaId(),
      projectType,
      categoryLabel,
      areas,
      features,
      customFeature,
      details,
      includeSchluterMaterials,
      repairDescription,
      repairTileDescription,
      includeMortarGrout,
      mortarSelected,
      premixedGroutSelected,
      sandedGroutSelected,
      nonsandedGroutSelected,
      areaPhotos,
      tilePhotos,
    };
  }

  // Reset the current-project form to blank (clears photos too — each project owns its own photos)
  function resetCurrentProject() {
    setProjectType("");
    setCategoryLabel("");
    setAreas([]);
    setFeatures([]);
    setCustomFeature("");
    setDetails("");
    setIncludeSchluterMaterials("");
    setRepairDescription("");
    setRepairTileDescription("");
    setIncludeMortarGrout(false);
    setMortarSelected(false);
    setPremixedGroutSelected(false);
    setSandedGroutSelected(false);
    setNonsandedGroutSelected(false);
    setAreaPhotos([]);
    setTilePhotos([]);
    setDeclinePhotos(false);
    setEditingIndex(null);
  }

  // Persist current form into savedProjects (append OR replace if editing)
  function commitCurrentProject() {
    const snap = snapshotCurrentProject();
    if (editingIndex !== null) {
      setSavedProjects((prev) => prev.map((p, i) => (i === editingIndex ? snap : p)));
    } else {
      setSavedProjects((prev) => [...prev, snap]);
    }
  }

  // Add another project: save current, reset form, jump to project step
  function addAnotherProject() {
    commitCurrentProject();
    resetCurrentProject();
    setStep("project");
  }

  // Load a saved project back into the form (Edit from review page)
  function editSavedProject(index: number) {
    const p = savedProjects[index];
    if (!p) return;
    setProjectType(p.projectType);
    setCategoryLabel(p.categoryLabel);
    setAreas(p.areas);
    setFeatures(p.features);
    setCustomFeature(p.customFeature || "");
    setDetails(p.details);
    setIncludeSchluterMaterials(p.includeSchluterMaterials);
    setRepairDescription(p.repairDescription || "");
    setRepairTileDescription(p.repairTileDescription || "");
    setIncludeMortarGrout(p.includeMortarGrout || false);
    setMortarSelected(p.mortarSelected || false);
    setPremixedGroutSelected(p.premixedGroutSelected || false);
    setSandedGroutSelected(p.sandedGroutSelected || false);
    setNonsandedGroutSelected(p.nonsandedGroutSelected || false);
    setAreaPhotos(p.areaPhotos || []);
    setTilePhotos(p.tilePhotos || []);
    setDeclinePhotos(false);
    setEditingIndex(index);
    setStep("project");
  }

  // Remove a saved project entirely. If it's the one currently being edited, reset the live form too.
  function removeSavedProject(index: number) {
    setSavedProjects((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      resetCurrentProject();
    } else if (editingIndex !== null && index < editingIndex) {
      // Indices shifted left by one
      setEditingIndex(editingIndex - 1);
    }
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  function toggleFeature(f: string) {
    setFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  const isShower = projectType === "Shower" || projectType === "Bathroom Remodel" || projectType === "Tub Surround";
  const isFloor = projectType === "Floor Tile";
  const areaTypeOptions = AREA_TYPES_BY_PROJECT[projectType] || [];
  const featureOptions = FEATURES_BY_PROJECT[projectType] || [];

  const CATEGORY_LABEL_PLACEHOLDERS: Record<string, string> = {
    "Bathroom Remodel": "e.g. Master Bath, Guest Bath",
    "Shower": "e.g. Master Shower, Guest Shower",
    "Tub Surround": "e.g. Hall Bath Tub Surround",
    "Floor Tile": "e.g. Kitchen Floor, Living Room Floor",
    "Backsplash Tile": "e.g. Kitchen Backsplash, Bar Backsplash",
    "Tile Repair": "e.g. Master Shower Repair",
    "Other": "e.g. Fireplace Surround",
  };
  const categoryLabelPlaceholder = CATEGORY_LABEL_PLACEHOLDERS[projectType] || "Give this project a name";

  function addArea() {
    // Default to the first available area type
    const defaultType = areaTypeOptions[0]?.key || "floor";
    setAreas((prev) => [
      ...prev,
      {
        id: makeAreaId(),
        areaType: defaultType,
        dimensions: makeDefaultDimensions(defaultType),
        tileSize: { ...emptyTileSize },
        layout: "",
        groutWidth: "",
        groutWidthCustom: "",
        heatedFloor: false,
        drainType: "",
        drainStyle: "",
        drainColor: "",
      },
    ]);
  }

  function updateArea(id: string, updated: AreaEntry) {
    setAreas((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  function removeArea(id: string) {
    setAreas((prev) => prev.filter((a) => a.id !== id));
  }

  function areaDisplayName(area: AreaEntry): string {
    const typeLabel = areaTypeOptions.find((o) => o.key === area.areaType)?.label ||
      AREA_TYPES_BY_PROJECT["Other"]?.find((o) => o.key === area.areaType)?.label ||
      area.areaType;
    return typeLabel;
  }

  // Stage a freshly-picked photo to blob immediately. Returns the staged
  // photo metadata (URL + filename + category) which we keep in React state
  // instead of the raw File object — survives iOS Safari memory eviction.
  async function stagePhoto(file: File, category: "area" | "tile"): Promise<StagedPhoto | null> {
    // Compress large images client-side to stay under Vercel's 4.5 MB body limit
    const compressed = await compressImage(file);
    const form = new FormData();
    form.append("photo", compressed);
    form.append("category", category);
    form.append("sessionId", photoSessionIdRef.current);
    try {
      const res = await fetch(PHOTO_STAGE_API, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error(`[stagePhoto] HTTP ${res.status}`, data);
        return null;
      }
      const data = await res.json();
      if (!data?.url) {
        console.error("[stagePhoto] missing url in response", data);
        return null;
      }
      return {
        url: data.url,
        filename: data.filename || file.name,
        category,
      };
    } catch (err) {
      console.error("[stagePhoto] network error", err);
      return null;
    }
  }

  async function handlePhotoSelect(files: File[], category: "area" | "tile") {
    if (files.length === 0) return;
    setPhotoStageError("");
    setPhotoStaging((prev) => ({ ...prev, [category]: true }));
    try {
      const uploaded: StagedPhoto[] = [];
      const failed: string[] = [];
      // Upload sequentially to avoid hammering iOS Safari with parallel large file POSTs
      for (const file of files) {
        const staged = await stagePhoto(file, category);
        if (staged) uploaded.push(staged);
        else failed.push(file.name);
      }
      if (uploaded.length > 0) {
        if (category === "area") setAreaPhotos((prev) => [...prev, ...uploaded]);
        else setTilePhotos((prev) => [...prev, ...uploaded]);
      }
      if (failed.length > 0) {
        setPhotoStageError(
          `Could not upload: ${failed.join(", ")}. Please try again or pick a different photo.`
        );
      }
    } finally {
      setPhotoStaging((prev) => ({ ...prev, [category]: false }));
    }
  }

  function removeStagedPhoto(category: "area" | "tile", index: number) {
    if (category === "area") setAreaPhotos((prev) => prev.filter((_, i) => i !== index));
    else setTilePhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    setPhotoWarning("");

    try {
      const serviceNameMap: Record<string, string> = {
        shower_floor: "Shower Floor",
        bathroom_floor: "Bathroom Floor",
        shower_walls: "Shower Walls",
        shower_ceiling: "Shower Ceiling",
        bathroom_walls: "Bathroom Walls",
        tub_surround_walls: "Tub Surround Walls",
        floor: "Floor",
        backsplash: "Backsplash",
      };

      // Combine saved projects + the live current project (if it has content)
      // Editing case: current project is a copy of savedProjects[editingIndex] — replace, don't append
      const allProjects: SavedProject[] = (() => {
        const liveHasContent = projectType && (areas.some((a) => calcSqft(a.areaType, a.dimensions) > 0) || categoryLabel.trim());
        if (!liveHasContent) return savedProjects;
        const liveSnap = snapshotCurrentProject();
        if (editingIndex !== null) {
          return savedProjects.map((p, i) => (i === editingIndex ? liveSnap : p));
        }
        return [...savedProjects, liveSnap];
      })();

      // Photos are per-project; "hasAnyPhotos" is true if ANY project has at least one photo.
      const hasAnyPhotos = !declinePhotos && allProjects.some(
        (p) => (p.areaPhotos?.length || 0) > 0 || (p.tilePhotos?.length || 0) > 0
      );

      // Build per-project payload entries
      const projectsPayload = allProjects.map((proj) => {
        const builtAreas = proj.areas
          .map((area) => {
            const sqft = calcSqft(area.areaType, area.dimensions);
            if (sqft <= 0) return null;
            return {
              areaType: area.areaType,
              sqft,
              tileShape: area.tileSize.shape,
              tileDim1: area.tileSize.dim1,
              tileDim2: area.tileSize.dim2,
              tileHexSize: area.tileSize.hexSize,
              tileSqft: tileSqft(area.tileSize),
              tileDescription: tileDisplayLabel(area.tileSize),
              layout: area.layout || undefined,
              layoutLabel: area.layout ? (TILE_LAYOUTS.find((l) => l.key === area.layout)?.label || (area.layout === "hex_point_up" ? "Point Facing Up" : area.layout === "hex_flat_top" ? "Flat Side Up" : area.layout)) : undefined,
              groutWidth: area.groutWidth ? (area.groutWidth === "other" ? area.groutWidthCustom : area.groutWidth) : undefined,
              heatedFloor: area.heatedFloor || undefined,
              drainType: area.drainType || undefined,
              drainStyle: area.drainStyle || undefined,
              drainColor: area.drainColor || undefined,
              dimensions: area.dimensions,
            };
          })
          .filter(Boolean);

        const squareFootage =
          builtAreas
            .map((a) => {
              const area = a as { areaType: string; sqft: number; tileDescription: string };
              const baseName = serviceNameMap[area.areaType] || area.areaType;
              return `${baseName}: ${area.sqft} sqft (${area.tileDescription})`;
            })
            .join(", ") || undefined;

        const projectDetails =
          [
            proj.categoryLabel && `Project name: ${proj.categoryLabel}`,
            proj.includeSchluterMaterials && proj.projectType !== "Backsplash Tile" && proj.projectType !== "Tile Repair" &&
              `Materials (Schluter): ${proj.includeSchluterMaterials}`,
            proj.includeMortarGrout && `Mortar & grout: ${[proj.mortarSelected && "Mortar", proj.premixedGroutSelected && "Premixed Grout", proj.sandedGroutSelected && "Sanded Grout", proj.nonsandedGroutSelected && "Non-Sanded Grout"].filter(Boolean).join(", ")}`,
            proj.customFeature && `Other feature: ${proj.customFeature}`,
            proj.repairDescription && `Repair needed: ${proj.repairDescription}`,
            proj.repairTileDescription && `Existing tile: ${proj.repairTileDescription}`,
            proj.details && proj.details,
          ]
            .filter(Boolean)
            .join("\n") || undefined;

        // Combine predefined features + custom feature
        const allFeatures = [...(proj.features || [])];
        if (proj.customFeature?.trim()) allFeatures.push(proj.customFeature.trim());

        return {
          projectType: proj.projectType,
          projectName: proj.categoryLabel || undefined,
          squareFootage,
          areas: builtAreas,
          features: allFeatures.length > 0 ? allFeatures : undefined,
          includeSchluterMaterials: proj.includeSchluterMaterials === "Yes",
          includeMortarGrout: proj.includeMortarGrout || undefined,
          mortarGroutSelections: proj.includeMortarGrout ? {
            mortar: proj.mortarSelected,
            premixedGrout: proj.premixedGroutSelected,
            sandedGrout: proj.sandedGroutSelected,
            nonsandedGrout: proj.nonsandedGroutSelected,
          } : undefined,
          repairDescription: proj.repairDescription || undefined,
          repairTileDescription: proj.repairTileDescription || undefined,
          projectDetails,
        };
      });

      // Top-level legacy fields (first project) for backward compat with current backend.
      // Backend will be updated to prefer `projects` when present; this fallback keeps a deploy gap safe.
      const first = projectsPayload[0];

      const res = await fetch(QUOTE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email || undefined,
          siteAddress: address,
          // Legacy top-level fields (backend will fall back to these if `projects` not handled)
          projectType: first?.projectType,
          projectName: first?.projectName,
          squareFootage: first?.squareFootage,
          areas: first?.areas,
          features: first?.features,
          includeSchluterMaterials: first?.includeSchluterMaterials,
          projectDetails: first?.projectDetails,
          // New: full list of projects
          projects: projectsPayload,
          hasPhotos: hasAnyPhotos,
          // Photos already uploaded to blob via /api/quote/photos-stage —
          // pass URLs so the backend can create QuotePhoto rows directly.
          stagedPhotos: allProjects.flatMap((p) => {
            const projName = p.categoryLabel || p.projectType || "";
            return [
              ...(p.areaPhotos || []).map((sp) => ({
                url: sp.url,
                category: "area",
                projectName: projName,
                filename: sp.filename,
              })),
              ...(p.tilePhotos || []).map((sp) => ({
                url: sp.url,
                category: "tile",
                projectName: projName,
                filename: sp.filename,
              })),
            ];
          }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong");
      }

      const result = await res.json();

      // Photos are already uploaded (staged at /api/quote/photos-stage when
      // the customer picked them). The quote-request route created the
      // QuotePhoto rows from the stagedPhotos field we sent above. Nothing
      // to do here.

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Please call us instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-white">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy">Request Submitted</h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            We received your project details and will get back to you shortly with a quote.
          </p>
          {photoWarning && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
              <p className="text-sm text-amber-900 font-medium mb-1">Heads up about your photos:</p>
              <p className="text-sm text-amber-800">{photoWarning}</p>
            </div>
          )}
          <a href="/" className="mt-8 inline-block text-navy font-medium hover:underline">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="py-8 sm:py-12 px-6 text-center" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2a4f7f 100%)" }}>
        <a href="/" className="text-white/60 text-sm hover:text-white transition-colors">Johnson Tile</a>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Get a Free Quote</h1>
        <p className="mt-2 text-gray-300 text-sm">Tell us about your project and we will get back to you with a detailed estimate.</p>
      </div>

      {/* Progress */}
      <div className="flex justify-center gap-2 py-6">
        {(["contact", "project", "details", "photos", "review"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              (["contact", "project", "details", "photos", "review"] as Step[]).indexOf(step) >= i
                ? "bg-navy w-10" : "bg-gray-200 w-6"
            }`}
          />
        ))}
      </div>

      <div className="max-w-lg mx-auto px-6 pb-20">
        {/* Step: Contact */}
        {step === "contact" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-navy">Your Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Address *</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none" placeholder="Where is the project?" />
            </div>
            <button onClick={() => setStep("project")} disabled={!name || !phone || !address}
              className="w-full py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        )}

        {/* Step: Project Type */}
        {step === "project" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-navy">What type of project?</h2>
            <div className="space-y-3">
              {PROJECT_TYPES.map((t) => (
                <button key={t} onClick={() => { setProjectType(t); initAreasForProject(t); }}
                  className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all ${
                    projectType === t ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("contact")} className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={() => setStep("details")} disabled={!projectType}
                className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-navy">Project Details</h2>

            {/* Category label — required for all project types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <p className="text-gray-500 text-xs mb-2">A short name so we both know which project this is (especially useful if you have more than one).</p>
              <input
                type="text"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                placeholder={categoryLabelPlaceholder}
              />
            </div>

            {/* ===== TILE REPAIR: simplified form ===== */}
            {projectType === "Tile Repair" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Describe the repair needed *</label>
                  <textarea value={repairDescription} onChange={(e) => setRepairDescription(e.target.value)} rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none resize-none"
                    placeholder="What needs to be repaired? (e.g. cracked tiles in shower floor, grout crumbling on bathroom wall, loose tiles near tub)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tile description</label>
                  <p className="text-gray-500 text-xs mb-2">Help us match your existing tile — size, shape, color, brand if known.</p>
                  <input
                    type="text"
                    value={repairTileDescription}
                    onChange={(e) => setRepairTileDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                    placeholder="e.g. 12x24 white subway tile, grey hex penny round"
                  />
                </div>

                {/* Mortar & grout for tile repair */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you want mortar and grout included in your quote?
                  </label>
                  <div className="flex gap-3 mb-3">
                    <button onClick={() => setIncludeMortarGrout(true)}
                      className={`flex-1 px-3 py-3 rounded-lg border-2 text-sm transition-all ${includeMortarGrout ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>Yes</button>
                    <button onClick={() => { setIncludeMortarGrout(false); setMortarSelected(false); setPremixedGroutSelected(false); setSandedGroutSelected(false); setNonsandedGroutSelected(false); }}
                      className={`flex-1 px-3 py-3 rounded-lg border-2 text-sm transition-all ${!includeMortarGrout ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>No</button>
                  </div>
                  {includeMortarGrout && (
                    <div className="space-y-2 pl-2 border-l-2 border-navy/20">
                      <p className="text-xs text-gray-500">Select what you need:</p>
                      {[
                        { state: mortarSelected, setter: setMortarSelected, label: "Mortar" },
                        { state: premixedGroutSelected, setter: setPremixedGroutSelected, label: "Premixed Grout" },
                        { state: sandedGroutSelected, setter: setSandedGroutSelected, label: "Sanded Grout" },
                        { state: nonsandedGroutSelected, setter: setNonsandedGroutSelected, label: "Non-Sanded Grout" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <input type="checkbox" id={`repair-mg-${item.label}`} checked={item.state} onChange={(e) => item.setter(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy" />
                          <label htmlFor={`repair-mg-${item.label}`} className="text-sm text-gray-600">{item.label}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ===== NON-REPAIR project types ===== */}
            {projectType !== "Tile Repair" && (
              <>
                <p className="text-gray-500 text-sm">Add each area you need tiled. You can add multiple areas.</p>

                {/* Dynamic area cards */}
                {areas.map((area, i) => (
                  <AreaCard
                    key={area.id}
                    area={area}
                    index={i}
                    areaTypeOptions={areaTypeOptions}
                    onUpdate={(updated) => updateArea(area.id, updated)}
                    onRemove={() => removeArea(area.id)}
                    canRemove={areas.length > 1}
                    allAreas={areas}
                  />
                ))}

                {/* Add area button */}
                <button
                  type="button"
                  onClick={addArea}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 font-medium text-sm hover:border-navy hover:text-navy hover:bg-navy/5 transition-all"
                >
                  + Add Another Area
                </button>

                {/* Features — only for project types that have them */}
                {featureOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Features you want (select all that apply)</label>
                    <div className="space-y-2">
                      {featureOptions.map((f) => (
                        <button key={f} onClick={() => toggleFeature(f)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                            features.includes(f) ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}>
                          {features.includes(f) ? "✓ " : ""}{f}
                        </button>
                      ))}
                    </div>
                    {/* Custom feature text input */}
                    <div className="mt-2">
                      <input
                        type="text"
                        value={customFeature}
                        onChange={(e) => setCustomFeature(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                        placeholder="Other feature not listed above"
                      />
                    </div>
                  </div>
                )}

                {/* Materials question — varies by project type */}
                {projectType === "Backsplash Tile" ? (
                  /* Backsplash: mortar & grout instead of waterproofing */
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Do you want mortar and grout included in your quote?
                    </label>
                    <div className="flex gap-3 mb-3">
                      <button onClick={() => setIncludeMortarGrout(true)}
                        className={`flex-1 px-3 py-3 rounded-lg border-2 text-sm transition-all ${includeMortarGrout ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>Yes</button>
                      <button onClick={() => { setIncludeMortarGrout(false); setMortarSelected(false); setPremixedGroutSelected(false); setSandedGroutSelected(false); setNonsandedGroutSelected(false); }}
                        className={`flex-1 px-3 py-3 rounded-lg border-2 text-sm transition-all ${!includeMortarGrout ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>No</button>
                    </div>
                    {includeMortarGrout && (
                      <div className="space-y-2 pl-2 border-l-2 border-navy/20">
                        <p className="text-xs text-gray-500">Select what you need:</p>
                        {[
                          { state: mortarSelected, setter: setMortarSelected, label: "Mortar" },
                          { state: premixedGroutSelected, setter: setPremixedGroutSelected, label: "Premixed Grout" },
                          { state: sandedGroutSelected, setter: setSandedGroutSelected, label: "Sanded Grout" },
                          { state: nonsandedGroutSelected, setter: setNonsandedGroutSelected, label: "Non-Sanded Grout" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            <input type="checkbox" id={`bs-mg-${item.label}`} checked={item.state} onChange={(e) => item.setter(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy" />
                            <label htmlFor={`bs-mg-${item.label}`} className="text-sm text-gray-600">{item.label}</label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* All other project types: materials question (Schluter brand) */
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Do you want materials included in your quote?
                      <span className="font-normal text-gray-500"> (all materials are Schluter brand)</span>
                    </label>
                    <div className="flex gap-3">
                      {["Yes", "No", "Not sure"].map((opt) => (
                        <button key={opt} onClick={() => setIncludeSchluterMaterials(opt)}
                          className={`flex-1 px-3 py-3 rounded-lg border-2 text-sm transition-all ${
                            includeSchluterMaterials === opt ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anything else we should know?</label>
                  <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none resize-none"
                    placeholder="Tile preferences, special requirements, etc." />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep("project")} className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={() => setStep("photos")} disabled={!categoryLabel.trim() || (projectType === "Tile Repair" && !repairDescription.trim())}
                className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
          </div>
        )}

        {/* Step: Photos */}
        {step === "photos" && (() => {
          const isTileRepair = projectType === "Tile Repair";
          const repairPhotosValid = isTileRepair ? areaPhotos.length > 0 : true;
          const canProceed = isTileRepair
            ? areaPhotos.length > 0  // mandatory for repair
            : (declinePhotos || areaPhotos.length > 0 || tilePhotos.length > 0);
          return (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-navy">Photos</h2>

            {isTileRepair && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-900 text-sm font-medium">Photos are required for tile repair quotes.</p>
                <p className="text-amber-800 text-xs mt-1">Please upload at least one photo of the area that needs repair so we can assess the scope of work.</p>
              </div>
            )}

            {!declinePhotos && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {isTileRepair ? "Photos of the area needing repair *" : "Photos of the area to be tiled"}
                  </p>
                  <p className="text-gray-500 text-xs mb-3">This helps us give you the most accurate estimate.</p>
                  <label htmlFor="area-photo-upload"
                    className={`block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${photoStaging.area ? "border-gray-300 bg-gray-50 cursor-wait" : "border-gray-300 hover:border-navy hover:bg-navy/5"}`}>
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-navy font-medium text-sm">{photoStaging.area ? "Compressing & uploading…" : "Tap to add area photos"}</p>
                    <p className="text-gray-400 text-xs mt-1">Shower, floor, walls, kitchen, etc.</p>
                  </label>
                  <input id="area-photo-upload" type="file" accept="image/*" multiple className="hidden"
                    disabled={photoStaging.area}
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      e.target.value = "";
                      if (files.length > 0) handlePhotoSelect(files, "area");
                    }} />
                  {areaPhotos.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {areaPhotos.map((p, i) => (
                        <li key={p.url} className="flex items-center justify-between text-sm">
                          <span className="text-navy font-medium truncate flex-1">✓ {p.filename}</span>
                          <button type="button" onClick={() => removeStagedPhoto("area", i)} className="text-red-600 text-xs ml-3 hover:underline">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Photos of your tile</p>
                  <p className="text-gray-500 text-xs mb-3">If you have your tile picked out, a photo helps us prepare.</p>
                  <label htmlFor="tile-photo-upload"
                    className={`block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${photoStaging.tile ? "border-gray-300 bg-gray-50 cursor-wait" : "border-gray-300 hover:border-navy hover:bg-navy/5"}`}>
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    <p className="text-navy font-medium text-sm">{photoStaging.tile ? "Compressing & uploading…" : "Tap to add tile photos"}</p>
                    <p className="text-gray-400 text-xs mt-1">Box label, store listing, or the tile itself</p>
                  </label>
                  <input id="tile-photo-upload" type="file" accept="image/*" multiple className="hidden"
                    disabled={photoStaging.tile}
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      e.target.value = "";
                      if (files.length > 0) handlePhotoSelect(files, "tile");
                    }} />
                  {tilePhotos.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {tilePhotos.map((p, i) => (
                        <li key={p.url} className="flex items-center justify-between text-sm">
                          <span className="text-navy font-medium truncate flex-1">✓ {p.filename}</span>
                          <button type="button" onClick={() => removeStagedPhoto("tile", i)} className="text-red-600 text-xs ml-3 hover:underline">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {photoStageError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{photoStageError}</p>
                  </div>
                )}
              </>
            )}

            {/* Decline photos — NOT available for Tile Repair */}
            {!isTileRepair && (
              <div className="flex items-start gap-3 pt-2">
                <input type="checkbox" id="decline-photos" checked={declinePhotos}
                  onChange={(e) => { setDeclinePhotos(e.target.checked); if (e.target.checked) { setAreaPhotos([]); setTilePhotos([]); } }}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-navy focus:ring-navy" />
                <label htmlFor="decline-photos" className="text-sm text-gray-600">
                  I prefer not to send photos right now. I understand this may affect the accuracy of my estimate.
                </label>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep("details")} className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={() => setStep("review")} disabled={!canProceed}
                className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">Review</button>
            </div>
          </div>
          );
        })()}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-navy">Review Your Request</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-5 space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact</h3>
                <p className="text-navy font-medium">{name}</p>
                <p className="text-gray-600 text-sm">{phone}</p>
                {email && <p className="text-gray-600 text-sm">{email}</p>}
                <p className="text-gray-600 text-sm">{address}</p>
              </div>

              {/* Render each saved project as a card. When editing, the live form's content overrides the snapshot at that index. */}
              {savedProjects.map((savedProj, index) => {
                const isBeingEdited = editingIndex === index;
                // When this slot is being edited, render the live state instead of the snapshot
                const proj: SavedProject = isBeingEdited
                  ? {
                      id: savedProj.id,
                      projectType,
                      categoryLabel,
                      areas,
                      features,
                      customFeature,
                      details,
                      includeSchluterMaterials,
                      repairDescription,
                      repairTileDescription,
                      includeMortarGrout,
                      mortarSelected,
                      premixedGroutSelected,
                      sandedGroutSelected,
                      nonsandedGroutSelected,
                      areaPhotos,
                      tilePhotos,
                    }
                  : savedProj;
                const projIsFloor = proj.projectType === "Floor Tile";
                const projAreaTypeOptions = AREA_TYPES_BY_PROJECT[proj.projectType] || [];
                const projAreaDisplayName = (a: AreaEntry) =>
                  projAreaTypeOptions.find((o) => o.key === a.areaType)?.label ||
                  AREA_TYPES_BY_PROJECT["Other"]?.find((o) => o.key === a.areaType)?.label ||
                  a.areaType;
                return (
                  <div key={savedProj.id} className="bg-gray-50 rounded-xl p-5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        {proj.categoryLabel || proj.projectType}
                      </h3>
                      <div className="flex gap-2 text-xs">
                        {!isBeingEdited && (
                          <button
                            onClick={() => editSavedProject(index)}
                            className="text-navy font-medium hover:underline"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => removeSavedProject(index)}
                          className="text-red-600 font-medium hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="text-navy font-medium">
                      {proj.projectType}
                      {proj.categoryLabel ? ` — ${proj.categoryLabel}` : ""}
                    </p>
                    {/* Tile Repair review */}
                    {proj.projectType === "Tile Repair" && (
                      <>
                        {proj.repairDescription && <p className="text-gray-600 text-sm">{proj.repairDescription}</p>}
                        {proj.repairTileDescription && <p className="text-gray-600 text-sm">Tile: {proj.repairTileDescription}</p>}
                      </>
                    )}
                    {/* Standard areas review */}
                    {proj.projectType !== "Tile Repair" && proj.areas.filter((a) => calcSqft(a.areaType, a.dimensions) > 0).map((area) => (
                      <div key={area.id} className="text-gray-600 text-sm">
                        <p>{areaReviewText(area.areaType, area.dimensions, projAreaDisplayName(area), area.layout)} — {tileDisplayLabel(area.tileSize) || "not specified"}</p>
                        {area.groutWidth && <p className="text-xs text-gray-500 pl-2">Grout: {area.groutWidth === "other" ? area.groutWidthCustom : GROUT_WIDTHS.find(g => g.key === area.groutWidth)?.label || area.groutWidth}</p>}
                        {area.heatedFloor && <p className="text-xs text-gray-500 pl-2">🔥 Heated floors (DITRA-HEAT)</p>}
                        {area.drainType && <p className="text-xs text-gray-500 pl-2">Drain: {DRAIN_OPTIONS.find(d => d.key === area.drainType)?.label}{area.drainStyle ? ` — ${area.drainStyle}` : ""}{area.drainColor ? ` (${area.drainColor})` : ""}</p>}
                      </div>
                    ))}
                    {proj.features.length > 0 && (
                      <p className="text-gray-600 text-sm">{proj.features.join(", ")}</p>
                    )}
                    {proj.customFeature && (
                      <p className="text-gray-600 text-sm">Other feature: {proj.customFeature}</p>
                    )}
                    {proj.includeSchluterMaterials && proj.projectType !== "Backsplash Tile" && proj.projectType !== "Tile Repair" && (
                      <p className="text-gray-600 text-sm">
                        Materials (Schluter): {proj.includeSchluterMaterials}
                      </p>
                    )}
                    {proj.includeMortarGrout && (
                      <p className="text-gray-600 text-sm">
                        Mortar & grout: {[proj.mortarSelected && "Mortar", proj.premixedGroutSelected && "Premixed Grout", proj.sandedGroutSelected && "Sanded Grout", proj.nonsandedGroutSelected && "Non-Sanded Grout"].filter(Boolean).join(", ") || "Yes"}
                      </p>
                    )}
                    {proj.details && <p className="text-gray-600 text-sm">{proj.details}</p>}
                    {((proj.areaPhotos?.length || 0) > 0 || (proj.tilePhotos?.length || 0) > 0) && (
                      <p className="text-gray-600 text-sm">
                        {(proj.areaPhotos?.length || 0) > 0 && `${proj.areaPhotos.length} area photo${proj.areaPhotos.length === 1 ? "" : "s"}`}
                        {(proj.areaPhotos?.length || 0) > 0 && (proj.tilePhotos?.length || 0) > 0 && ", "}
                        {(proj.tilePhotos?.length || 0) > 0 && `${proj.tilePhotos.length} tile photo${proj.tilePhotos.length === 1 ? "" : "s"}`}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Live (current, not-yet-saved) project — only shown if it has content and we're NOT editing a saved one */}
              {projectType && editingIndex === null && (
                <div className="bg-gray-50 rounded-xl p-5 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {categoryLabel || projectType}
                  </h3>
                  <p className="text-navy font-medium">{projectType}{categoryLabel ? ` — ${categoryLabel}` : ""}</p>
                  {/* Tile Repair live review */}
                  {projectType === "Tile Repair" && (
                    <>
                      {repairDescription && <p className="text-gray-600 text-sm">{repairDescription}</p>}
                      {repairTileDescription && <p className="text-gray-600 text-sm">Tile: {repairTileDescription}</p>}
                    </>
                  )}
                  {/* Standard areas live review */}
                  {projectType !== "Tile Repair" && areas.filter((a) => calcSqft(a.areaType, a.dimensions) > 0).map((area) => (
                    <div key={area.id} className="text-gray-600 text-sm">
                      <p>{areaReviewText(area.areaType, area.dimensions, areaDisplayName(area), area.layout)} — {tileDisplayLabel(area.tileSize) || "not specified"}</p>
                      {area.groutWidth && <p className="text-xs text-gray-500 pl-2">Grout: {area.groutWidth === "other" ? area.groutWidthCustom : GROUT_WIDTHS.find(g => g.key === area.groutWidth)?.label || area.groutWidth}</p>}
                      {area.heatedFloor && <p className="text-xs text-gray-500 pl-2">🔥 Heated floors (DITRA-HEAT)</p>}
                      {area.drainType && <p className="text-xs text-gray-500 pl-2">Drain: {DRAIN_OPTIONS.find(d => d.key === area.drainType)?.label}{area.drainStyle ? ` — ${area.drainStyle}` : ""}{area.drainColor ? ` (${area.drainColor})` : ""}</p>}
                    </div>
                  ))}
                  {features.length > 0 && <p className="text-gray-600 text-sm">{features.join(", ")}</p>}
                  {customFeature && <p className="text-gray-600 text-sm">Other feature: {customFeature}</p>}
                  {includeSchluterMaterials && projectType !== "Backsplash Tile" && projectType !== "Tile Repair" && <p className="text-gray-600 text-sm">Materials (Schluter): {includeSchluterMaterials}</p>}
                  {includeMortarGrout && (
                    <p className="text-gray-600 text-sm">
                      Mortar & grout: {[mortarSelected && "Mortar", premixedGroutSelected && "Premixed Grout", sandedGroutSelected && "Sanded Grout", nonsandedGroutSelected && "Non-Sanded Grout"].filter(Boolean).join(", ") || "Yes"}
                    </p>
                  )}
                  {details && <p className="text-gray-600 text-sm">{details}</p>}
                  {(areaPhotos.length > 0 || tilePhotos.length > 0) && (
                    <p className="text-gray-600 text-sm">
                      {areaPhotos.length > 0 && `${areaPhotos.length} area photo${areaPhotos.length === 1 ? "" : "s"}`}
                      {areaPhotos.length > 0 && tilePhotos.length > 0 && ", "}
                      {tilePhotos.length > 0 && `${tilePhotos.length} tile photo${tilePhotos.length === 1 ? "" : "s"}`}
                    </p>
                  )}
                </div>
              )}

              {/* Add another project button */}
              <button
                onClick={addAnotherProject}
                className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 font-medium text-sm hover:border-navy hover:text-navy hover:bg-navy/5 transition-all"
              >
                + Add another project
              </button>

              {declinePhotos && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-gray-500 text-sm">No photos attached for any project</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep("photos")} className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-green hover:bg-green-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
