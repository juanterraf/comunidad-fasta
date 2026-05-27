import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Comunidad FASTA — Lo que somos, lo que hacemos, lo que compartimos.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f7f2ea",
          color: "#11100d",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 20,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#625a50",
            fontWeight: 500,
          }}
        >
          <div style={{ width: 56, height: 1, background: "#625a50", display: "flex" }} />
          <span style={{ display: "flex" }}>
            Comunidad FASTA · Colegio Boisdron · Tucumán
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 100,
            fontWeight: 800,
            letterSpacing: "-0.045em",
            lineHeight: 0.95,
          }}
        >
          <span style={{ display: "flex" }}>Lo que somos,</span>
          <span style={{ display: "flex" }}>lo que hacemos,</span>
          <span style={{ display: "flex", color: "#c84d2f" }}>
            lo que compartimos.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#11100d",
            }}
          >
            <span style={{ display: "flex" }}>Comunidad</span>
            <span style={{ display: "flex", color: "#c84d2f" }}>FASTA</span>
          </div>
          <span style={{ display: "flex", fontSize: 24, color: "#625a50" }}>
            comunidadfasta.cloud
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
