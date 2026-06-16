"use client";

import { useEffect } from "react";

/**
 * Redirect /quote to the new TileQuote questionnaire.
 * The JTI questionnaire now lives at tilequote.pro/q/jti.
 */
export default function QuoteRedirect() {
  useEffect(() => {
    window.location.replace("https://tilequote.pro/q/jti");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-slate-600 text-lg">Redirecting to our new quote system...</p>
        <a
          href="https://tilequote.pro/q/jti"
          className="text-blue-600 underline mt-2 inline-block"
        >
          Click here if you&apos;re not redirected
        </a>
      </div>
    </div>
  );
}
