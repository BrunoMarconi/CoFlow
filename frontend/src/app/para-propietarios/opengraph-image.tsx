import { ImageResponse } from "next/og";

export const alt = "CoFlow para propietarios de viviendas en Málaga";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f4ed", color: "#17392c", padding: "68px 76px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 700 }}><div style={{ width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 15, background: "#244638", color: "white" }}>C</div>CoFlow · Propietarios</div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}><div style={{ fontSize: 72, lineHeight: 1.02, letterSpacing: "-3px", fontWeight: 700 }}>Tu vivienda merece</div><div style={{ fontSize: 72, lineHeight: 1.02, letterSpacing: "-3px", color: "#758079" }}>una buena convivencia.</div><div style={{ marginTop: 30, fontSize: 26, color: "#65716b" }}>Publica gratis en Málaga y valora cada solicitud con más contexto.</div></div>
      <div style={{ display: "flex", fontSize: 21, fontWeight: 600, color: "white", background: "#244638", borderRadius: 999, padding: "14px 24px", alignSelf: "flex-start" }}>Publicación gratuita · Sin tarjeta</div>
    </div>, size,
  );
}
