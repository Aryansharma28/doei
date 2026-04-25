import { S } from "../styles/styles";
import { fmt } from "../utils/helpers";

export function PPill({ label, value, delta }) {
  return (
    <div style={S.projPill}>
      <div style={S.projPillL}>{label}</div>
      <div style={S.projPillV}>{fmt(value)}</div>
      {delta != null && delta > 0 && <div style={S.projPillD}>+{fmt(delta)}</div>}
    </div>
  );
}
