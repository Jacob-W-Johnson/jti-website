const PHONE = "(865) 888-0301";
const PHONE_HREF = "tel:+18658880301";

export default function Home() {
  return (
    <>
      {/* Hero — full viewport */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background — will be a photo later */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #0f2236 0%, #1e3a5f 40%, #2a4f7f 70%, #1e3a5f 100%)",
          }}
        />
        {/* Tile pattern texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 59px,
              rgba(255,255,255,0.3) 59px,
              rgba(255,255,255,0.3) 60px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 59px,
              rgba(255,255,255,0.3) 59px,
              rgba(255,255,255,0.3) 60px
            )`,
          }}
        />
        <div className="relative text-center px-6">
          <p className="text-sm sm:text-base tracking-[0.35em] uppercase text-gray-400 mb-4">
            Knoxville, TN
          </p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white leading-[0.95] tracking-tight">
            Johnson
            <br />
            Tile
          </h1>
          <div className="mt-6 w-16 h-[2px] bg-white/30 mx-auto" />
          <p className="mt-6 text-base sm:text-lg text-gray-300 tracking-wide">
            When All the Details Matter
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7"
            />
          </svg>
        </div>
      </section>

      {/* Photo grid — showcasing work */}
      <section className="grid grid-cols-2 md:grid-cols-3">
        {[
          "Custom Shower",
          "Floor Tile",
          "Backsplash",
          "Shower Detail",
          "Bathroom Renovation",
          "Large Format Tile",
        ].map((label) => (
          <div
            key={label}
            className="aspect-square bg-gray-placeholder relative group overflow-hidden cursor-default"
          >
            {/* Hover overlay with label */}
            <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/60 transition-all duration-300 flex items-center justify-center">
              <span className="text-white font-medium text-sm sm:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-300 tracking-wide">
                {label}
              </span>
            </div>
            {/* Placeholder text — remove when photos added */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Photo</span>
            </div>
          </div>
        ))}
      </section>

      {/* Statement */}
      <section className="py-24 sm:py-32 px-6 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-2xl sm:text-3xl font-light text-navy leading-relaxed">
            Licensed. Insured.
            <br />
            <span className="font-semibold">Schluter Certified.</span>
          </p>
          <div className="mt-8 w-12 h-[2px] bg-navy/20 mx-auto" />
          <p className="mt-8 text-gray-500 leading-relaxed">
            Custom showers, floors, backsplashes, waterproofing, and repairs.
            Every tile set with precision.
          </p>
        </div>
      </section>

      {/* Full-width feature image area */}
      <section className="h-[50vh] sm:h-[60vh] bg-gray-placeholder relative">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #1a3352 0%, #2a4f7f 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white/20 text-sm tracking-widest uppercase">
            Featured Project Photo
          </p>
        </div>
      </section>

      {/* Contact — minimal */}
      <section className="py-24 sm:py-32 px-6 bg-white text-center">
        <p className="text-sm tracking-[0.3em] uppercase text-gray-400 mb-6">
          Free Estimates
        </p>
        <a
          href={PHONE_HREF}
          className="text-3xl sm:text-5xl font-bold text-navy hover:text-navy-light transition-colors"
        >
          {PHONE}
        </a>
        <p className="mt-6 text-gray-400">
          Knoxville, TN and surrounding areas
        </p>
      </section>

      {/* Footer — barely there */}
      <footer className="py-4 px-6 text-center bg-navy-dark">
        <p className="text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} Johnson Tile Installation
        </p>
      </footer>
    </>
  );
}
