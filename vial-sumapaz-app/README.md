# Clasificador Vial Sumapaz

App local para probar el modelo de clasificación de daños viales (CNN sobre
MobileNetV2) entrenado en el notebook `R1_A2_S4_Clasificacion_Vial_Sumapaz.ipynb`.
Corre solo en local: backend en FastAPI y frontend en Next.js.

## Antes de arrancar

Copia el archivo `modelo_vial_sumapaz.keras` (descargado de tu sesión de
Colab) a `backend/model/modelo_vial_sumapaz.keras`. El backend no funciona
sin ese archivo.

## Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # en Windows (PowerShell/cmd)
# source venv/bin/activate   # en macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Verifica que quedó arriba en http://localhost:8000/health y revisa la
documentación automática en http://localhost:8000/docs.

## Frontend (Next.js)

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:3000. Si necesitas apuntar a otra URL de backend, crea
un archivo `.env.local` (puedes copiar `.env.local.example`) con:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Uso

1. Con el backend y el frontend corriendo, sube una foto de un tramo de vía.
2. Presiona "Predecir".
3. Verás la clase predicha (buen estado, grietas o huecos) y el porcentaje de
   confianza de cada clase.
