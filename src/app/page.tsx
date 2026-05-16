import Image from "next/image";

const PHONE = "(865) 888-0301";
const PHONE_HREF = "tel:+18658880301";
const TOTAL_PHOTOS = 43;

// Build gallery array from all photos
const allPhotos = Array.from({ length: TOTAL_PHOTOS }, (_, i) => ({
  src: `/images/photo-${String(i + 1).padStart(2, "0")}.jpg`,
  alt: `Tile installation project ${i + 1}`,
}));

// Use photo-30 as hero (full shower build), photo-33 as feature
const heroPhoto = "/images/photo-30.jpg";
const featurePhoto = "/images/photo-21.jpg";

// Gallery = all photos except hero and feature
const gallery = allPhotos.filter(
  (p) => p.src !== heroPhoto && p.src !== featurePhoto
);

export default function Home() {
  return (
    <>
      {/* Hero — full viewport with photo */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src={heroPhoto}
          alt="Custom shower tile installation"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative text-center px-6">
          <p className="text-sm sm:text-base tracking-[0.35em] uppercase text-gray-300 mb-4">
            Knoxville, TN
          </p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white leading-[0.95] tracking-tight">
            Johnson
            <br />
            Tile
          </h1>
          <div className="mt-6 w-16 h-[2px] bg-white/40 mx-auto" />
          <p className="mt-6 text-base sm:text-lg text-gray-200 tracking-wide">
            When All the Details Matter
          </p>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white/50"
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

      {/* Photo grid — all project photos */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {gallery.map((img) => (
          <div
            key={img.src}
            className="aspect-square relative overflow-hidden"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
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

      {/* Full-width feature image */}
      <section className="h-[50vh] sm:h-[60vh] relative overflow-hidden">
        <Image
          src={featurePhoto}
          alt="Featured tile installation project"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </section>

      {/* Contact */}
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

      {/* Footer */}
      <footer className="py-4 px-6 text-center bg-navy-dark">
        <p className="text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} Johnson Tile Installation
        </p>
      </footer>
    </>
  );
}
