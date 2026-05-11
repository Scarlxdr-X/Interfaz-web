# EmotiScan — Plataforma de Reconocimiento Facial

Plataforma web para reconocimiento automático de expresiones faciales básicas usando CNN.

## Estructura del proyecto

```
facial_emotion_app/
├── app.py                  ← Backend Flask
├── requirements.txt        ← Dependencias
├── Modelo_CNN_Mejorado_v2.keras  ← Modelo entrenado (DEBES COPIARLO AQUÍ)
├── templates/
│   └── index.html          ← Frontend
└── static/
    ├── css/style.css
    └── js/app.js
```

## Instrucciones para correr en GitHub Codespaces

### 1. Subir el modelo
Copia el archivo `Modelo_CNN_Mejorado_v2.keras` (descargado de Colab) 
a la carpeta raíz del proyecto `facial_emotion_app/`.

### 2. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 3. Correr la app
```bash
python app.py
```

### 4. Abrir en el navegador
Codespaces te mostrará una notificación para abrir el puerto 5000.
Haz clic en "Abrir en el navegador" o ve a la pestaña "Ports".

## Rutas disponibles
- `GET  /`         → Interfaz web
- `GET  /health`   → Estado del servidor y modelo
- `POST /predict`  → Analizar imagen (multipart/form-data o base64)

## Notas
- El modelo debe estar en la misma carpeta que app.py
- La app corre en el puerto 5000 por defecto
- Compatible con cámara web y carga de archivos
