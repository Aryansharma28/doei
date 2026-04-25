import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const serif = "'Source Serif 4', Georgia, serif";

export function DocumentUpload({ debtId }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { loadDocs(); }, [debtId]);

  async function loadDocs() {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("debt_id", debtId)
      .order("uploaded_at", { ascending: false });
    if (data) setDocs(data);
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const path = `${debtId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { setError(upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(path);
    await supabase.from("documents").insert({ debt_id: debtId, file_url: publicUrl, file_name: file.name, file_type: file.type });
    await loadDocs();
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div style={{ background: "var(--card-bg)", borderRadius: 16, padding: 20, marginBottom: 14, border: "1px solid var(--border-color)" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, fontFamily: serif }}>
        Documenten
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <label style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, background: "#F7F7F4", border: "2px dashed var(--border-color)", borderRadius: 12, textAlign: "center", fontSize: 14, fontWeight: 600, color: uploading ? "#999" : "#3D405B", cursor: uploading ? "not-allowed" : "pointer", boxSizing: "border-box" }}>
          📸 Foto nemen
          <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
        </label>
        <label style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, background: "#F7F7F4", border: "2px dashed var(--border-color)", borderRadius: 12, textAlign: "center", fontSize: 14, fontWeight: 600, color: uploading ? "#999" : "#3D405B", cursor: uploading ? "not-allowed" : "pointer", boxSizing: "border-box" }}>
          {uploading ? "Uploaden..." : "📎 Document"}
          <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {error && <div style={{ fontSize: 12, color: "#E07A5F", marginTop: 8 }}>{error}</div>}
      {docs.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {docs.map(doc => (
            <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border-color)", textDecoration: "none", color: "var(--text-primary)" }}>
              <span style={{ fontSize: 20 }}>{doc.file_type?.startsWith("image") ? "🖼️" : "📄"}</span>
              <span style={{ fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
