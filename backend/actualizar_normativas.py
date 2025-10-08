import requests
import json
  
# === Configuración ===
API_KEY = "AIzaSyBDa1v-1y-DHj0hePEmmjXJd80WzshUUpo"
CSE_ID = "525ed292349a84f17"
QUERY = "nuevas leyes site:leychile.cl"

# === Llamada a la API ===
url = "https://www.googleapis.com/customsearch/v1"
params = {
    "key": API_KEY,
    "cx": CSE_ID,
    "q": QUERY,
    "num": 5,
    "lr": "lang_es"  
}

print("🔍 Consultando API de Google Custom Search...")
response = requests.get(url, params=params)
print("📡 URL generada:", response.url)
print("🔢 Código de respuesta HTTP:", response.status_code)

# === Resultados ===
if response.status_code == 200:
    data = response.json()
    items = data.get("items", [])
    print(f"✅ {len(items)} resultados encontrados.\n")
    for i, item in enumerate(items, 1):
        print(f"{i}. {item.get('title')}")
        print(f"   {item.get('link')}")
        print(f"   {item.get('snippet')}\n")
else:
    print("❌ Error al conectar:\n", response.text)

# === Guardar resultados en archivo ===
with open("../data/ultimas_normativas.json", "w", encoding="utf-8") as f:
    json.dump(items, f, ensure_ascii=False, indent=4)

print("\n💾 Resultados guardados en ../data/ultimas_normativas.json")
