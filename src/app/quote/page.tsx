"use client";

import { useState } from "react";

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

type Step = "contact" | "project" | "details" | "photos" | "review";

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
  const [bathroomFloorSqft, setBathroomFloorSqft] = useState("");
  const [showerWallsSqft, setShowerWallsSqft] = useState("");
  const [floorSqft, setFloorSqft] = useState("");
  const [backsplashSqft, setBacksplashSqft] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [tileOnSite, setTileOnSite] = useState("");
  const [includeWaterproofing, setIncludeWaterproofing] = useState("");
  const [readyDate, setReadyDate] = useState("");

  // Photos
  const [declinePhotos, setDeclinePhotos] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

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

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(QUOTE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email || undefined,
          siteAddress: address,
          projectType,
          squareFootage: [
            showerFloorSqft && `Shower Floor: ${showerFloorSqft} sqft`,
            bathroomFloorSqft && `Bathroom Floor: ${bathroomFloorSqft} sqft`,
            showerWallsSqft && `Shower Walls: ${showerWallsSqft} sqft`,
            floorSqft && `Floor: ${floorSqft} sqft`,
            backsplashSqft && `Backsplash: ${backsplashSqft} sqft`,
          ].filter(Boolean).join(", ") || undefined,
          features: features.length > 0 ? features : undefined,
          projectDetails: [
            tileOnSite && `Tile on site: ${tileOnSite}`,
            includeWaterproofing && `Include waterproofing materials: ${includeWaterproofing}`,
            readyDate && `Ready for installation: ${readyDate}`,
            details && details,
          ].filter(Boolean).join("\n") || undefined,
          timeline: readyDate || undefined,
          hasPhotos: !declinePhotos && photoFiles.length > 0,
          photoUrls: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong");
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
          <a
            href="/"
            className="mt-8 inline-block text-navy font-medium hover:underline"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div
        className="py-8 sm:py-12 px-6 text-center"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2a4f7f 100%)" }}
      >
        <a href="/" className="text-white/60 text-sm hover:text-white transition-colors">
          Johnson Tile
        </a>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
          Get a Free Quote
        </h1>
        <p className="mt-2 text-gray-300 text-sm">
          Tell us about your project and we will get back to you with a detailed estimate.
        </p>
      </div>

      {/* Progress */}
      <div className="flex justify-center gap-2 py-6">
        {(["contact", "project", "details", "photos", "review"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              (["contact", "project", "details", "photos", "review"] as Step[]).indexOf(step) >= i
                ? "bg-navy w-10"
                : "bg-gray-200 w-6"
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
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                placeholder="Where is the project?"
              />
            </div>

            <button
              onClick={() => setStep("project")}
              disabled={!name || !phone || !address}
              className="w-full py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
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
                <button
                  key={t}
                  onClick={() => setProjectType(t)}
                  className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all ${
                    projectType === t
                      ? "border-navy bg-navy/5 text-navy font-medium"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("contact")}
                className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("details")}
                disabled={!projectType}
                className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-navy">Project Details</h2>

            {/* Square footage fields based on project type */}
            {isShower && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shower Floor (sq ft)
                  </label>
                  <input
                    type="text"
                    value={showerFloorSqft}
                    onChange={(e) => setShowerFloorSqft(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                    placeholder="Best guess is fine"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathroom Floor (sq ft)
                  </label>
                  <input
                    type="text"
                    value={bathroomFloorSqft}
                    onChange={(e) => setBathroomFloorSqft(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                    placeholder="If applicable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shower Walls (sq ft)
                  </label>
                  <input
                    type="text"
                    value={showerWallsSqft}
                    onChange={(e) => setShowerWallsSqft(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                    placeholder="Best guess is fine"
                  />
                </div>
              </>
            )}

            {projectType === "Floor Tile" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor Area (sq ft)
                </label>
                <input
                  type="text"
                  value={floorSqft}
                  onChange={(e) => setFloorSqft(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                  placeholder="Best guess is fine"
                />
              </div>
            )}

            {projectType === "Backsplash" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Backsplash Area (sq ft)
                </label>
                <input
                  type="text"
                  value={backsplashSqft}
                  onChange={(e) => setBacksplashSqft(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                  placeholder="Best guess is fine"
                />
              </div>
            )}

            {isShower && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features you want (select all that apply)
                </label>
                <div className="space-y-2">
                  {SHOWER_FEATURES.map((f) => (
                    <button
                      key={f}
                      onClick={() => toggleFeature(f)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                        features.includes(f)
                          ? "border-navy bg-navy/5 text-navy font-medium"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="mr-2">{features.includes(f) ? "+" : ""}</span>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do you have your tile on site?
              </label>
              <div className="flex gap-3">
                {["Yes", "No", "Not yet"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setTileOnSite(opt)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                      tileOnSite === opt
                        ? "border-navy bg-navy/5 text-navy font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do you want waterproofing materials included in your quote?
              </label>
              <div className="flex gap-3">
                {["Yes", "No", "Not sure"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setIncludeWaterproofing(opt)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                      includeWaterproofing === opt
                        ? "border-navy bg-navy/5 text-navy font-medium"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When will you be ready for installation to start?
              </label>
              <input
                type="text"
                value={readyDate}
                onChange={(e) => setReadyDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none"
                placeholder="e.g. Next week, March 15, ASAP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anything else we should know?
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy outline-none resize-none"
                placeholder="Tile preferences, special requirements, etc."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("project")}
                className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("photos")}
                className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step: Photos */}
        {step === "photos" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-navy">Project Photos</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Photos help us give you the most accurate estimate. Please include pictures of the area
              where the tile work will be done.
            </p>

            {!declinePhotos && (
              <div>
                <label
                  htmlFor="photo-upload"
                  className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-navy hover:bg-navy/5 transition-all"
                >
                  <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-navy font-medium">Tap to select photos</p>
                  <p className="text-gray-400 text-xs mt-1">JPG, PNG, or HEIC</p>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setPhotoFiles(Array.from(e.target.files));
                    }
                  }}
                />

                {photoFiles.length > 0 && (
                  <p className="mt-3 text-sm text-navy font-medium">
                    {photoFiles.length} photo{photoFiles.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}

            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="decline-photos"
                checked={declinePhotos}
                onChange={(e) => {
                  setDeclinePhotos(e.target.checked);
                  if (e.target.checked) setPhotoFiles([]);
                }}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-navy focus:ring-navy"
              />
              <label htmlFor="decline-photos" className="text-sm text-gray-600">
                I prefer not to send photos right now. I understand this may affect the accuracy of my estimate.
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("details")}
                className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("review")}
                disabled={!declinePhotos && photoFiles.length === 0}
                className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-navy hover:bg-navy-light disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Review
              </button>
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
                {showerFloorSqft && <p className="text-gray-600 text-sm">Shower Floor: {showerFloorSqft} sq ft</p>}
                {bathroomFloorSqft && <p className="text-gray-600 text-sm">Bathroom Floor: {bathroomFloorSqft} sq ft</p>}
                {showerWallsSqft && <p className="text-gray-600 text-sm">Shower Walls: {showerWallsSqft} sq ft</p>}
                {floorSqft && <p className="text-gray-600 text-sm">Floor: {floorSqft} sq ft</p>}
                {backsplashSqft && <p className="text-gray-600 text-sm">Backsplash: {backsplashSqft} sq ft</p>}
                {features.length > 0 && (
                  <p className="text-gray-600 text-sm">{features.join(", ")}</p>
                )}
                {tileOnSite && <p className="text-gray-600 text-sm">Tile on site: {tileOnSite}</p>}
                {includeWaterproofing && <p className="text-gray-600 text-sm">Waterproofing materials: {includeWaterproofing}</p>}
                {readyDate && <p className="text-gray-600 text-sm">Ready to start: {readyDate}</p>}
                {details && <p className="text-gray-600 text-sm">{details}</p>}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Photos</h3>
                {declinePhotos ? (
                  <p className="text-gray-500 text-sm">No photos attached</p>
                ) : (
                  <p className="text-navy text-sm font-medium">
                    {photoFiles.length} photo{photoFiles.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("photos")}
                className="flex-1 py-3.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-lg text-white font-semibold bg-green hover:bg-green-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
