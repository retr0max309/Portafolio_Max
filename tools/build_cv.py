"""Genera el CV de una página que se ofrece desde index.html."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Maximiliano_Turdera_Colque_CV.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

regular = Path("C:/Windows/Fonts/arial.ttf")
bold = Path("C:/Windows/Fonts/arialbd.ttf")
if regular.exists() and bold.exists():
    pdfmetrics.registerFont(TTFont("CV", str(regular)))
    pdfmetrics.registerFont(TTFont("CV-Bold", str(bold)))
    font, bold_font = "CV", "CV-Bold"
else:
    font, bold_font = "Helvetica", "Helvetica-Bold"

ink = colors.HexColor("#142033")
blue = colors.HexColor("#2149BA")
muted = colors.HexColor("#4C5A6D")
rule = colors.HexColor("#DCE3EE")

styles = {
    "name": ParagraphStyle("name", fontName=bold_font, fontSize=20, leading=24, textColor=ink, spaceAfter=2),
    "role": ParagraphStyle("role", fontName=bold_font, fontSize=10.5, leading=14, textColor=blue, spaceAfter=5),
    "contact": ParagraphStyle("contact", fontName=font, fontSize=9.4, leading=13, textColor=muted, spaceAfter=1),
    "section": ParagraphStyle("section", fontName=bold_font, fontSize=10.5, leading=14, textColor=blue, spaceBefore=17, spaceAfter=5),
    "body": ParagraphStyle("body", fontName=font, fontSize=10, leading=14.5, textColor=ink, spaceAfter=4),
    "small": ParagraphStyle("small", fontName=font, fontSize=9.4, leading=13, textColor=muted, spaceAfter=3),
    "project": ParagraphStyle("project", fontName=bold_font, fontSize=10.3, leading=14, textColor=ink, spaceBefore=8, spaceAfter=2),
}

def para(text, style="body"):
    return Paragraph(text, styles[style])

story = [
    para("MAXIMILIANO TURDERA COLQUE", "name"),
    para("Desarrollador de software junior", "role"),
    para(
        'Sucre, Bolivia  |  <link href="mailto:maximilianoturdera@gmail.com" color="#2149BA">maximilianoturdera@gmail.com</link>  |  '
        '<link href="https://github.com/retr0max309" color="#2149BA">github.com/retr0max309</link>',
        "contact",
    ),
    Spacer(1, 4),
    HRFlowable(width="100%", thickness=1, color=rule),
    para("PERFIL", "section"),
    para(
        "Estudiante de Ingeniería en Sistemas Informáticos en Univalle. Busco mi primera oportunidad como desarrollador junior para aportar en un equipo y seguir creciendo. He participado en proyectos web individuales y colaborativos; a largo plazo quiero especializarme en inteligencia artificial."
    ),
    para("PROYECTOS", "section"),
    para('Barbara Ocasión  |  Sitio web para salón de eventos  |  2026', "project"),
    para(
        "Diseño e implementación individual con Next.js, React, TypeScript y Tailwind CSS. Construí páginas de servicios, eventos y contacto; trabajé en adaptación móvil, rendimiento e indexación."
    ),
    para(
        '<link href="https://www.barbaraocasion.com/" color="#2149BA">Sitio</link>  |  '
        '<link href="https://github.com/retr0max309/Barbara-Ocasi-n" color="#2149BA">Código fuente</link>',
        "small",
    ),
    para("SucreExpress  |  Gestión de paquetería  |  2026", "project"),
    para(
        "Proyecto colaborativo con frontend Next.js, API NestJS, TypeScript y Supabase. Participé en la interfaz y en ajustes de integración para SSR y CORS. El repositorio documenta módulos de paquetes, repartidores, rutas e incidencias."
    ),
    para(
        '<link href="https://github.com/SucrExpress/Sucrexpress" color="#2149BA">Código fuente</link>',
        "small",
    ),
    para("CEIPI  |  Sitio institucional  |  En desarrollo", "project"),
    para(
        "Participación colaborativa en un sitio para presentar servicios, especialistas e información de contacto. Repositorio privado por decisión de su creador.",
        "body",
    ),
    para("HABILIDADES TÉCNICAS", "section"),
    para("<b>Aplicadas en los proyectos mostrados:</b> TypeScript, React, Next.js, NestJS, HTML, CSS, Supabase."),
    para("<b>En formación y práctica:</b> Python, SQL y fundamentos de bases de datos."),
    para("FORMACIÓN", "section"),
    para("<b>Ingeniería en Sistemas Informáticos</b> - Universidad del Valle, Sucre | 2024 - actualidad"),
    para("<b>Inglés B2+</b> - Centro Boliviano Americano | 2023 - 2025"),
    para("FORMACIÓN COMPLEMENTARIA", "section"),
    para("Fundamentos de Python 1 (Cisco Networking Academy, 2024)  |  Introducción a la IA moderna (Cisco Networking Academy, 2025)  |  CCNA: Introducción a las redes (Cisco Networking Academy, 2026)  |  SQL Developer y Java JDK (Oracle Academy).", "small"),
]

doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=16 * mm,
    leftMargin=16 * mm,
    topMargin=15 * mm,
    bottomMargin=15 * mm,
    title="CV - Maximiliano Turdera Colque",
    author="Maximiliano Turdera Colque",
)
doc.build(story)
print(OUTPUT)
