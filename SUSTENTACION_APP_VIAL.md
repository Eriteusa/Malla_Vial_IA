# Clasificador Vial Sumapaz — Explicación del proyecto

## 1. ¿De dónde viene esto?

Este trabajo es la continuación de la actividad **R1-A2-S4 "Redes que aprenden
del mundo"**, del curso de Inteligencia Artificial. En esa actividad, en un
notebook de Google Colab, se entrenó una red neuronal (una CNN, con la técnica
de *transfer learning* sobre MobileNetV2) capaz de mirar una foto de una vía y
decir si está en **buen estado**, tiene **grietas** o tiene **huecos**.

Esa parte académica ya estaba resuelta y entregada en el notebook. Lo que se
construyó después, y de lo que trata este documento, es **una aplicación web
aparte**, para poder probar ese modelo de forma más práctica que abriendo
Google Colab cada vez.

## 2. ¿Qué se construyó?

Una aplicación que corre en el computador (no está publicada en internet,
solo para pruebas y sustentación) con dos partes:

- **Un backend** (la parte que "piensa"): recibe una foto, se la pasa al
  modelo entrenado, y devuelve la predicción.
- **Un frontend** (la parte visual): una página web sencilla donde se sube la
  foto, se ve la vista previa, y se muestra el resultado con un color y una
  barra de porcentaje por cada clase.

## 3. ¿Cómo funciona, en simple?

```
Usuario sube una foto
        │
        ▼
El backend redimensiona la foto a 224x224 píxeles
        │
        ▼
El modelo entrenado (el .keras de Colab) la analiza
        │
        ▼
Devuelve 3 porcentajes: % buen estado, % grietas, % huecos
        │
        ▼
La página web muestra la clase más probable y las 3 barras
```

## 4. Tecnologías usadas (y por qué)

| Parte | Herramienta | ¿Por qué? |
|---|---|---|
| Backend | **FastAPI** (Python) | Framework liviano, pensado para recibir archivos y responder en formato JSON, con documentación automática. |
| Frontend | **Next.js** (React) | Permite construir la interfaz web de forma rápida y ordenada. |
| Modelo | El mismo `.keras` entrenado en Colab | No se reentrenó nada; la app solo **usa** el modelo ya entrenado. |

## 5. Un problema técnico real que se encontró y se resolvió

Al cargar el modelo en el backend apareció un error inesperado: la librería
Keras (versión 3) no lograba reconstruir correctamente la parte del modelo
que normaliza la imagen automáticamente (una capa `Lambda` que usa la función
`preprocess_input` de MobileNetV2). El modelo no estaba dañado — era una
incompatibilidad de cómo Keras 3 guarda y vuelve a cargar ese tipo de capas.

La solución fue indicarle explícitamente al backend, al momento de cargar el
modelo, cuál es esa función (`preprocess_input`), para que la reconozca. Con
ese ajuste, el modelo carga sin problema.

## 6. ¿Cómo se comprobó que funciona?

Antes de dar el proyecto por terminado, se probó de punta a punta:

1. Se subió una foto real de una vía deteriorada a través de la página web.
2. El backend la procesó con el modelo entrenado.
3. La aplicación mostró el resultado correctamente: **Huecos, 94.1% de
   confianza**, con las probabilidades de las otras dos clases también
   visibles.
4. Se probó también qué pasa si el backend no está encendido o si se sube un
   archivo que no es una imagen: en ambos casos la aplicación avisa el error
   de forma clara, en vez de fallar sin explicación.

## 7. Resultado final

Una aplicación local, funcional, que le permite a cualquier persona (por
ejemplo, en la sustentación) subir una foto de una vía y ver en segundos qué
tan dañada está según el modelo entrenado, sin depender de tener Google Colab
abierto.
