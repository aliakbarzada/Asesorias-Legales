import schedule
import time
import subprocess
from datetime import datetime

# Ruta hacia tu script principal
SCRIPT_PATH = "actualizar_normativas.py"

def ejecutar_actualizacion():
    """Ejecuta el script de actualización de normativas"""
    print(f"\n🕒 [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Ejecutando actualización automática...")
    subprocess.run(["python", SCRIPT_PATH])
    print("✅ Actualización completada.\n")

# === CONFIGURACIÓN DEL SCHEDULE ===
# Ejecutar cada día a las 09:00 AM
#schedule.every().day.at("09:00").do(ejecutar_actualizacion)

# También podrías hacerlo semanal:
schedule.every().monday.at("09:00").do(ejecutar_actualizacion)

print("🚀 Iniciando programador automático de actualizaciones...")

while True:
    schedule.run_pending()
    time.sleep(60)
