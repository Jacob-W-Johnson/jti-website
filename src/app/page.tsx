import Image from "next/image";

const PHONE = "(865) 888-0301";
const PHONE_HREF = "tel:+18658880301";

const gallery = [
  { src: "/images/gallery-1.jpg", alt: "Custom shower with beveled subway tile and penny tile floor" },
  { src: "/images/gallery-2.jpg", alt: "Bathroom with penny tile floor and subway tile walls" },
  { src: "/images/gallery-3.jpg", alt: "Walk-in shower with marble tile and pebble floor" },
  { src: "/images/gallery-4.jpg", alt: "Kitchen backsplash with textured tile" },
  { src: "/images/gallery-5.jpg", alt: "Penny tile floor with decorative flower accents" },
  { src: "/images/gallery-6.jpg", alt: "Diamond pattern backsplash with decorative borders" },
];

export default function Home() {
  return (
    <>
      {/* Hero — full viewport with photo */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="/images/hero.jpg"
          alt="Custom shower tile installation"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay */}
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

        {/* Scroll indicator */}
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

      {/* Photo grid */}
      <section className="grid grid-cols-2 md:grid-cols-3">
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
              sizes="(max-width: 768px) 50vw, 33vw"
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
          src="/images/feature.jpg"
          alt="Marble tile shower installation"
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
