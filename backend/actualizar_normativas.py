import requests
import json
import re
from datetime import datetime

# === Configuración ===
API_KEY = "AIzaSyBDa1v-1y-DHj0hePEmmjXJd80WzshUUpo"
CSE_ID = "525ed292349a84f17"
URL = "https://www.googleapis.com/customsearch/v1"

# === Temas asociados a tus servicios ===
TEMAS = {
    "Migración": "ley migracion chile site:leychile.cl",
    "Derecho Civil": "derecho civil chile site:leychile.cl",
    "Familia": "familia chile site:leychile.cl",
    "Copropiedad": "copropiedad chile site:leychile.cl",
    "Consumidor": "derecho consumidor chile site:leychile.cl",
    "Marcas": "marcas propiedad intelectual chile site:leychile.cl"
}

def limpiar_texto(texto):
    """Normaliza texto para comparar duplicados."""
    return "".join(c.lower() for c in texto if c.isalnum() or c.isspace()).strip()

def enriquecer_titulo(titulo, descripcion):
    """
    Intenta detectar número de ley o decreto y construir un título más informativo.
    Ejemplo: 'Ley Chile - Biblioteca del Congreso Nacional' -> 'Ley N° 21325 - Migración y Extranjería'
    """
    texto_completo = f"{titulo} {descripcion}"

    # Buscar número de ley o decreto
    match_ley = re.search(r"Ley\s*N[°º]?\s*(\d{4,5})", texto_completo, re.IGNORECASE)
    match_decreto = re.search(r"Decreto\s*(Supremo|Exento)?\s*N[°º]?\s*(\d{2,5})", texto_completo, re.IGNORECASE)

    if match_ley:
        numero = match_ley.group(1)
        return f"Ley N° {numero} — {titulo.split('-')[0].strip()}"
    elif match_decreto:
        numero = match_decreto.group(2)
        return f"Decreto N° {numero} — {titulo.split('-')[0].strip()}"

    # Si no encuentra, limpiar el título original
    titulo = re.sub(r"-\s*Ley Chile.*", "", titulo).strip()
    return titulo or "Normativa sin título específico"

def buscar_normativas(tema, query, filtro_fecha=False):
    """Consulta la API con filtros según tipo de búsqueda."""
    params = {
        "key": API_KEY,
        "cx": CSE_ID,
        "q": query,
        "num": 5,
        "lr": "lang_es"
    }

    if filtro_fecha:
        params["sort"] = "date"
        params["q"] += " after:2023-01-01"

    try:
        response = requests.get(URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        items = data.get("items", [])

        resultados = []
        for item in items:
            link = item.get("link", "")
            titulo_original = item.get("title", "").strip()
            descripcion = item.get("snippet", "")

            # Ignorar resultados sin enlace válido
            if not link or link == "#":
                continue

            # Enriquecer título para hacerlo más legible y único
            titulo_final = enriquecer_titulo(titulo_original, descripcion)

            resultados.append({
                "tema": tema,
                "titulo": titulo_final,
                "descripcion": descripcion,
                "link": link,
                "fuente": "LeyChile.cl",
                "fecha_consulta": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "tipo": "Reciente" if filtro_fecha else "Relevante"
            })

        tipo = "recientes" if filtro_fecha else "relevantes"
        print(f"📘 {len(resultados)} resultados {tipo} para '{tema}'.")
        return resultados

    except requests.exceptions.RequestException as e:
        print(f"⚠️ Error al buscar '{tema}': {e}")
        return []

def main():
    print("🌐 Obteniendo normativas recientes y relevantes...\n")
    todas = []

    for tema, query in TEMAS.items():
        recientes = buscar_normativas(tema, query, filtro_fecha=True)
        relevantes = buscar_normativas(tema, query, filtro_fecha=False)
        todas.extend(recientes + relevantes)

    # === Eliminar duplicados (por título o URL) ===
    vistos = set()
    unicas = []
    for norma in todas:
        clave = (limpiar_texto(norma["titulo"]), norma["link"])
        if clave not in vistos:
            unicas.append(norma)
            vistos.add(clave)

    # === Guardar JSON final ===
    data = {
        "metadata": {
            "ultima_actualizacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_normas": len(unicas),
            "fuente": "Google Custom Search API (LeyChile.cl)",
            "criterio": "Leyes recientes y relevantes, con títulos enriquecidos automáticamente"
        },
        "normativas": unicas
    }

    output = "data/ultimas_normativas.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f"\n✅ Se guardaron {len(unicas)} normativas únicas con títulos mejorados.")
    print(f"📁 Archivo generado: {output}")

if __name__ == "__main__":
    main()
