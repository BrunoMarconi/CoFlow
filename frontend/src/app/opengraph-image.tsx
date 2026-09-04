import { ImageResponse } from "next/og";

export const alt = "CoFlow, compañeros de piso compatibles en Málaga";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#eef5f1", color: "#17392c", padding: "68px 76px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 700 }}><div style={{ width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 15, background: "#244638", color: "white" }}>C</div>CoFlow</div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 970 }}><div style={{ fontSize: 74, lineHeight: 1.02, letterSpacing: "-3px", fontWeight: 700 }}>Conoce cómo se vive.</div><div style={{ fontSize: 74, lineHeight: 1.02, letterSpacing: "-3px", color: "#718078" }}>Antes de elegir dónde.</div><div style={{ marginTop: 30, fontSize: 26, color: "#5f6f67" }}>Compañeros de piso y comunidades compatibles en Málaga.</div></div>
      <div style={{ display: "flex", gap: 14, fontSize: 20 }}><span style={{ padding: "12px 20px", borderRadius: 999, background: "white" }}>Hábitos</span><span style={{ padding: "12px 20px", borderRadius: 999, background: "white" }}>Presupuesto</span><span style={{ padding: "12px 20px", borderRadius: 999, background: "white" }}>Convivencia</span></div>
    </div>, size,
  );
}
