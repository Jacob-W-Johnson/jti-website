import Image from "next/image";

const PHONE = "(865) 888-0301";
const PHONE_HREF = "tel:+18658880301";
const TOTAL_PHOTOS = 43;

// Build gallery array from all photos
const allPhotos = Array.from({ length: TOTAL_PHOTOS }, (_, i) => ({
  src: `/images/photo-${String(i + 1).padStart(2, "0")}.jpg`,
  alt: `Tile installation project ${i + 1}`,
}));

const heroPhoto = "/images/photo-30.jpg";
const featurePhoto = "/images/feature-niche.jpg";

// Full-width breakout images
const widePhotos = [
  { src: "/images/wide-03.jpg", alt: "Onyx marble shower with hex floor" },
  { src: "/images/wide-02.jpg", alt: "Travertine shower with dark niche" },
  { src: "/images/wide-01.jpg", alt: "Slate tile floor and shower curb" },
];

// Exclude hero, removed photos from gallery
const excludeFromGallery = [heroPhoto, "/images/photo-42.jpg", "/images/photo-43.jpg"];
const gallery = allPhotos.filter(
  (p) => !excludeFromGallery.includes(p.src)
);

// Split gallery into chunks to insert wide photos between them
const chunkSize = Math.ceil(gallery.length / (widePhotos.length + 1));
const chunks: typeof gallery[] = [];
for (let i = 0; i < gallery.length; i += chunkSize) {
  chunks.push(gallery.slice(i, i + chunkSize));
}

function GalleryGrid({ photos }: { photos: typeof gallery }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4">
      {photos.map((img, i) => {
        const isLarge = i % 5 === 0;
        return (
          <div
            key={img.src}
            className={`relative overflow-hidden ${
              isLarge
                ? "col-span-2 row-span-2 aspect-square"
                : "aspect-square"
            }`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
            />
          </div>
        );
      })}
    </div>
  );
}

function WideImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="h-[50vh] sm:h-[60vh] relative overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="100vw"
      />
    </div>
  );
}

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

      {/* Gallery with full-width images mixed in */}
      {chunks.map((chunk, i) => (
        <div key={i}>
          <GalleryGrid photos={chunk} />
          {i < widePhotos.length && (
            <WideImage src={widePhotos[i].src} alt={widePhotos[i].alt} />
          )}
        </div>
      ))}

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
      <WideImage src={featurePhoto} alt="Double niche detail" />

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
