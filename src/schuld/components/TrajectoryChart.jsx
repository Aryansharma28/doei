import { useLang } from "../hooks/useLang";

export function TrajectoryChart({ now, m3, m6, m12 }) {
  const { t } = useLang();
  const max = m12 * 1.1, w = 320, h = 140, pad = 30;
  const pts = [
    { x: pad, y: h - pad - ((now / max) * (h - 2 * pad)) },
    { x: pad + (w - 2 * pad) * 0.25, y: h - pad - ((m3 / max) * (h - 2 * pad)) },
    { x: pad + (w - 2 * pad) * 0.5, y: h - pad - ((m6 / max) * (h - 2 * pad)) },
    { x: w - pad, y: h - pad - ((m12 / max) * (h - 2 * pad)) },
  ];
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
  const labels = [t("now"), t("m3"), t("m6"), t("m12")];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 140 }}>
      <defs><linearGradient id="aG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E07A5F" stopOpacity="0.3" /><stop offset="100%" stopColor="#E07A5F" stopOpacity="0.02" /></linearGradient></defs>
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1={pad} y1={h - pad - f * (h - 2 * pad)} x2={w - pad} y2={h - pad - f * (h - 2 * pad)} stroke="#e5e5e5" strokeWidth="0.5" />)}
      <path d={area} fill="url(#aG)" /><path d={line} fill="none" stroke="#E07A5F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 5 : 4} fill={i === 0 ? "#3D405B" : "#E07A5F"} stroke="white" strokeWidth="2" />)}
      {labels.map((l, i) => <text key={i} x={pts[i].x} y={h - 8} textAnchor="middle" fill="#888" fontSize="11" fontFamily="inherit">{l}</text>)}
    </svg>
  );
}
