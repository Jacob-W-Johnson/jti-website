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
    "Floating Bench",
    "Corner Shelf",
    "Custom Curb",
    "Schluter Drain",
  ],
  "Shower": [
    "Niche (built-in shelf)",
    "Corner Bench",
    "Floating Bench",
    "Corner Shelf",
    "Custom Curb",
    "Schluter Drain",
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
    "Floating Bench",
    "Corner Shelf",
    "Custom Curb",
    "Schluter Drain",
  ],
};

// Area types available per project type
const AREA_TYPES_BY_PROJECT: Record<string, { key: string; label: string }[]> = {
  "Bathroom Remodel": [
    { key: "bathroom_floor", label: "Bathroom Floor" },
    { key: "shower_floor", label: "Shower Floor" },
    { key: "shower_walls", label: "Shower Walls" },
    { key: "tub_surround_walls", label: "Tub Surround Walls" },
    { key: "backsplash", label: "Backsplash" },
  ],
  "Shower": [
    { key: "shower_floor", label: "Shower Floor" },
    { key: "shower_walls", label: "Shower Walls" },
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

type AreaEntry = {
  id: string;
  areaType: string;
  sqft: string;
  tileSize: TileSize;
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
  details: string;
  includeSchluterMaterials: string;
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

// Single area card component
function AreaCard({
  area,
  index,
  areaTypeOptions,
  onUpdate,
  onRemove,
  canRemove,
}: {
  area: AreaEntry;
  index: number;
  areaTypeOptions: { key: string; label: string }[];
  onUpdate: (updated: AreaEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const areaLabel = areaTypeOptions.find((o) => o.key === area.areaType)?.label || area.areaType;

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
        onChange={(v) => onUpdate({ ...area, areaType: v })}
        options={areaTypeOptions}
      />

      {/* Square footage */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Square footage</label>
        <input
          type="text"
          value={area.sqft}
          onChange={(e) => onUpdate({ ...area, sqft: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
          placeholder="Best guess is fine"
        />
      </div>

      {/* Tile size picker */}
      <TileSizePicker
        size={area.tileSize}
        onChange={(ts) => onUpdate({ ...area, tileSize: ts })}
      />
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
  const [details, setDetails] = useState("");
  const [includeSchluterMaterials, setIncludeSchluterMaterials] = useState("");

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
        sqft: "",
        tileSize: { ...emptyTileSize },
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
      details,
      includeSchluterMaterials,
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
    setDetails("");
    setIncludeSchluterMaterials("");
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
    setDetails(p.details);
    setIncludeSchluterMaterials(p.includeSchluterMaterials);
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
        sqft: "",
        tileSize: { ...emptyTileSize },
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
        tub_surround_walls: "Tub Surround Walls",
        floor: "Floor",
        backsplash: "Backsplash",
      };

      // Combine saved projects + the live current project (if it has content)
      // Editing case: current project is a copy of savedProjects[editingIndex] — replace, don't append
      const allProjects: SavedProject[] = (() => {
        const liveHasContent = projectType && (areas.some((a) => a.sqft) || categoryLabel.trim());
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
            if (!area.sqft) return null;
            return {
              areaType: area.areaType,
              sqft: parseFloat(area.sqft) || 0,
              tileShape: area.tileSize.shape,
              tileDim1: area.tileSize.dim1,
              tileDim2: area.tileSize.dim2,
              tileHexSize: area.tileSize.hexSize,
              tileSqft: tileSqft(area.tileSize),
              tileDescription: tileDisplayLabel(area.tileSize),
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
            proj.includeSchluterMaterials &&
              `Schluter setting materials: ${proj.includeSchluterMaterials}`,
            proj.details && proj.details,
          ]
            .filter(Boolean)
            .join("\n") || undefined;

        return {
          projectType: proj.projectType,
          projectName: proj.categoryLabel || undefined,
          squareFootage,
          areas: builtAreas,
          features: proj.features.length > 0 ? proj.features : undefined,
          includeSchluterMaterials: proj.includeSchluterMaterials === "Yes",
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
            <p className="text-gray-500 text-sm">Add each area you need tiled. You can add multiple areas.</p>

            {/* Category label — required */}
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

            {featureOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features you want (select all that apply)</label>
                <div className="space-y-2">
                  {featureOptions.map((f) => (
                    <button key={f} onClick={() => toggleFeature(f)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                        features.includes(f) ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      {features.includes(f) ? "+ " : ""}{f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isFloor
                  ? "Do you want Schluter setting materials included in your quote?"
                  : "Do you want waterproofing materials included in your quote?"}
              </label>
              <div className="flex gap-3">
                {["Yes", "No", "Not sure"].map((opt) => (
                  <button key={opt} onClick={() => setIncludeSchluterMaterials(opt)}
                    className={`flex-1 px-3 py-3 rounded-lg border-2 text-sm transition-all ${
                      includeSchluterMaterials === opt ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                    {opt}{opt === "Yes" && isFloor ? " (recommended)" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anything else we should know?</label>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none resize-none"
                placeholder="Tile preferences, special requirements, etc." />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("project")} className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={() => setStep("photos")} disabled={!categoryLabel.trim()}
                className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">Next</button>
            </div>
          </div>
        )}

        {/* Step: Photos */}
        {step === "photos" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-navy">Photos</h2>

            {!declinePhotos && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Photos of the area to be tiled</p>
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
                      // Copy files to a real Array BEFORE clearing input —
                      // iOS Safari invalidates the FileList when value is reset.
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
                      // Copy files to a real Array BEFORE clearing input —
                      // iOS Safari invalidates the FileList when value is reset.
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

            <div className="flex items-start gap-3 pt-2">
              <input type="checkbox" id="decline-photos" checked={declinePhotos}
                onChange={(e) => { setDeclinePhotos(e.target.checked); if (e.target.checked) { setAreaPhotos([]); setTilePhotos([]); } }}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-navy focus:ring-navy" />
              <label htmlFor="decline-photos" className="text-sm text-gray-600">
                I prefer not to send photos right now. I understand this may affect the accuracy of my estimate.
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("details")} className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={() => setStep("review")} disabled={!declinePhotos && areaPhotos.length === 0 && tilePhotos.length === 0}
                className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">Review</button>
            </div>
          </div>
        )}

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
                      details,
                      includeSchluterMaterials,
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
                    {proj.areas.filter((a) => a.sqft).map((area) => (
                      <p key={area.id} className="text-gray-600 text-sm">
                        {projAreaDisplayName(area)}: {area.sqft} sq ft — {tileDisplayLabel(area.tileSize) || "not specified"}
                      </p>
                    ))}
                    {proj.features.length > 0 && (
                      <p className="text-gray-600 text-sm">{proj.features.join(", ")}</p>
                    )}
                    {proj.includeSchluterMaterials && (
                      <p className="text-gray-600 text-sm">
                        {projIsFloor ? "Schluter setting materials" : "Waterproofing materials"}: {proj.includeSchluterMaterials}
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
                  {areas.filter((a) => a.sqft).map((area) => (
                    <p key={area.id} className="text-gray-600 text-sm">
                      {areaDisplayName(area)}: {area.sqft} sq ft — {tileDisplayLabel(area.tileSize) || "not specified"}
                    </p>
                  ))}
                  {features.length > 0 && <p className="text-gray-600 text-sm">{features.join(", ")}</p>}
                  {includeSchluterMaterials && <p className="text-gray-600 text-sm">{isFloor ? "Schluter setting materials" : "Waterproofing materials"}: {includeSchluterMaterials}</p>}
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
