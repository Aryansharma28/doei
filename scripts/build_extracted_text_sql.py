#!/usr/bin/env python3
"""Generate SQL UPDATE statements that backfill extracted_text on the 13 mock
documents using the same body / items / breakdown content the PDF generator
draws onto the page. Run: python3 scripts/build_extracted_text_sql.py > out.sql
then paste into Supabase, OR just print and pipe the rows yourself.
"""
import sys, os, io, contextlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# The generator runs at import time and prints progress; silence it.
with contextlib.redirect_stdout(io.StringIO()):
    from generate_mock_debt_letters import VENDORS, fmt_eur, fmt_nl_date


def text_for(v):
    parts = [
        f"AFZENDER: {v['creditorName']}",
        f"DATUM: {fmt_nl_date(v['issue_date'])}",
        f"KENMERK: {v['reference']}",
        f"ONDERWERP: {v['subject']}",
        "",
        "INHOUD:",
    ]
    body = v.get("body") or []
    if body:
        parts.extend(body)
    if v.get("items"):
        parts.append("")
        parts.append("SPECIFICATIE:")
        for desc, qty, rate, total in v["items"]:
            parts.append(f"- {desc}: {qty} × {rate} = {total}")
    if v.get("breakdown"):
        parts.append("")
        parts.append("OPBOUW VORDERING:")
        for label, val in v["breakdown"]:
            parts.append(f"- {label}: {val}")
    parts.append("")
    parts.append("BEDRAGEN:")
    parts.append(f"- Te betalen: {fmt_eur(v['amount'])}")
    if v["amount"] != v["originalAmount"]:
        parts.append(f"- Oorspronkelijk: {fmt_eur(v['originalAmount'])} (verhoogd met {fmt_eur(v['amount'] - v['originalAmount'])})")
    parts.append(f"- Vervaldatum: {fmt_nl_date(v['dueDate'])}")
    parts.append("")
    parts.append(f"NOTITIE: {v['notes']}")
    return "\n".join(parts)


print("BEGIN;")
for i, v in enumerate(VENDORS, 1):
    debt_id = f"d{i:03d}"
    text = text_for(v).replace("'", "''")
    print(f"UPDATE public.documents SET extracted_text = '{text}' WHERE debt_id = '{debt_id}';")
print("COMMIT;")
