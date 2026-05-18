"use client";

import { useState, useRef, useEffect } from "react";

const QUOTE_API = "https://quotes.johnsontileinstallation.com/api/quote/request";

const PROJECT_TYPES = [
  "Shower / Bathroom Remodel",
  "Floor Tile",
  "Backsplash",
  "Tile Repair",
  "Other",
];

const SHOWER_FEATURES = [
  "Niche (built-in shelf)",
  "Corner Bench",
  "Floating Bench",
  "Corner Shelf",
  "Custom Curb",
  "Schluter Drain",
];

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
          <span className="pb-3 text-gray-400 font-bold">×</span>
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

type Step = "contact" | "project" | "details" | "photos" | "review";

const emptyTileSize: TileSize = { shape: "", dim1: 0, dim2: 0, hexSize: "", customDesc: "" };

export default function QuotePage() {
  const [step, setStep] = useState<Step>("contact");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Contact
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Project
  const [projectType, setProjectType] = useState("");

  // Details
  const [showerFloorSqft, setShowerFloorSqft] = useState("");
  const [showerFloorTile, setShowerFloorTile] = useState<TileSize>({ ...emptyTileSize });
  const [bathroomFloorSqft, setBathroomFloorSqft] = useState("");
  const [bathroomFloorTile, setBathroomFloorTile] = useState<TileSize>({ ...emptyTileSize });
  const [showerWallsSqft, setShowerWallsSqft] = useState("");
  const [showerWallsTile, setShowerWallsTile] = useState<TileSize>({ ...emptyTileSize });
  const [floorSqft, setFloorSqft] = useState("");
  const [floorTile, setFloorTile] = useState<TileSize>({ ...emptyTileSize });
  const [backsplashSqft, setBacksplashSqft] = useState("");
  const [backsplashTile, setBacksplashTile] = useState<TileSize>({ ...emptyTileSize });
  const [hasAdditionalTile, setHasAdditionalTile] = useState(false);
  const [additionalTileExplanation, setAdditionalTileExplanation] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [tileOnSite, setTileOnSite] = useState("");
  const [includeSchluterMaterials, setIncludeSchluterMaterials] = useState("");
  const [readyDate, setReadyDate] = useState("");

  // Photos
  const [declinePhotos, setDeclinePhotos] = useState(false);
  const [areaPhotos, setAreaPhotos] = useState<File[]>([]);
  const [tilePhotos, setTilePhotos] = useState<File[]>([]);

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

  const isShower = projectType === "Shower / Bathroom Remodel";
  const isFloor = projectType === "Floor Tile";

  // Build area data for submission
  function buildArea(areaType: string, sqft: string, tile: TileSize) {
    if (!sqft) return null;
    return {
      areaType,
      sqft: parseFloat(sqft) || 0,
      tileShape: tile.shape,
      tileDim1: tile.dim1,
      tileDim2: tile.dim2,
      tileHexSize: tile.hexSize,
      tileSqft: tileSqft(tile),
      tileDescription: tileDisplayLabel(tile),
    };
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const areas = [
        buildArea("shower_floor", showerFloorSqft, showerFloorTile),
        buildArea("bathroom_floor", bathroomFloorSqft, bathroomFloorTile),
        buildArea("shower_walls", showerWallsSqft, showerWallsTile),
        buildArea("floor", floorSqft, floorTile),
        buildArea("backsplash", backsplashSqft, backsplashTile),
      ].filter(Boolean);

      const hasAnyPhotos = !declinePhotos && (areaPhotos.length > 0 || tilePhotos.length > 0);

      const res = await fetch(QUOTE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email || undefined,
          siteAddress: address,
          projectType,
          squareFootage: areas.map((a) => {
            const area = a as { areaType: string; sqft: number; tileDescription: string };
            const nameMap: Record<string, string> = {
              shower_floor: "Shower Floor",
              bathroom_floor: "Bathroom Floor",
              shower_walls: "Shower Walls",
              floor: "Floor",
              backsplash: "Backsplash",
            };
            return `${nameMap[area.areaType] || area.areaType}: ${area.sqft} sqft (${area.tileDescription})`;
          }).join(", ") || undefined,
          areas,
          features: features.length > 0 ? features : undefined,
          includeSchluterMaterials: includeSchluterMaterials === "Yes",
          projectDetails: [
            tileOnSite && `Tile on site: ${tileOnSite}`,
            includeSchluterMaterials && `Schluter setting materials: ${includeSchluterMaterials}`,
            readyDate && `Ready for installation: ${readyDate}`,
            hasAdditionalTile && `Additional tile: ${additionalTileExplanation}`,
            details && details,
          ].filter(Boolean).join("\n") || undefined,
          timeline: readyDate || undefined,
          hasPhotos: hasAnyPhotos,
          hasAreaPhotos: areaPhotos.length > 0,
          hasTilePhotos: tilePhotos.length > 0,
          photoUrls: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong");
      }

      const result = await res.json();

      // Upload photos if any
      if (hasAnyPhotos && result.quoteId) {
        const PHOTO_API = "https://quotes.johnsontileinstallation.com/api/quote/photos";

        if (areaPhotos.length > 0) {
          const areaForm = new FormData();
          areaForm.append("quoteId", result.quoteId);
          areaForm.append("category", "area");
          for (const file of areaPhotos) {
            areaForm.append("photos", file);
          }
          await fetch(PHOTO_API, { method: "POST", body: areaForm }).catch((err) =>
            console.error("Area photo upload failed:", err)
          );
        }

        if (tilePhotos.length > 0) {
          const tileForm = new FormData();
          tileForm.append("quoteId", result.quoteId);
          tileForm.append("category", "tile");
          for (const file of tilePhotos) {
            tileForm.append("photos", file);
          }
          await fetch(PHOTO_API, { method: "POST", body: tileForm }).catch((err) =>
            console.error("Tile photo upload failed:", err)
          );
        }
      }

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
                <button key={t} onClick={() => setProjectType(t)}
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

            {isShower && (
              <>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-navy">Shower Floor</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Square footage</label>
                    <input type="text" value={showerFloorSqft} onChange={(e) => setShowerFloorSqft(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none" placeholder="Best guess is fine" />
                  </div>
                  <TileSizePicker size={showerFloorTile} onChange={setShowerFloorTile} />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-navy">Bathroom Floor</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Square footage</label>
                    <input type="text" value={bathroomFloorSqft} onChange={(e) => setBathroomFloorSqft(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none" placeholder="If applicable" />
                  </div>
                  <TileSizePicker size={bathroomFloorTile} onChange={setBathroomFloorTile} />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-navy">Shower Walls</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Square footage</label>
                    <input type="text" value={showerWallsSqft} onChange={(e) => setShowerWallsSqft(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none" placeholder="Best guess is fine" />
                  </div>
                  <TileSizePicker size={showerWallsTile} onChange={setShowerWallsTile} />
                </div>
              </>
            )}

            {isFloor && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-navy">Floor</p>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Square footage</label>
                  <input type="text" value={floorSqft} onChange={(e) => setFloorSqft(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none" placeholder="Best guess is fine" />
                </div>
                <TileSizePicker size={floorTile} onChange={setFloorTile} />
              </div>
            )}

            {projectType === "Backsplash" && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-navy">Backsplash</p>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Square footage</label>
                  <input type="text" value={backsplashSqft} onChange={(e) => setBacksplashSqft(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none" placeholder="Best guess is fine" />
                </div>
                <TileSizePicker size={backsplashTile} onChange={setBacksplashTile} />
              </div>
            )}

            {/* Additional tile */}
            <div>
              <button onClick={() => setHasAdditionalTile(!hasAdditionalTile)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                  hasAdditionalTile ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                {hasAdditionalTile ? "+ " : ""}I have additional tile for another area
              </button>
              {hasAdditionalTile && (
                <textarea value={additionalTileExplanation} onChange={(e) => setAdditionalTileExplanation(e.target.value)} rows={3}
                  className="mt-3 w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none resize-none"
                  placeholder="Describe the area, tile shape/dimensions, and approximate square footage" />
              )}
            </div>

            {isShower && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features you want (select all that apply)</label>
                <div className="space-y-2">
                  {SHOWER_FEATURES.map((f) => (
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Do you have your tile on site?</label>
              <div className="flex gap-3">
                {["Yes", "No", "Not yet"].map((opt) => (
                  <button key={opt} onClick={() => setTileOnSite(opt)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                      tileOnSite === opt ? "border-navy bg-navy/5 text-navy font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">When will you be ready for installation to start?</label>
              <input type="text" value={readyDate} onChange={(e) => setReadyDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none" placeholder="e.g. Next week, March 15, ASAP" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anything else we should know?</label>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none resize-none"
                placeholder="Tile preferences, special requirements, etc." />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("project")} className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={() => setStep("photos")} className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light transition-colors">Next</button>
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
                    className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-navy hover:bg-navy/5 transition-all">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-navy font-medium text-sm">Tap to add area photos</p>
                    <p className="text-gray-400 text-xs mt-1">Shower, floor, walls, kitchen, etc.</p>
                  </label>
                  <input id="area-photo-upload" type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { if (e.target.files) setAreaPhotos(Array.from(e.target.files)); }} />
                  {areaPhotos.length > 0 && <p className="mt-2 text-sm text-navy font-medium">{areaPhotos.length} area photo{areaPhotos.length > 1 ? "s" : ""} selected</p>}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Photos of your tile</p>
                  <p className="text-gray-500 text-xs mb-3">If you have your tile picked out, a photo helps us prepare.</p>
                  <label htmlFor="tile-photo-upload"
                    className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-navy hover:bg-navy/5 transition-all">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    <p className="text-navy font-medium text-sm">Tap to add tile photos</p>
                    <p className="text-gray-400 text-xs mt-1">Box label, store listing, or the tile itself</p>
                  </label>
                  <input id="tile-photo-upload" type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { if (e.target.files) setTilePhotos(Array.from(e.target.files)); }} />
                  {tilePhotos.length > 0 && <p className="mt-2 text-sm text-navy font-medium">{tilePhotos.length} tile photo{tilePhotos.length > 1 ? "s" : ""} selected</p>}
                </div>
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

              <div className="bg-gray-50 rounded-xl p-5 space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Project</h3>
                <p className="text-navy font-medium">{projectType}</p>
                {showerFloorSqft && <p className="text-gray-600 text-sm">Shower Floor: {showerFloorSqft} sq ft — {tileDisplayLabel(showerFloorTile) || "not specified"}</p>}
                {bathroomFloorSqft && <p className="text-gray-600 text-sm">Bathroom Floor: {bathroomFloorSqft} sq ft — {tileDisplayLabel(bathroomFloorTile) || "not specified"}</p>}
                {showerWallsSqft && <p className="text-gray-600 text-sm">Shower Walls: {showerWallsSqft} sq ft — {tileDisplayLabel(showerWallsTile) || "not specified"}</p>}
                {floorSqft && <p className="text-gray-600 text-sm">Floor: {floorSqft} sq ft — {tileDisplayLabel(floorTile) || "not specified"}</p>}
                {backsplashSqft && <p className="text-gray-600 text-sm">Backsplash: {backsplashSqft} sq ft — {tileDisplayLabel(backsplashTile) || "not specified"}</p>}
                {hasAdditionalTile && <p className="text-gray-600 text-sm">Additional: {additionalTileExplanation}</p>}
                {features.length > 0 && <p className="text-gray-600 text-sm">{features.join(", ")}</p>}
                {tileOnSite && <p className="text-gray-600 text-sm">Tile on site: {tileOnSite}</p>}
                {includeSchluterMaterials && <p className="text-gray-600 text-sm">{isFloor ? "Schluter setting materials" : "Waterproofing materials"}: {includeSchluterMaterials}</p>}
                {readyDate && <p className="text-gray-600 text-sm">Ready to start: {readyDate}</p>}
                {details && <p className="text-gray-600 text-sm">{details}</p>}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Photos</h3>
                {declinePhotos ? (
                  <p className="text-gray-500 text-sm">No photos attached</p>
                ) : (
                  <div className="space-y-1">
                    {areaPhotos.length > 0 && <p className="text-navy text-sm font-medium">{areaPhotos.length} area photo{areaPhotos.length > 1 ? "s" : ""}</p>}
                    {tilePhotos.length > 0 && <p className="text-navy text-sm font-medium">{tilePhotos.length} tile photo{tilePhotos.length > 1 ? "s" : ""}</p>}
                  </div>
                )}
              </div>
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
