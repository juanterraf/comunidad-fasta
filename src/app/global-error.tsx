"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] global error:", error);
  }, [error]);

  return (
    <html lang="es-AR">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#f7f2ea",
          color: "#11100d",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <p
            style={{
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#625a50",
              fontWeight: 500,
              marginBottom: "24px",
            }}
          >
            Algo salió muy mal
          </p>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              marginBottom: "24px",
            }}
          >
            Disculpá.
          </h1>
          <p
            style={{
              fontSize: "17px",
              color: "#625a50",
              lineHeight: 1.6,
              marginBottom: "32px",
            }}
          >
            La página no pudo cargar. Probá recargar.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              height: "48px",
              padding: "0 24px",
              fontSize: "15px",
              fontWeight: 500,
              background: "#11100d",
              color: "#f7f2ea",
              border: "none",
              cursor: "pointer",
            }}
          >
            Probar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
