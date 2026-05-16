"use client";

import { useState } from "react";

const PHONE = "(865) 282-0348";
const PHONE_HREF = "tel:+18652820348";
const QUOTE_URL = "https://quotes.johnsontileinstallation.com";

const services = [
  {
    title: "Custom Showers",
    description:
      "Complete custom shower installations including waterproofing, tile setting, benches, niches, and shelves. Built to last with expert craftsmanship.",
  },
  {
    title: "Floor Tile",
    description:
      "Bathroom floors, kitchen tile, living areas, and large format tile installation. Precision layouts for a flawless finish every time.",
  },
  {
    title: "Backsplash",
    description:
      "Kitchen backsplash and decorative tile installations that elevate your space. Clean lines and meticulous attention to detail.",
  },
  {
    title: "Shower Waterproofing",
    description:
      "Schluter Systems specialist — DITRA and Kerdi membrane installation. Proper waterproofing is the foundation of every quality tile job.",
  },
  {
    title: "Tile Repair & Renovation",
    description:
      "Cracked, loose, or outdated tile? We handle repairs and full renovations to restore your surfaces to like-new condition.",
  },
];

const sellingPoints = [
  {
    title: "Licensed & Insured",
    description:
      "Fully licensed and insured for your peace of mind. We stand behind every project we complete.",
  },
  {
    title: "Schluter Systems Certified",
    description:
      "Certified installer of Schluter waterproofing systems — the industry standard for long-lasting tile installations.",
  },
  {
    title: "Free Estimates",
    description:
      "Get a detailed, no-obligation estimate for your project. We believe in transparent pricing with no surprises.",
  },
  {
    title: "Quality Craftsmanship",
    description:
      "Every tile is set with precision and care. We take pride in delivering results that exceed expectations.",
  },
];

const galleryPlaceholders = [
  "Custom Shower",
  "Kitchen Floor",
  "Backsplash",
  "Bathroom Renovation",
  "Large Format Tile",
  "Shower Niche Detail",
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#services", label: "Services" },
    { href: "#gallery", label: "Gallery" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <a href="#" className="flex-shrink-0">
            <span className="text-lg sm:text-xl font-bold text-navy">
              Johnson Tile Installation
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-navy transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href={QUOTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-green hover:bg-green-dark rounded-lg transition-colors"
            >
              Get a Quote
            </a>
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-navy"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block text-base font-medium text-gray-700 hover:text-navy transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href={QUOTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-4 py-2.5 text-base font-semibold text-white bg-green hover:bg-green-dark rounded-lg transition-colors"
            >
              Get a Quote
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section
      className="relative pt-16 min-h-[600px] flex items-center"
      style={{
        background:
          "linear-gradient(135deg, #1e3a5f 0%, #2a4f7f 50%, #1e3a5f 100%)",
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Expert Tile Installation in Knoxville, TN
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-200 leading-relaxed max-w-2xl">
            Quality craftsmanship for custom showers, floors, backsplashes, and
            more. Licensed, insured, and dedicated to delivering exceptional
            results on every project.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href={QUOTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-green hover:bg-green-dark rounded-lg transition-colors shadow-lg"
            >
              Get a Free Quote
            </a>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg transition-colors"
            >
              Call Now: {PHONE}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="py-20 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy">
            Our Services
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            From custom showers to full floor installations, we provide
            comprehensive tile services for residential and commercial projects.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Placeholder image area */}
              <div className="w-full h-48 bg-gray-placeholder flex items-center justify-center">
                <span className="text-gray-400 text-sm font-medium">
                  Photo Coming Soon
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-navy">
                  {service.title}
                </h3>
                <p className="mt-3 text-gray-600 leading-relaxed text-sm">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUs() {
  return (
    <section className="py-20 sm:py-24 bg-gray-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy">
            Why Choose Us
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            When you work with Johnson Tile Installation, you get a team that
            takes pride in every detail.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {sellingPoints.map((point) => (
            <div
              key={point.title}
              className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100"
            >
              {/* Icon placeholder — simple circle with checkmark */}
              <div className="mx-auto w-14 h-14 bg-navy rounded-full flex items-center justify-center mb-5">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-navy">{point.title}</h3>
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section id="gallery" className="py-20 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy">
            Our Work
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Browse examples of our recent tile installation projects in the
            Knoxville area.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {galleryPlaceholders.map((label) => (
            <div
              key={label}
              className="aspect-square bg-gray-placeholder rounded-xl flex items-center justify-center"
            >
              <span className="text-gray-400 text-sm font-medium text-center px-4">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-20 sm:py-24 bg-gray-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy">
            About Johnson Tile Installation
          </h2>
          <div className="mt-8 space-y-5 text-gray-600 text-lg leading-relaxed">
            <p>
              Johnson Tile Installation is a professional tile setting company
              serving Knoxville, TN and the surrounding areas. Founded by Jacob
              Johnson, our company is built on a commitment to quality
              craftsmanship, honest communication, and attention to detail on
              every project.
            </p>
            <p>
              We specialize in custom shower installations, floor tile,
              backsplashes, and Schluter waterproofing systems. Whether it is a
              single bathroom renovation or a large-scale commercial project, we
              bring the same level of precision and professionalism to every job.
            </p>
            <p>
              As a licensed and insured contractor, we stand behind our work and
              are dedicated to exceeding our customers&apos; expectations. Our
              goal is simple: deliver tile installations that look great and last
              for years to come.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section
      id="contact"
      className="py-20 sm:py-24"
      style={{
        background:
          "linear-gradient(135deg, #1e3a5f 0%, #2a4f7f 50%, #1e3a5f 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Ready to Start Your Project?
        </h2>
        <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto">
          Get in touch today for a free estimate. We serve Knoxville, TN and
          surrounding areas.
        </p>

        <div className="mt-10 space-y-6">
          <div>
            <a
              href={PHONE_HREF}
              className="text-2xl sm:text-3xl font-bold text-white hover:text-gray-200 transition-colors"
            >
              {PHONE}
            </a>
          </div>
          <p className="text-gray-300">
            Service Area: Knoxville, TN and surrounding areas
          </p>
          <div className="mt-8">
            <a
              href={QUOTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-green hover:bg-green-dark rounded-lg transition-colors shadow-lg"
            >
              Get a Free Quote
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-navy-dark py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-white font-semibold text-lg">
              Johnson Tile Installation
            </p>
            <p className="text-gray-300 text-sm mt-1">
              <a
                href={PHONE_HREF}
                className="hover:text-white transition-colors"
              >
                {PHONE}
              </a>
              <span className="mx-2">|</span>
              Knoxville, TN and surrounding areas
            </p>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Johnson Tile Installation. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Services />
        <WhyChooseUs />
        <Gallery />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
