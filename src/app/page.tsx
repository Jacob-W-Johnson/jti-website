const PHONE = "(865) 282-0348";
const PHONE_HREF = "tel:+18652820348";
const EMAIL = "johnsontileinsta@gmail.com";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section
        className="min-h-[600px] flex items-center justify-center text-center px-6"
        style={{
          background:
            "linear-gradient(135deg, #1e3a5f 0%, #2a4f7f 50%, #1e3a5f 100%)",
        }}
      >
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Johnson Tile Installation
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-gray-200 italic">
            When All the Details Matter
          </p>
          <p className="mt-6 text-lg text-gray-300">
            Knoxville, TN
          </p>
          <a
            href={PHONE_HREF}
            className="mt-8 inline-block text-xl sm:text-2xl font-semibold text-white border-2 border-white/40 rounded-lg px-8 py-3 hover:bg-white/10 transition-colors"
          >
            {PHONE}
          </a>
        </div>
      </section>

      {/* About */}
      <section className="py-16 sm:py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy">
            Professional Tile Installation
          </h2>
          <p className="mt-6 text-gray-600 text-lg leading-relaxed">
            Johnson Tile Installation is a licensed and insured tile setting
            company serving Knoxville, TN and the surrounding areas. We are a
            Schluter Systems certified installer, specializing in custom showers,
            floor tile, backsplashes, and waterproofing. Every project gets the
            same attention to detail, from start to finish.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 sm:py-20 px-6 bg-gray-light">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy text-center mb-12">
            What We Do
          </h2>
          <div className="space-y-6">
            {[
              {
                title: "Custom Showers",
                desc: "Complete shower builds including waterproofing, tile setting, benches, niches, shelves, and drain installation.",
              },
              {
                title: "Floor Tile",
                desc: "Bathroom floors, kitchen tile, living areas, and large format installations. Precision layouts every time.",
              },
              {
                title: "Backsplash",
                desc: "Kitchen and bathroom backsplash installations. Clean lines and meticulous attention to detail.",
              },
              {
                title: "Waterproofing",
                desc: "Schluter Systems specialist. DITRA and Kerdi membrane installation. The foundation of every quality tile job.",
              },
              {
                title: "Tile Repair",
                desc: "Cracked, loose, or outdated tile. We handle repairs and renovations to restore your surfaces.",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-navy">{s.title}</h3>
                <p className="mt-2 text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-16 sm:py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy text-center mb-12">
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              "Licensed and Insured",
              "Schluter Systems Certified",
              "Free Estimates",
              "Quality Craftsmanship",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 bg-gray-light rounded-xl p-5"
              >
                <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
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
                <span className="text-navy font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section
        className="py-16 sm:py-20 px-6 text-center"
        style={{
          background:
            "linear-gradient(135deg, #1e3a5f 0%, #2a4f7f 50%, #1e3a5f 100%)",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to Start Your Project?
          </h2>
          <p className="mt-4 text-gray-200 text-lg">
            Call or text for a free estimate.
          </p>
          <a
            href={PHONE_HREF}
            className="mt-8 inline-block text-2xl sm:text-3xl font-bold text-white hover:text-gray-200 transition-colors"
          >
            {PHONE}
          </a>
          <p className="mt-6 text-gray-300">
            <a
              href={`mailto:${EMAIL}`}
              className="hover:text-white transition-colors"
            >
              {EMAIL}
            </a>
          </p>
          <p className="mt-2 text-gray-400 text-sm">
            Serving Knoxville, TN and surrounding areas
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark py-6 px-6 text-center">
        <p className="text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Johnson Tile Installation. All
          rights reserved.
        </p>
      </footer>
    </>
  );
}
