# -*- coding: utf-8 -*-
"""
Generates the Ruta-Dostava Privacy Policy PDF.

NOTE: several fields (legal entity name, PIB, matični broj, sedište, contact
email) are placeholders — [U ZAGRADAMA] — because the real registered
company details weren't available when this was drafted. Fill those in, then
re-run this script to regenerate the PDF. The rest of the content (what data
is collected, why, how long, user rights) is drawn directly from the actual
data model (db/schema.sql), so it should stay accurate as long as the schema
doesn't change in ways that add new categories of personal data.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    ListFlowable,
    ListItem,
)

OUT_PATH = "public/dokumenti/politika-privatnosti.pdf"

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="RutaBody",
        parent=styles["Normal"],
        fontSize=10.5,
        leading=15,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="RutaH1",
        parent=styles["Heading1"],
        fontSize=15,
        spaceBefore=14,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="RutaH2",
        parent=styles["Heading2"],
        fontSize=12,
        spaceBefore=10,
        spaceAfter=6,
    )
)

B = styles["RutaBody"]
H1 = styles["RutaH1"]
H2 = styles["RutaH2"]


def bullets(items):
    return ListFlowable(
        [ListItem(Paragraph(t, B), bulletColor="black") for t in items],
        bulletType="bullet",
        leftIndent=14,
        spaceAfter=8,
    )


story = []

story.append(Paragraph("Politika privatnosti — Ruta-Dostava", styles["Title"]))
story.append(
    Paragraph(
        "Poslednje ažurirano: [DATUM]. Ovo je radna verzija dokumenta — polja "
        "u uglastim zagradama treba popuniti stvarnim podacima pravnog lica "
        "pre objavljivanja, i preporučuje se pravna provera pre konačnog "
        "objavljivanja.",
        ParagraphStyle(
            name="Notice",
            parent=B,
            textColor="#b45309",
            backColor="#fffbeb",
            borderPadding=6,
        ),
    )
)
story.append(Spacer(1, 10))

story.append(Paragraph("1. Ko smo mi", H1))
story.append(
    Paragraph(
        "Ruta-Dostava je B2B platforma koja povezuje firme sa kombi prevoznicima i "
        "kurirskim službama radi dostave pošiljki u Beogradu. Rukovalac "
        "podataka o ličnosti je [NAZIV PRAVNOG LICA / PREDUZETNIKA], "
        "PIB [PIB], matični broj [MATIČNI BROJ], sa sedištem na adresi "
        "[ADRESA SEDIŠTA]. Za sva pitanja u vezi sa privatnošću možete nas "
        "kontaktirati na [KONTAKT EMAIL].",
        B,
    )
)

story.append(Paragraph("2. Koje podatke prikupljamo", H1))
story.append(
    Paragraph(
        "U zavisnosti od toga da li koristite Ruta-Dostavu kao klijent (firma "
        "koja šalje pošiljke), dostavljač (prevoznik/kurirska služba) ili "
        "operater platforme, prikupljamo sledeće podatke:",
        B,
    )
)
story.append(Paragraph("Podaci naloga (svi korisnici)", H2))
story.append(bullets([
    "Ime i prezime kontakt osobe",
    "Email adresa (koristi se i za prijavu, i za reset lozinke putem linka)",
    "Broj telefona",
    "Lozinka — čuva se isključivo u heširanom obliku (bcrypt), nikada u "
    "čitljivom tekstu",
]))
story.append(Paragraph("Podaci o firmi (klijent)", H2))
story.append(bullets([
    "Naziv firme",
    "PIB (opciono)",
    "Adresa firme (opciono)",
    "Sačuvane adrese za slanje pošiljki (adresar)",
]))
story.append(Paragraph("Podaci o dostavljaču", H2))
story.append(bullets([
    "Naziv, telefon, email, PIB",
    "Tip vozila i nosivost",
    "Zone pokrivenosti i cenovnik (cena po km, cena po kg, minimalna cena)",
    "Prosečna ocena, broj ocena i status verifikacije od strane klijenata",
    "Izvor kontakta (npr. APR, oglasi) — samo za interne potrebe operatera "
    "platforme, nije javno vidljivo",
    "Obračunate fakture za proviziju platforme",
]))
story.append(Paragraph("Podaci o pošiljci i porudžbini", H2))
story.append(bullets([
    "Adrese preuzimanja i isporuke (uključujući pretragu adrese preko mape, "
    "ukoliko je koristite), zone, tip pošiljke",
    "Napomene koje unese klijent",
    "Fotografija pošiljke kao dokaz o isporuci, ukoliko je priložena",
    "Cena ponude i obračunata provizija platforme",
    "Ocena i komentar koje klijent i dostavljač razmenjuju nakon isporuke",
]))
story.append(Paragraph("Tehnički podaci", H2))
story.append(bullets([
    "Kolačić (cookie) sesije prijave — neophodan da bi ste ostali prijavljeni; "
    "ne koristimo marketinške ili analitičke kolačiće trećih strana",
    "Standardni podaci servera (npr. IP adresa, vreme pristupa) radi "
    "bezbednosti i otklanjanja problema",
    "Pretraga adrese preko mape (Mapbox) — upit koji unesete se šalje "
    "Mapbox-u radi pronalaženja adrese; ne prosleđujemo Mapbox-u druge "
    "podatke o vašem nalogu",
]))

story.append(Paragraph("3. Zašto obrađujemo ove podatke", H1))
story.append(bullets([
    "Da bismo povezali klijente sa dostavljačima i omogućili poređenje i "
    "prihvatanje ponuda (izvršenje ugovora/pružanje usluge na vaš zahtev)",
    "Da bismo obračunali automatske ponude na osnovu cenovnika dostavljača "
    "i udaljenosti zona",
    "Da bismo omogućili praćenje statusa isporuke i istoriju pošiljki",
    "Da bismo obračunali i fakturisali proviziju platforme po realizovanoj "
    "dostavi",
    "Radi bezbednosti naloga i sprečavanja zloupotrebe (legitimni interes)",
]))

story.append(Paragraph("4. Kome delimo podatke", H1))
story.append(
    Paragraph(
        "Kontakt podaci klijenta (npr. telefon) postaju vidljivi dostavljaču "
        "tek nakon što klijent prihvati njegovu ponudu — pre toga dostavljač "
        "vidi samo podatke neophodne da proceni pošiljku (zone, tip, "
        "napomenu). Operater platforme ima uvid u sve podatke neophodne za "
        "rad platforme (npr. kreiranje naloga dostavljača, praćenje "
        "provizije, fakturisanje). Pretraga adrese preko mape se oslanja na "
        "Mapbox kao spoljnog provajdera geokodiranja. Ne prodajemo niti "
        "iznajmljujemo vaše podatke trećim licima u marketinške svrhe.",
        B,
    )
)

story.append(Paragraph("5. Koliko dugo čuvamo podatke", H1))
story.append(
    Paragraph(
        "Podatke naloga i istoriju pošiljki čuvamo dok je nalog aktivan. "
        "Nakon brisanja naloga, podaci se brišu ili anonimizuju u razumnom "
        "roku, osim ako smo po zakonu (npr. poreski propisi, izdate fakture) "
        "obavezni da određenu dokumentaciju čuvamo duže.",
        B,
    )
)

story.append(Paragraph("6. Vaša prava", H1))
story.append(
    Paragraph(
        "U skladu sa Zakonom o zaštiti podataka o ličnosti („Sl. "
        "glasnik RS“, br. 87/2018), imate pravo da zatražite pristup "
        "svojim podacima, njihovu ispravku ili brisanje, kao i da uložite "
        "prigovor na obradu. Zahtev možete poslati na [KONTAKT EMAIL].",
        B,
    )
)

story.append(Paragraph("7. Bezbednost podataka", H1))
story.append(
    Paragraph(
        "Lozinke se čuvaju isključivo u heširanom obliku. Pristup podacima "
        "unutar platforme je ograničen prema ulozi naloga (klijent, "
        "dostavljač, operater) — svaka uloga vidi samo podatke koji su joj "
        "neophodni za rad.",
        B,
    )
)

story.append(Paragraph("8. Izmene ove politike", H1))
story.append(
    Paragraph(
        "Ovu politiku možemo povremeno ažurirati, npr. kada dodamo novu "
        "funkcionalnost koja obrađuje nove vrste podataka. Datum poslednje "
        "izmene je naveden na vrhu dokumenta.",
        B,
    )
)

story.append(Paragraph("9. Kontakt", H1))
story.append(
    Paragraph(
        "Za sva pitanja o ovoj politici ili o obradi vaših podataka, "
        "pišite nam na [KONTAKT EMAIL].",
        B,
    )
)

doc = SimpleDocTemplate(
    OUT_PATH,
    pagesize=A4,
    topMargin=2 * cm,
    bottomMargin=2 * cm,
    leftMargin=2 * cm,
    rightMargin=2 * cm,
    title="Politika privatnosti — Ruta-Dostava",
)
doc.build(story)
print(f"Written: {OUT_PATH}")
