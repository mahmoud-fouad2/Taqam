"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    SwaggerUIBundle?: any;
    SwaggerUIStandalonePreset?: any;
  }
}

export default function SwaggerUi() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!window.SwaggerUIBundle) return;

    window.SwaggerUIBundle({
      url: "/api/openapi",
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
      layout: "StandaloneLayout"
    });
  }, [ready]);

  return (
    <>
      <Script
        src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />

      <div id="swagger-ui" />
    </>
  );
}
