# Brief técnico: Web App de Clasificación de Daños Viales (Sumapaz)

## Contexto del proyecto

Continuación de la actividad académica R1-A2-S4 ("Redes que aprenden del
mundo") del curso Inteligencia Artificial — Universidad de Cundinamarca. En
Google Colab ya se entrenó un modelo de clasificación de imágenes que
identifica el estado de un tramo de vía a partir de una fotografía, como
apoyo a la priorización de reparaciones en la malla vial terciaria de la
Provincia del Sumapaz.

Esta tarea es **aparte** de la entrega académica (que ya está resuelta en el
notebook de Colab): es una web app local para poder probar el modelo de forma
más práctica y ágil, sin depender de Colab.

**Alcance de esta tarea:** app full-stack corriendo **solo en local**
(backend Python + frontend Next.js), para pruebas y una sustentación. No hay
que desplegarla en internet ni configurar hosting/CI/CD.

## Lo que ya existe

- Un modelo entrenado y exportado desde Colab: `modelo_vial_sumapaz.keras`.
  El usuario lo descarga manualmente de su sesión de Colab y lo coloca en el
  proyecto (ver estructura de carpetas abajo) — **este archivo no lo genera
  Claude Code**, ya existe y se asume presente.
- El modelo es una CNN por transfer learning sobre **MobileNetV2**
  (`tf.keras.applications.MobileNetV2`), con una cabeza de clasificación
  propia (`GlobalAveragePooling2D` → `Dropout` → `Dense(128, relu)` →
  `Dropout` → `Dense(3, softmax)`).
- **Clases, en este orden exacto** (el orden importa porque es el orden en
  que el softmax de salida entrega las probabilidades):
  ```
  ["buen_estado", "grietas", "huecos"]
  ```
- Tamaño de entrada de imagen: **224x224x3**, RGB.

### ⚠️ Detalle técnico importante (gotcha a tener en cuenta)

El preprocesamiento de MobileNetV2 (`tf.keras.applications.mobilenet_v2.preprocess_input`)
**está incluido dentro del propio modelo**, como una capa `Lambda` justo
después del input:

```python
x = layers.Lambda(preprocess_input)(inputs)
```

Esto significa que al servir el modelo en el backend **no hay que aplicar
ninguna normalización adicional manualmente** (ni dividir por 255, ni
restar medias) — solo hay que: abrir la imagen, convertirla a RGB,
redimensionarla a 224x224, y pasarla como array numpy directo (valores
0-255) al modelo. El modelo ya normaliza internamente.

Además, por tener una capa `Lambda` con una función arbitraria, al cargar el
modelo en Keras 3 probablemente haga falta:

```python
model = tf.keras.models.load_model("modelo_vial_sumapaz.keras", safe_mode=False)
```

Si al cargar da un error de deserialización relacionado con `Lambda` o
`safe_mode`, esa es la causa — no es un modelo corrupto.

## Qué construir

### Backend (Python, local)

- Framework sugerido: **FastAPI** + `uvicorn` (liviano, moderno, maneja bien
  subida de archivos, documentación automática en `/docs`).
- Un único endpoint principal:
  - `POST /predict` — recibe una imagen (`multipart/form-data`, campo
    `file`), devuelve la clase predicha y las probabilidades.
- `GET /health` opcional, para verificar que el servidor está arriba.
- **CORS habilitado** para el origen del frontend en desarrollo
  (`http://localhost:3000`).
- Dependencias mínimas esperadas: `fastapi`, `uvicorn`, `tensorflow`,
  `pillow`, `python-multipart`.
- Se corre local con algo como `uvicorn main:app --reload --port 8000`.

**Contrato de la API:**

Request: `POST /predict`, `multipart/form-data`, campo `file` = imagen
(jpg/png).

Response `200 OK`:
```json
{
  "predicted_class": "huecos",
  "confidence": 0.874,
  "probabilities": {
    "buen_estado": 0.021,
    "grietas": 0.105,
    "huecos": 0.874
  }
}
```

Response `400 Bad Request`: si el archivo no es una imagen válida o no se
puede procesar — devolver un mensaje de error claro en JSON.

### Frontend (React / Next.js)

- Una sola página es suficiente. Debe permitir:
  1. Seleccionar/subir un archivo de imagen (input tipo `file`, solo
     imágenes — **sin captura por cámara**, solo subida de archivo).
  2. Mostrar una vista previa de la imagen seleccionada.
  3. Botón "Predecir" que llama al backend (`POST http://localhost:8000/predict`).
  4. Mostrar el resultado: clase predicha, porcentaje de confianza, y
     idealmente una barra/indicador por cada una de las 3 clases.
  5. Manejar estados de carga (mientras espera respuesta) y de error (backend
     no disponible, archivo inválido, respuesta 400/500).
- La URL del backend debe quedar como variable de entorno
  (`NEXT_PUBLIC_API_URL`, ej. `http://localhost:8000`) y no hardcodeada, para
  poder cambiarla fácilmente después si se despliega en otro lado.
- No hace falta autenticación, base de datos, ni backend serverless — es una
  SPA simple que consume una API local.
- Estética: limpia y funcional, tema relacionado con infraestructura vial
  (tonos grises/asfalto, con algún color de alerta para clases de daño). No
  es necesario un diseño elaborado, pero sí que se vea cuidado — es para una
  sustentación académica.

## Estructura de carpetas sugerida

```
vial-sumapaz-app/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── model/
│       └── modelo_vial_sumapaz.keras      <- el usuario lo copia acá manualmente
├── frontend/
│   └── (proyecto Next.js estándar)
├── README.md                              <- instrucciones de instalación y ejecución de ambos servicios
└── .gitignore                             <- incluir venv/, node_modules/, __pycache__/, .next/
```

## Fuera de alcance (no incluir en esta tarea)

- Despliegue en Vercel, Render, Railway o cualquier otro servicio en la nube.
- Autenticación o manejo de usuarios.
- Captura de foto por cámara del celular (solo subida de archivo).
- Base de datos o historial de predicciones.
- Reentrenamiento o fine-tuning del modelo (eso ya se hizo en Colab).

## Checklist de aceptación

- [ ] `uvicorn main:app --reload` levanta el backend sin errores.
- [ ] El modelo `.keras` carga correctamente (atención al `Lambda` / `safe_mode`).
- [ ] `POST /predict` con una imagen de prueba devuelve JSON válido con las 3
      probabilidades y suman ~1.0.
- [ ] `npm run dev` levanta el frontend sin errores.
- [ ] Desde el frontend se puede subir una imagen, ver la vista previa, y
      obtener el resultado de la predicción mostrado en pantalla.
- [ ] Manejo de error visible si el backend no está corriendo o el archivo
      subido no es una imagen válida.
- [ ] `README.md` con pasos claros para instalar dependencias y correr
      backend y frontend en dos terminales separadas.

## Referencia (para contexto del código, no para reentrenar nada)

Arquitectura de entrenamiento usada en Colab, por si ayuda a entender por qué
el modelo espera lo que espera:

```python
base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights="imagenet")
inputs = tf.keras.Input(shape=(224, 224, 3))
x = layers.Lambda(preprocess_input)(inputs)
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.3)(x)
x = layers.Dense(128, activation="relu")(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(3, activation="softmax")(x)
```
