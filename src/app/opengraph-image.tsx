import { ImageResponse } from "next/og";

// Faza 17 (2026-09-24): generisana OG slika (1200x630) za deljenje linka na
// Viberu/WhatsApp-u/Facebooku/LinkedIn-u — SEO analiza je pokazala da bez nje
// deljen link izgleda prazno. Koristi se kao podrazumevana slika za sve
// strane koje ne definišu svoju sopstvenu; boje prate hero sekciju landing
// stranice (slate-900 → emerald-900 gradijent, emerald-600 akcenat).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ruta-Dostava — kombi prevoz i dostava za firme u Beogradu";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #064e3b 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#059669",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            R
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>
            Ruta-Dostava
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 950,
          }}
        >
          Kombi prevoz i dostava za firme u Beogradu
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 30,
            color: "#a7f3d0",
            maxWidth: 850,
          }}
        >
          Uporedite ponude proverenih prevoznika za par minuta.
        </div>
      </div>
    ),
    { ...size }
  );
}
