#!/usr/bin/env python3
"""Generate 13 realistic, visually varied Dutch debt-letter PDFs for doei demos.

Each vendor uses a different layout (government letter, utility bill, debt-
collector sommatie, BNPL app-style, etc.) so the document set looks like a real
inbox dump rather than 13 copies of one template.
"""

import json
import os
import random
from datetime import date, timedelta

from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

random.seed(7)  # Deterministic randomness so reruns produce the same files.

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mock-debt-letters")
os.makedirs(OUT_DIR, exist_ok=True)

TODAY = date.today()


def d(days_offset):
    return (TODAY + timedelta(days=days_offset)).isoformat()


def fmt_nl_date(iso):
    months = ["januari", "februari", "maart", "april", "mei", "juni",
              "juli", "augustus", "september", "oktober", "november", "december"]
    y, m, dd = iso.split("-")
    return f"{int(dd)} {months[int(m)-1]} {y}"


def fmt_eur(n):
    return f"€ {n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def payment_ref():
    digits = "".join(str(random.randint(0, 9)) for _ in range(16))
    return f"{digits[0:4]} {digits[4:8]} {digits[8:12]} {digits[12:16]}"


# Random Dutch recipient pool — mix of names, streets, postal codes
RECIPIENTS = [
    ("De heer J. van der Berg", "Prinsengracht 142-3", "1015 DV Amsterdam"),
    ("Mevrouw S. el Idrissi", "Goudsesingel 88", "3011 KD Rotterdam"),
    ("De heer M. Janssen", "Stationsplein 14", "3511 ED Utrecht"),
    ("Mevrouw L. de Vries", "Korte Houtstraat 7", "2511 CD Den Haag"),
    ("De heer A. Bakker", "Westerstraat 230-A", "1015 MS Amsterdam"),
]


def recipient():
    return random.choice(RECIPIENTS)


# ---------------------------------------------------------------------------
# Template A: Government letter — flat, formal, narrow column
# ---------------------------------------------------------------------------
def template_government(c, v):
    width, height = A4
    band = HexColor(v["color"])
    name, street, city = recipient()

    # Small color block + organisation name (no big banner)
    c.setFillColor(band)
    c.rect(20 * mm, height - 22 * mm, 6 * mm, 12 * mm, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(30 * mm, height - 14 * mm, v["creditorName"])
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#444"))
    c.drawString(30 * mm, height - 19 * mm, v["org_subline"])

    # Recipient block
    c.setFillColor(black)
    c.setFont("Helvetica", 10)
    y = height - 50 * mm
    for line in (name, street, city):
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Date and reference (right column)
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, height - 50 * mm, f"Datum: {fmt_nl_date(v['issue_date'])}")
    c.drawRightString(width - 20 * mm, height - 55 * mm, f"Kenmerk: {v['reference']}")
    c.drawRightString(width - 20 * mm, height - 60 * mm, f"BSN: {v.get('bsn', '••• •• ••• 4')}")

    # Subject
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, height - 80 * mm, f"Betreft: {v['subject']}")

    # Body
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, height - 92 * mm, f"Geachte {name.split()[-1]},")
    y = height - 100 * mm
    for line in v["body"]:
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Payment block — stark, gov style
    y -= 6 * mm
    c.setFillColor(HexColor("#F2F2F2"))
    c.rect(20 * mm, y - 26 * mm, width - 40 * mm, 26 * mm, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(25 * mm, y - 7 * mm, "Te betalen")
    c.drawString(25 * mm, y - 14 * mm, "Vervaldatum")
    c.drawString(25 * mm, y - 21 * mm, "Betalingskenmerk")
    c.setFont("Courier-Bold", 11)
    c.drawRightString(width - 25 * mm, y - 7 * mm, fmt_eur(v["amount"]))
    c.setFont("Courier", 10)
    c.drawRightString(width - 25 * mm, y - 14 * mm, fmt_nl_date(v["dueDate"]))
    c.drawRightString(width - 25 * mm, y - 21 * mm, payment_ref())

    if v["amount"] != v["originalAmount"]:
        y2 = y - 32 * mm
        c.setFont("Helvetica-Oblique", 9)
        c.setFillColor(HexColor("#A91432"))
        c.drawString(20 * mm, y2, f"Oorspronkelijk bedrag: {fmt_eur(v['originalAmount'])} — verhoogd met "
                                   f"{fmt_eur(v['amount'] - v['originalAmount'])} aan kosten.")
        c.setFillColor(black)

    # Footer
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(HexColor("#666"))
    c.drawString(20 * mm, 12 * mm, v["footer"])


# ---------------------------------------------------------------------------
# Template B: Utility bill — itemized usage table
# ---------------------------------------------------------------------------
def template_utility(c, v):
    width, height = A4
    band = HexColor(v["color"])
    name, street, city = recipient()

    # Big colored header
    c.setFillColor(band)
    c.rect(0, height - 35 * mm, width, 35 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(20 * mm, height - 18 * mm, v["creditorName"])
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, height - 26 * mm, v["org_subline"])
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(width - 20 * mm, height - 18 * mm, "FACTUUR")
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, height - 25 * mm, f"Nr. {v['reference']}")
    c.drawRightString(width - 20 * mm, height - 30 * mm, fmt_nl_date(v["issue_date"]))

    # Recipient
    c.setFillColor(black)
    c.setFont("Helvetica", 10)
    y = height - 50 * mm
    for line in (name, street, city):
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Customer info right
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, height - 50 * mm, f"Klantnummer: {random.randint(100000, 999999)}")
    c.drawRightString(width - 20 * mm, height - 55 * mm, f"Periode: {v.get('period', 'Q4 2025')}")

    # Subject
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, height - 80 * mm, v["subject"])

    # Itemized table
    y = height - 95 * mm
    c.setFillColor(HexColor("#EEE"))
    c.rect(20 * mm, y - 6 * mm, width - 40 * mm, 7 * mm, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(22 * mm, y - 4 * mm, "Omschrijving")
    c.drawRightString(width - 60 * mm, y - 4 * mm, "Aantal")
    c.drawRightString(width - 38 * mm, y - 4 * mm, "Tarief")
    c.drawRightString(width - 22 * mm, y - 4 * mm, "Bedrag")

    c.setFont("Helvetica", 9)
    line_y = y - 12 * mm
    for desc, qty, rate, total in v["items"]:
        c.drawString(22 * mm, line_y, desc)
        c.drawRightString(width - 60 * mm, line_y, qty)
        c.drawRightString(width - 38 * mm, line_y, rate)
        c.drawRightString(width - 22 * mm, line_y, total)
        line_y -= 6 * mm

    # Subtotal / BTW / Total
    line_y -= 3 * mm
    c.setStrokeColor(HexColor("#CCC"))
    c.line(width - 80 * mm, line_y + 3 * mm, width - 22 * mm, line_y + 3 * mm)
    rows = v.get("totals", [
        ("Subtotaal", fmt_eur(v["amount"] / 1.21)),
        ("BTW (21%)", fmt_eur(v["amount"] - v["amount"] / 1.21)),
    ])
    for label, val in rows:
        c.drawString(width - 80 * mm, line_y, label)
        c.drawRightString(width - 22 * mm, line_y, val)
        line_y -= 6 * mm
    line_y -= 1 * mm
    c.setFillColor(band)
    c.rect(width - 80 * mm, line_y - 2 * mm, 58 * mm, 9 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(width - 78 * mm, line_y + 2 * mm, "Totaal")
    c.drawRightString(width - 22 * mm, line_y + 2 * mm, fmt_eur(v["amount"]))
    c.setFillColor(black)

    # Payment slip (acceptgiro-style)
    py = 35 * mm
    c.setStrokeColor(HexColor("#999"))
    c.setDash(2, 2)
    c.line(20 * mm, py + 25 * mm, width - 20 * mm, py + 25 * mm)
    c.setDash()
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(HexColor("#999"))
    c.drawString(20 * mm, py + 26 * mm, "↓ Betalingsstrook — afscheuren ↓")

    c.setFillColor(black)
    c.setFont("Helvetica", 9)
    c.drawString(20 * mm, py + 18 * mm, f"IBAN: NL{random.randint(10,99)} RABO 0{random.randint(100000000,999999999)}")
    c.drawString(20 * mm, py + 13 * mm, f"T.n.v. {v['creditorName']}")
    c.drawString(20 * mm, py + 8 * mm, f"Vervaldatum: {fmt_nl_date(v['dueDate'])}")
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(width - 20 * mm, py + 18 * mm, f"Bedrag: {fmt_eur(v['amount'])}")
    c.setFont("Courier", 9)
    c.drawRightString(width - 20 * mm, py + 13 * mm, f"Kenmerk: {payment_ref()}")

    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(HexColor("#666"))
    c.drawString(20 * mm, 12 * mm, v["footer"])


# ---------------------------------------------------------------------------
# Template C: Insurance / Health admin — soft, two-column
# ---------------------------------------------------------------------------
def template_insurance(c, v):
    width, height = A4
    band = HexColor(v["color"])
    name, street, city = recipient()

    # Top color stripe + logo
    c.setFillColor(band)
    c.rect(0, height - 8 * mm, width, 8 * mm, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(20 * mm, height - 25 * mm, v["creditorName"])
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#666"))
    c.drawString(20 * mm, height - 31 * mm, v["org_subline"])

    # Right column: meta box
    c.setFillColor(HexColor("#F8F8F8"))
    c.rect(width - 80 * mm, height - 50 * mm, 60 * mm, 25 * mm, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica", 9)
    c.drawString(width - 78 * mm, height - 31 * mm, f"Polisnummer:  {v['reference']}")
    c.drawString(width - 78 * mm, height - 37 * mm, f"Datum:        {fmt_nl_date(v['issue_date'])}")
    c.drawString(width - 78 * mm, height - 43 * mm, f"Pagina:       1 van 1")
    c.drawString(width - 78 * mm, height - 49 * mm, f"Behandeld door: {v.get('handler', 'team Achterstand')}")

    # Recipient
    c.setFont("Helvetica", 10)
    y = height - 55 * mm
    for line in (name, street, city):
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Subject + body
    c.setFont("Helvetica-Bold", 13)
    c.drawString(20 * mm, height - 80 * mm, v["subject"])
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, height - 90 * mm, f"Beste {name.split()[-1]},")
    y = height - 100 * mm
    for line in v["body"]:
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Amount block — rounded box
    y -= 8 * mm
    c.setFillColor(band)
    c.roundRect(20 * mm, y - 24 * mm, width - 40 * mm, 24 * mm, 4 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(25 * mm, y - 8 * mm, "Openstaand bedrag")
    c.setFont("Helvetica-Bold", 18)
    c.drawRightString(width - 25 * mm, y - 9 * mm, fmt_eur(v["amount"]))
    c.setFont("Helvetica", 9)
    c.drawString(25 * mm, y - 18 * mm, f"Te betalen voor: {fmt_nl_date(v['dueDate'])}")
    if v["amount"] != v["originalAmount"]:
        c.drawRightString(width - 25 * mm, y - 18 * mm,
                          f"({fmt_eur(v['amount'] - v['originalAmount'])} aan extra kosten)")
    c.setFillColor(black)

    c.setFont("Helvetica", 9)
    c.drawString(20 * mm, 30 * mm, "Met vriendelijke groet,")
    c.drawString(20 * mm, 25 * mm, v.get("signoff", "Team Klantenservice"))
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(HexColor("#666"))
    c.drawString(20 * mm, 12 * mm, v["footer"])


# ---------------------------------------------------------------------------
# Template D: Bank letter — formal, accent stripe left
# ---------------------------------------------------------------------------
def template_bank(c, v):
    width, height = A4
    band = HexColor(v["color"])
    name, street, city = recipient()

    # Left vertical accent stripe
    c.setFillColor(band)
    c.rect(0, 0, 4 * mm, height, fill=1, stroke=0)

    # Logo: bold orange "ING" style block
    c.setFillColor(band)
    c.rect(20 * mm, height - 22 * mm, 22 * mm, 12 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(31 * mm, height - 18 * mm, v["creditorName"].split()[0])

    c.setFillColor(black)
    c.setFont("Helvetica", 9)
    c.drawString(45 * mm, height - 14 * mm, v["org_subline"])
    c.drawString(45 * mm, height - 18 * mm, "Bijlmerplein 888, 1102 MG Amsterdam")

    # Recipient
    c.setFont("Helvetica", 10)
    y = height - 45 * mm
    for line in (name, street, city):
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Right meta
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, height - 45 * mm, fmt_nl_date(v["issue_date"]))
    c.drawRightString(width - 20 * mm, height - 50 * mm, f"Onze ref: {v['reference']}")
    c.drawRightString(width - 20 * mm, height - 55 * mm, f"Rekening: NL64 INGB {random.randint(1000000000, 9999999999)}")

    # Stamped subject
    c.setStrokeColor(HexColor("#A91432"))
    c.setLineWidth(1.5)
    c.rect(20 * mm, height - 80 * mm, 65 * mm, 9 * mm, fill=0, stroke=1)
    c.setFillColor(HexColor("#A91432"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(22 * mm, height - 77 * mm, "BETREFT: ACHTERSTAND")

    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, height - 95 * mm, v["subject"])

    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, height - 105 * mm, f"Geachte {name.split()[-1]},")
    y = height - 113 * mm
    for line in v["body"]:
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Payment table
    y -= 8 * mm
    c.setStrokeColor(black)
    c.setLineWidth(0.5)
    c.rect(20 * mm, y - 25 * mm, width - 40 * mm, 25 * mm, fill=0, stroke=1)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(22 * mm, y - 6 * mm, "Openstaande termijn")
    c.drawRightString(width - 22 * mm, y - 6 * mm, fmt_eur(v["amount"]))
    c.setFont("Helvetica", 9)
    c.drawString(22 * mm, y - 13 * mm, "Stornokosten")
    c.drawRightString(width - 22 * mm, y - 13 * mm, "€ 12,50")
    c.drawString(22 * mm, y - 19 * mm, "Vervaldatum")
    c.drawRightString(width - 22 * mm, y - 19 * mm, fmt_nl_date(v["dueDate"]))

    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(HexColor("#666"))
    c.drawString(20 * mm, 12 * mm, v["footer"])


# ---------------------------------------------------------------------------
# Template E: BNPL app-style email/receipt — Klarna pink
# ---------------------------------------------------------------------------
def template_bnpl(c, v):
    width, height = A4
    band = HexColor(v["color"])  # pink

    # Full-bleed pink header
    c.setFillColor(band)
    c.rect(0, height - 60 * mm, width, 60 * mm, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 36)
    c.drawString(20 * mm, height - 35 * mm, v["creditorName"].lower() + ".")
    c.setFont("Helvetica", 12)
    c.drawString(20 * mm, height - 45 * mm, "Hi — your payment is due soon.")

    # White card on pink background
    card_y = height - 130 * mm
    c.setFillColor(white)
    c.roundRect(20 * mm, card_y, width - 40 * mm, 60 * mm, 6 * mm, fill=1, stroke=0)

    c.setFillColor(black)
    c.setFont("Helvetica", 10)
    c.drawString(28 * mm, card_y + 50 * mm, f"Order #{v['reference']}")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(28 * mm, card_y + 42 * mm, v["subject"])

    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#666"))
    c.drawString(28 * mm, card_y + 32 * mm, "Amount due")
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(28 * mm, card_y + 22 * mm, fmt_eur(v["amount"]))

    c.setFillColor(HexColor("#666"))
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 28 * mm, card_y + 32 * mm, "Due date")
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(width - 28 * mm, card_y + 24 * mm, fmt_nl_date(v["dueDate"]))

    # CTA button
    c.setFillColor(black)
    c.roundRect(28 * mm, card_y + 6 * mm, 50 * mm, 12 * mm, 4 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(53 * mm, card_y + 11 * mm, "Pay now →")

    # Body text
    c.setFillColor(black)
    c.setFont("Helvetica", 10)
    y = card_y - 10 * mm
    for line in v["body"]:
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(HexColor("#666"))
    c.drawString(20 * mm, 15 * mm, v["footer"])
    c.drawString(20 * mm, 11 * mm, "This is an automated message from Klarna. Reply STOP to unsubscribe from reminders.")


# ---------------------------------------------------------------------------
# Template F: Aggressive debt collector — bold red sommatie
# ---------------------------------------------------------------------------
def template_collector(c, v):
    width, height = A4
    band = HexColor(v["color"])
    name, street, city = recipient()

    # Bold red header
    c.setFillColor(band)
    c.rect(0, height - 25 * mm, width, 25 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(20 * mm, height - 17 * mm, "SOMMATIE TOT BETALING")
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, height - 17 * mm, v["creditorName"].upper())

    c.setFillColor(black)

    # Recipient
    c.setFont("Helvetica", 10)
    y = height - 42 * mm
    for line in (name, street, city):
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Right meta
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, height - 42 * mm, f"Dossier: {v['reference']}")
    c.drawRightString(width - 20 * mm, height - 47 * mm, f"Behandelaar: dhr. R. de Wit")
    c.drawRightString(width - 20 * mm, height - 52 * mm, fmt_nl_date(v["issue_date"]))

    # Subject
    c.setFont("Helvetica-Bold", 13)
    c.drawString(20 * mm, height - 70 * mm, v["subject"])

    # Body
    c.setFont("Helvetica", 10)
    y = height - 82 * mm
    for line in v["body"]:
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Itemized fee breakdown
    y -= 8 * mm
    c.setFillColor(HexColor("#FFF5F5"))
    c.rect(20 * mm, y - 38 * mm, width - 40 * mm, 38 * mm, fill=1, stroke=1)
    c.setStrokeColor(band)

    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(22 * mm, y - 6 * mm, "Specificatie vordering")

    rows = v.get("breakdown", [
        ("Hoofdsom", fmt_eur(v["originalAmount"])),
        ("Wettelijke rente", fmt_eur(v["amount"] * 0.13)),
        ("Buitengerechtelijke incassokosten", fmt_eur(v["amount"] * 0.17)),
    ])
    line_y = y - 14 * mm
    c.setFont("Helvetica", 10)
    for label, val in rows:
        c.drawString(22 * mm, line_y, label)
        c.drawRightString(width - 22 * mm, line_y, val)
        line_y -= 6 * mm

    c.setStrokeColor(HexColor("#CCC"))
    c.line(22 * mm, line_y + 3 * mm, width - 22 * mm, line_y + 3 * mm)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(band)
    c.drawString(22 * mm, line_y - 2 * mm, "TOTAAL TE BETALEN")
    c.drawRightString(width - 22 * mm, line_y - 2 * mm, fmt_eur(v["amount"]))

    # Big warning
    c.setFillColor(band)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(width / 2, 38 * mm, "⚠  LAATSTE WAARSCHUWING — BIJ NIET-BETALING VOLGT DAGVAARDING  ⚠")

    c.setFillColor(black)
    c.setFont("Helvetica", 9)
    c.drawCentredString(width / 2, 32 * mm, f"Te voldoen voor: {fmt_nl_date(v['dueDate'])}    "
                                              f"IBAN: NL{random.randint(10,99)} INGB 0{random.randint(100000000,999999999)}    "
                                              f"Kenmerk: {payment_ref()}")

    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(HexColor("#666"))
    c.drawString(20 * mm, 15 * mm, v["footer"])


# ---------------------------------------------------------------------------
# Template G: CJIB justice fine — yellow band, vehicle details
# ---------------------------------------------------------------------------
def template_cjib(c, v):
    width, height = A4
    yellow = HexColor("#FFD500")
    red = HexColor("#A91432")
    name, street, city = recipient()

    # Yellow band top
    c.setFillColor(yellow)
    c.rect(0, height - 18 * mm, width, 18 * mm, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(20 * mm, height - 11 * mm, "Centraal Justitieel Incassobureau")
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, height - 11 * mm, "Ministerie van Justitie en Veiligheid")

    # Recipient
    c.setFont("Helvetica", 10)
    y = height - 30 * mm
    for line in (name, street, city):
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Meta
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, height - 30 * mm, fmt_nl_date(v["issue_date"]))
    c.drawRightString(width - 20 * mm, height - 35 * mm, f"CJIB-nummer: {v['reference']}")

    # Big subject in red
    c.setFillColor(red)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(20 * mm, height - 60 * mm, "EERSTE AANMANING — VERHOOGD MET 50%")
    c.setFillColor(black)

    c.setFont("Helvetica", 10)
    y = height - 72 * mm
    for line in v["body"]:
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Vehicle/feit details table
    y -= 5 * mm
    c.setStrokeColor(HexColor("#999"))
    c.setLineWidth(0.5)
    c.rect(20 * mm, y - 30 * mm, width - 40 * mm, 30 * mm, fill=0, stroke=1)
    c.setFont("Helvetica-Bold", 9)
    rows = [
        ("Feitcode", "VR-22"),
        ("Pleegdatum", "14 maart 2026"),
        ("Pleegplaats", "A12 Bodegraven, hectometer 32.4"),
        ("Kenteken", "12-XYZ-3"),
        ("Snelheid (corr.)", "122 km/u (max 100 km/u)"),
    ]
    line_y = y - 6 * mm
    for k, val in rows:
        c.setFont("Helvetica", 9)
        c.drawString(22 * mm, line_y, k)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(70 * mm, line_y, val)
        line_y -= 5 * mm

    # Amount
    y -= 38 * mm
    c.setFillColor(red)
    c.rect(20 * mm, y - 18 * mm, width - 40 * mm, 18 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(25 * mm, y - 8 * mm, "Te betalen")
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(width - 25 * mm, y - 8 * mm, fmt_eur(v["amount"]))
    c.setFont("Helvetica", 9)
    c.drawString(25 * mm, y - 14 * mm, f"Vervaldatum: {fmt_nl_date(v['dueDate'])}")
    c.drawRightString(width - 25 * mm, y - 14 * mm,
                      f"Was: {fmt_eur(v['originalAmount'])} — verhoogd met 50%")
    c.setFillColor(black)

    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(HexColor("#666"))
    c.drawString(20 * mm, 12 * mm, v["footer"])


# ---------------------------------------------------------------------------
# Template H: Housing corp — formal letter with contract block
# ---------------------------------------------------------------------------
def template_housing(c, v):
    width, height = A4
    band = HexColor(v["color"])
    name, street, city = recipient()

    # Left logo block
    c.setFillColor(band)
    c.rect(20 * mm, height - 28 * mm, 28 * mm, 18 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(34 * mm, height - 20 * mm, "Woonstad")
    c.setFont("Helvetica", 8)
    c.drawCentredString(34 * mm, height - 25 * mm, "Rotterdam")

    c.setFillColor(black)
    c.setFont("Helvetica", 9)
    c.drawString(54 * mm, height - 14 * mm, "Woningcorporatie Woonstad Rotterdam")
    c.drawString(54 * mm, height - 19 * mm, "Postbus 2370, 3000 CJ Rotterdam")
    c.drawString(54 * mm, height - 24 * mm, "T 010 - 440 88 00 | woonstadrotterdam.nl")

    # Recipient
    c.setFont("Helvetica", 10)
    y = height - 50 * mm
    for line in (name, street, city):
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Meta
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, height - 50 * mm, f"Datum: {fmt_nl_date(v['issue_date'])}")
    c.drawRightString(width - 20 * mm, height - 55 * mm, f"Contract: {v['reference']}")

    # Subject
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, height - 78 * mm, v["subject"])

    # Contract details box
    c.setFillColor(HexColor("#F8F4F2"))
    c.rect(width - 80 * mm, height - 100 * mm, 60 * mm, 22 * mm, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(width - 78 * mm, height - 84 * mm, "Woonadres")
    c.setFont("Helvetica", 9)
    c.drawString(width - 78 * mm, height - 90 * mm, street)
    c.drawString(width - 78 * mm, height - 95 * mm, city)
    c.drawString(width - 78 * mm, height - 100 * mm, f"Maandhuur: {fmt_eur(v['amount'])}")

    # Body
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, height - 90 * mm, f"Geachte {name.split()[-1]},")
    y = height - 110 * mm
    for line in v["body"]:
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Big amount + due date callout
    y -= 8 * mm
    c.setStrokeColor(band)
    c.setLineWidth(2)
    c.rect(20 * mm, y - 24 * mm, width - 40 * mm, 24 * mm, fill=0, stroke=1)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(25 * mm, y - 8 * mm, "Achterstallige huur januari 2026")
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(band)
    c.drawRightString(width - 25 * mm, y - 9 * mm, fmt_eur(v["amount"]))
    c.setFillColor(black)
    c.setFont("Helvetica", 9)
    c.drawString(25 * mm, y - 17 * mm, f"Te voldoen voor: {fmt_nl_date(v['dueDate'])}")
    c.drawRightString(width - 25 * mm, y - 17 * mm, f"IBAN: NL64 RABO 0335 8821 14")

    c.setFont("Helvetica", 9)
    c.drawString(20 * mm, 30 * mm, "Met vriendelijke groet,")
    c.drawString(20 * mm, 25 * mm, "S. Bouchra — Verhuuradministratie")
    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(HexColor("#666"))
    c.drawString(20 * mm, 12 * mm, v["footer"])


TEMPLATES = {
    "government": template_government,
    "utility": template_utility,
    "insurance": template_insurance,
    "bank": template_bank,
    "bnpl": template_bnpl,
    "collector": template_collector,
    "cjib": template_cjib,
    "housing": template_housing,
}


# ---------------------------------------------------------------------------
# 13 vendors with template assignments
# ---------------------------------------------------------------------------
VENDORS = [
    {
        "filename": "01_belastingdienst.pdf", "template": "government",
        "creditorType": "belasting", "creditorName": "Belastingdienst", "color": "#01689B",
        "org_subline": "Particulieren — Heerlen",
        "subject": "Aanslag inkomstenbelasting 2024",
        "reference": "9821.43.621.H.46",
        "issue_date": d(-22),
        "amount": 1247.50, "originalAmount": 1247.50,
        "dueDate": d(7), "stage": "action_needed",
        "body": [
            "Wij hebben uw aangifte inkomstenbelasting over 2024 verwerkt.",
            "Op basis van uw opgave dient u nog € 1.247,50 te betalen.",
            "Wanneer u niet binnen de betaaltermijn betaalt, ontvangt u een aanmaning",
            "en kunnen invorderingsmaatregelen volgen, waaronder loonbeslag.",
            "Heeft u tijdelijk te weinig geld? Vraag een betalingsregeling aan via",
            "mijn.belastingdienst.nl, ook als u nog geen aanmaning heeft gehad.",
        ],
        "footer": "Belastingdienst | Postbus 2536, 6401 DA Heerlen | belastingdienst.nl | 0800-0543",
        "notes": "Aanslag IB 2024 — eerste betaalmoment",
    },
    {
        "filename": "02_cjib.pdf", "template": "cjib",
        "creditorType": "cjib", "creditorName": "CJIB", "color": "#A91432",
        "org_subline": "Centraal Justitieel Incassobureau",
        "subject": "Eerste aanmaning verkeersboete",
        "reference": "4221903771",
        "issue_date": d(-9),
        "amount": 298.00, "originalAmount": 189.00,
        "dueDate": d(5), "stage": "action_needed",
        "body": [
            "U heeft op 14 maart 2026 een snelheidsovertreding begaan op de A12.",
            "De oorspronkelijke beschikking bedroeg € 189,00. Omdat betaling is uitgebleven,",
            "is het bedrag verhoogd met 50% (€ 109,00) tot in totaal € 298,00.",
            "Betaalt u niet, dan volgt een tweede verhoging tot 100% en eventueel gijzeling.",
        ],
        "footer": "Centraal Justitieel Incassobureau | Postbus 1794, 8901 CB Leeuwarden | cjib.nl | 088-7029100",
        "notes": "Snelheidsovertreding A12 — al verhoogd met 50%",
    },
    {
        "filename": "03_duo.pdf", "template": "government",
        "creditorType": "duo", "creditorName": "DUO", "color": "#154273",
        "org_subline": "Dienst Uitvoering Onderwijs — Groningen",
        "subject": "Maandelijkse termijn studieschuld",
        "reference": "DUO-1234567",
        "issue_date": d(-14),
        "amount": 127.50, "originalAmount": 127.50,
        "dueDate": d(14), "stage": "warning",
        "body": [
            "Hierbij ontvangt u uw maandelijkse aflossingsbericht voor uw studieschuld.",
            "Het te betalen bedrag voor deze maand is € 127,50.",
            "Wij schrijven dit bedrag automatisch af, mits er voldoende saldo is.",
            "Bij onvoldoende saldo dient u zelf binnen 14 dagen over te maken.",
            "Heeft u financiële problemen? U kunt aflosvrije maanden aanvragen via duo.nl.",
        ],
        "footer": "Dienst Uitvoering Onderwijs | Postbus 50061, 9702 AB Groningen | duo.nl",
        "notes": "Aflossing studieschuld — maandtermijn",
    },
    {
        "filename": "04_cak.pdf", "template": "government",
        "creditorType": "cak", "creditorName": "CAK", "color": "#0073B6",
        "org_subline": "Centraal Administratie Kantoor",
        "subject": "Eigen bijdrage Wmo — 4e kwartaal 2025",
        "reference": "88-2026-0451",
        "issue_date": d(-12),
        "amount": 387.45, "originalAmount": 387.45,
        "dueDate": d(21), "stage": "warning",
        "body": [
            "Op basis van uw inkomensgegevens is uw eigen bijdrage Wmo vastgesteld",
            "op € 387,45 voor het 4e kwartaal van 2025.",
            "U kunt het bedrag in één keer betalen of een betalingsregeling aanvragen.",
            "Wij verzoeken u te betalen voor de vermelde vervaldatum.",
        ],
        "footer": "CAK | Postbus 84030, 2508 AA Den Haag | hetcak.nl | 0800-1925",
        "notes": "Wmo eigen bijdrage Q4 2025",
    },
    {
        "filename": "05_zilveren_kruis.pdf", "template": "insurance",
        "creditorType": "zorg", "creditorName": "Zilveren Kruis", "color": "#005B96",
        "org_subline": "Zorgverzekeringen Nederland",
        "subject": "Achterstand zorgpremie",
        "reference": "ZK-91827364",
        "issue_date": d(-10),
        "amount": 312.00, "originalAmount": 234.00,
        "dueDate": d(2), "stage": "action_needed",
        "handler": "Marleen van Dijk",
        "signoff": "Team Achterstandsbeheer",
        "body": [
            "Uit onze administratie blijkt dat de zorgpremie van januari en februari",
            "nog niet is voldaan. Het openstaande bedrag is opgelopen tot € 312,00,",
            "inclusief € 78,00 aanmaningskosten.",
            "Wanneer u 6 maanden achter raakt, melden wij u verplicht aan bij het CAK.",
            "U betaalt dan een verhoogde wanbetalerspremie van circa € 161 per maand.",
            "Bel ons op 071-3651212 om dit te voorkomen — een regeling is bijna altijd mogelijk.",
        ],
        "footer": "Zilveren Kruis Zorgverzekeringen N.V. | Postbus 444, 3800 AK Amersfoort | zilverenkruis.nl",
        "notes": "Zorgpremie jan + feb achterstand — risico CAK-melding",
    },
    {
        "filename": "06_eneco.pdf", "template": "utility",
        "creditorType": "energie", "creditorName": "Eneco", "color": "#00A1B6",
        "org_subline": "Eneco Services B.V.",
        "subject": "Eindafrekening verbruiksjaar 2025",
        "reference": "ENC-2026-0044172",
        "issue_date": d(-6),
        "amount": 189.34, "originalAmount": 189.34,
        "dueDate": d(10), "stage": "warning",
        "period": "01-01-2025 t/m 31-12-2025",
        "items": [
            ("Stroom hoog tarief", "1.840 kWh", "€ 0,2810", "€ 517,04"),
            ("Stroom laag tarief", "920 kWh", "€ 0,2440", "€ 224,48"),
            ("Gas", "1.120 m³", "€ 1,3320", "€ 1.491,84"),
            ("Voorschotten betaald", "12 × € 168,02", "—", "− € 2.016,24"),
            ("Energiebelasting/ODE", "—", "—", "− € 27,78"),
        ],
        "totals": [
            ("Subtotaal", "€ 156,48"),
            ("BTW (21%)", "€ 32,86"),
        ],
        "body": [],
        "footer": "Eneco Services B.V. | Postbus 1014, 3000 BA Rotterdam | eneco.nl | 088-8955432",
        "notes": "Jaarafrekening — bijbetaling",
    },
    {
        "filename": "07_woonstad.pdf", "template": "housing",
        "creditorType": "huur", "creditorName": "Woonstad Rotterdam", "color": "#C8102E",
        "org_subline": "Woningcorporatie",
        "subject": "Eerste herinnering huurachterstand",
        "reference": "0094-2245",
        "issue_date": d(-4),
        "amount": 825.00, "originalAmount": 825.00,
        "dueDate": d(3), "stage": "action_needed",
        "body": [
            "Uit onze administratie blijkt dat de huur over januari 2026 niet is voldaan.",
            "Het openstaande bedrag is € 825,00.",
            "Wij verzoeken u dit bedrag binnen 3 dagen over te maken op het hieronder",
            "vermelde rekeningnummer onder vermelding van uw contractnummer.",
            "Heeft u betaalproblemen? Neem direct contact op — bij langere achterstand",
            "kunnen wij een ontbindingsprocedure starten via de kantonrechter.",
        ],
        "footer": "Woonstad Rotterdam | Postbus 2370, 3000 CJ Rotterdam | woonstadrotterdam.nl | 010-4408800",
        "notes": "Maand 1 huurachterstand — escalatierisico",
    },
    {
        "filename": "08_vitens.pdf", "template": "utility",
        "creditorType": "water", "creditorName": "Vitens", "color": "#0098D8",
        "org_subline": "Drinkwaterbedrijf voor Friesland, Overijssel, Flevoland, Gelderland en Utrecht",
        "subject": "Kwartaalrekening drinkwater Q4 2025",
        "reference": "VTN-2026-778291",
        "issue_date": d(-3),
        "amount": 98.20, "originalAmount": 98.20,
        "dueDate": d(18), "stage": "warning",
        "period": "Q4 2025",
        "items": [
            ("Vastrecht aansluiting", "1 × kwartaal", "€ 18,80", "€ 18,80"),
            ("Drinkwater", "32 m³", "€ 1,4250", "€ 45,60"),
            ("Belasting op leidingwater", "32 m³", "€ 0,3942", "€ 12,61"),
        ],
        "totals": [
            ("Subtotaal", "€ 81,16"),
            ("BTW (21%)", "€ 17,04"),
        ],
        "body": [],
        "footer": "Vitens N.V. | Postbus 1090, 8200 BB Lelystad | vitens.nl | 088-8848444",
        "notes": "Waterrekening Q4",
    },
    {
        "filename": "09_kpn.pdf", "template": "utility",
        "creditorType": "telecom", "creditorName": "KPN", "color": "#00B400",
        "org_subline": "KPN B.V. — Telecommunicatie",
        "subject": "Maandfactuur abonnement maart 2026",
        "reference": "KPN-2026-0381771",
        "issue_date": d(-1),
        "amount": 76.50, "originalAmount": 76.50,
        "dueDate": d(12), "stage": "stable",
        "period": "01-03-2026 t/m 31-03-2026",
        "items": [
            ("Mobiel abonnement Unlimited", "1 × maand", "€ 39,00", "€ 39,00"),
            ("Internet 500 Mbit + TV", "1 × maand", "€ 27,50", "€ 27,50"),
            ("Buiten bundel — bellen", "12 min", "€ 0,15", "€ 1,80"),
            ("Roaming buiten EU (VK)", "84 MB", "€ 0,0500", "€ 4,20"),
        ],
        "totals": [
            ("Subtotaal", "€ 60,33"),
            ("BTW (21%)", "€ 12,67"),
            ("Korting loyaliteit", "− € 3,50"),
        ],
        "body": [],
        "footer": "KPN B.V. | Postbus 30000, 2500 GA Den Haag | kpn.com | 0800-0402",
        "notes": "Mobiel + internet abonnement",
    },
    {
        "filename": "10_ing.pdf", "template": "bank",
        "creditorType": "bank", "creditorName": "ING Bank", "color": "#FF6200",
        "org_subline": "ING Bank N.V. — Persoonlijke Financiering",
        "subject": "Gestorneerde maandtermijn — persoonlijke lening",
        "reference": "PL-NL64-1029",
        "issue_date": d(-7),
        "amount": 215.00, "originalAmount": 215.00,
        "dueDate": d(8), "stage": "warning",
        "body": [
            "Op uw persoonlijke lening met contractnummer PL-NL64-1029",
            "staat een maandtermijn open van € 215,00.",
            "Het automatisch incasso is op 1 maart 2026 gestorneerd wegens onvoldoende saldo.",
            "Wij verzoeken u het bedrag binnen 8 dagen alsnog over te maken op",
            "rekeningnummer NL11 INGB 0001 0026 70 t.n.v. ING Bank N.V.",
            "Bij uitblijvende betaling rekenen wij € 12,50 stornokosten en kan een",
            "BKR-melding (achterstand A) volgen, wat uw kredietwaardigheid raakt.",
        ],
        "footer": "ING Bank N.V. | Bijlmerplein 888, 1102 MG Amsterdam | ing.nl | 020-22 888 22",
        "notes": "Gestorneerde lening termijn — BKR-risico",
    },
    {
        "filename": "11_klarna.pdf", "template": "bnpl",
        "creditorType": "klarna", "creditorName": "Klarna", "color": "#FFB3C7",
        "org_subline": "Smoooth payments",
        "subject": "Your bol.com purchase — payment due in 4 days",
        "reference": "7748293012",
        "issue_date": d(-10),
        "amount": 124.99, "originalAmount": 124.99,
        "dueDate": d(4), "stage": "warning",
        "body": [
            "Hi! This is a friendly reminder that your Klarna invoice for your purchase",
            "at bol.com (€ 124,99) is due soon. You have 4 days left to pay.",
            "If you can't pay the full amount right now, you can split it into 3 parts",
            "in the Klarna app, or extend the due date by 14 days for free.",
            "After the due date we charge € 7,50 reminder fee and may forward",
            "your debt to a collection agency, which adds significant extra cost.",
        ],
        "footer": "Klarna Bank AB (publ) | Sveavägen 46, 111 34 Stockholm | klarna.com",
        "notes": "BNPL bol.com aankoop",
    },
    {
        "filename": "12_intrum.pdf", "template": "collector",
        "creditorType": "incasso", "creditorName": "Intrum Nederland", "color": "#C8102E",
        "org_subline": "Incassobureau",
        "subject": "Sommatie tot betaling — vordering T-Mobile Netherlands B.V.",
        "reference": "INT-2026-552117",
        "issue_date": d(-5),
        "amount": 445.00, "originalAmount": 312.00,
        "dueDate": d(1), "stage": "action_needed",
        "breakdown": [
            ("Hoofdsom (T-Mobile)", fmt_eur(312.00)),
            ("Wettelijke rente sinds 12-12-2025", fmt_eur(35.00)),
            ("Buitengerechtelijke incassokosten (WIK)", fmt_eur(75.00)),
            ("Administratie- en dossierkosten", fmt_eur(23.00)),
        ],
        "body": [
            "Wij zijn ingeschakeld door T-Mobile Netherlands B.V. voor de inning van",
            "een openstaande vordering van oorspronkelijk € 312,00.",
            "Door uitblijvende betaling is het bedrag opgelopen tot € 445,00.",
            "Wij sommeren u dit bedrag binnen 1 (één) dag te voldoen.",
            "Bij niet-betaling starten wij zonder verdere aankondiging een gerechtelijke",
            "procedure. Dit kan leiden tot loon- of bankbeslag en aanzienlijk extra kosten.",
        ],
        "footer": "Intrum Nederland B.V. | Postbus 84072, 2508 AB Den Haag | intrum.nl | 088-7868911",
        "notes": "T-Mobile vordering doorgezet — laatste sommatie",
    },
    {
        "filename": "13_gemeente_amsterdam.pdf", "template": "government",
        "creditorType": "gemeente", "creditorName": "Gemeente Amsterdam", "color": "#EC0000",
        "org_subline": "Belastingen Parkeren — Stadsdeel Centrum",
        "subject": "Naheffingsaanslag parkeerbelasting",
        "reference": "2026-AMS-77192",
        "issue_date": d(-2),
        "amount": 67.00, "originalAmount": 67.00,
        "dueDate": d(15), "stage": "stable",
        "body": [
            "Op 18 maart 2026 om 14:32 uur is uw voertuig (kenteken 12-XYZ-3) op de",
            "Prinsengracht aangetroffen zonder geldige parkeervergunning.",
            "De naheffingsaanslag bedraagt € 67,00, bestaande uit € 4,40 parkeergeld",
            "en € 62,60 aan kosten voor de naheffing.",
            "U kunt binnen 6 weken bezwaar maken via amsterdam.nl/parkeren.",
            "Betaalt u niet, dan volgt een aanmaning met € 9,00 extra kosten.",
        ],
        "footer": "Gemeente Amsterdam — Belastingen Parkeren | Postbus 51480, 1007 EL Amsterdam",
        "notes": "Parkeerbon Prinsengracht",
    },
]


def render(v):
    path = os.path.join(OUT_DIR, v["filename"])
    c = canvas.Canvas(path, pagesize=A4)
    TEMPLATES[v["template"]](c, v)
    c.showPage()
    c.save()
    print(f"  ✓ {v['filename']}  ({v['template']})")
    return path


# ---------------------------------------------------------------------------
# Generate
# ---------------------------------------------------------------------------
manifest = []
for v in VENDORS:
    render(v)
    manifest.append({
        "file": v["filename"],
        "template": v["template"],
        "creditorType": v["creditorType"],
        "creditorName": v["creditorName"],
        "amount": v["amount"],
        "originalAmount": v["originalAmount"],
        "dueDate": v["dueDate"],
        "stage": v["stage"],
        "notes": v["notes"],
    })

with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

# Build a console snippet that PRESERVES the user's profile/auth/lang and only
# replaces debts (and clears suggested + connections).
seed_debts = [
    {
        "id": f"d{i+1:03d}",
        "creditorType": v["creditorType"],
        "creditorName": v["creditorName"],
        "amount": v["amount"],
        "originalAmount": v["originalAmount"],
        "dueDate": v["dueDate"],
        "stage": v["stage"],
        "notes": v["notes"],
        "createdAt": TODAY.isoformat(),
    }
    for i, v in enumerate(VENDORS)
]
seed_income = [
    {"id": "i1", "label": "Salaris", "amount": 2180, "day": 25},
    {"id": "i2", "label": "Zorgtoeslag", "amount": 154, "day": 20},
]

snippet = (
    "(() => {\n"
    "  const KEY = 'app-data-v4';\n"
    "  const cur = JSON.parse(localStorage.getItem(KEY) || '{}');\n"
    "  const next = {\n"
    "    profile: cur.profile || null,\n"
    "    lang:    cur.lang    || 'nl',\n"
    "    debts:   " + json.dumps(seed_debts, ensure_ascii=False) + ",\n"
    "    income:  " + json.dumps(seed_income, ensure_ascii=False) + ",\n"
    "    connections: {},\n"
    "  };\n"
    "  localStorage.setItem(KEY, JSON.stringify(next));\n"
    "  location.reload();\n"
    "})();"
)

with open(os.path.join(OUT_DIR, "seed-my-account.js"), "w", encoding="utf-8") as f:
    f.write("// Paste this into DevTools Console while logged into doei.\n")
    f.write("// Keeps your profile + auth, replaces debts with the 13 mocks,\n")
    f.write("// resets income to a sensible demo, clears integration connections.\n\n")
    f.write(snippet + "\n")

# Cheat-sheet README
md_lines = [
    "# Mock debt letters — 13 Dutch vendors",
    "",
    f"Generated {TODAY.isoformat()} for doei. Each PDF uses a different layout (government letter, utility bill, debt-collector sommatie, BNPL app-style, etc.).",
    "",
    "## Vendors",
    "",
    "| # | PDF | Template | Type | Vendor | Amount | Original | Due | Stage |",
    "|---|---|---|---|---|---|---|---|---|",
]
for i, v in enumerate(VENDORS, 1):
    md_lines.append(
        f"| {i} | `{v['filename']}` | {v['template']} | `{v['creditorType']}` | "
        f"{v['creditorName']} | €{v['amount']:.2f} | €{v['originalAmount']:.2f} | "
        f"{v['dueDate']} | {v['stage']} |"
    )
md_lines += [
    "",
    "## Load the 13 debts onto YOUR account (keep auth + profile)",
    "",
    "Open the running app in your browser, sign in normally, then open DevTools → Console and paste the contents of `seed-my-account.js`.",
    "",
    "It will:",
    "- keep your `profile` (name, phone, email)",
    "- keep your language preference",
    "- replace `debts` with the 13 mocks",
    "- reset `income` to €2,180 salary + €154 zorgtoeslag",
    "- clear `connections` (gmail/bank integrations)",
    "",
    "After reload you'll see all 13 debts pre-loaded. Open each debt and upload its matching PDF in the document section to attach the letter.",
]
with open(os.path.join(OUT_DIR, "README.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines))

print(f"\n✓ {len(VENDORS)} PDFs + manifest.json + README.md + seed-my-account.js → {OUT_DIR}")
