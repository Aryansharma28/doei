import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { basename } from "path";

const supabase = createClient(
  "https://YOUR_PROJECT_REF.supabase.co",
  "REDACTED_SUPABASE_ANON_KEY"
);

const DEBT_ID = "d10";
const FILES = [
  "../data/aanmaning_klarna_intrum.pdf",
  "../data/eerste_herinnering_klarna.pdf",
  "../data/sommatie_klarna_intrum.pdf",
];

for (const filePath of FILES) {
  const fileName = basename(filePath);
  const fileBuffer = readFileSync(new URL(filePath, import.meta.url));
  const storagePath = `${DEBT_ID}/${Date.now()}_${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileBuffer, { contentType: "application/pdf" });

  if (uploadError) {
    console.error(`Failed to upload ${fileName}:`, uploadError.message);
    continue;
  }

  const { data: { publicUrl } } = supabase.storage
    .from("documents")
    .getPublicUrl(storagePath);

  const { error: insertError } = await supabase.from("documents").insert({
    debt_id: DEBT_ID,
    file_url: publicUrl,
    file_name: fileName,
    file_type: "application/pdf",
  });

  if (insertError) {
    console.error(`Failed to insert record for ${fileName}:`, insertError.message);
  } else {
    console.log(`✓ ${fileName}`);
  }
}
