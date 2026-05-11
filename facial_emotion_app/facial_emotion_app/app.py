from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64
import os

app = Flask(__name__)
CORS(app)

# ── Cargar modelo ──────────────────────────────────────────────
MODEL_PATH = "Modelo_CNN_Mejorado_v2.keras"
model = None

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"✓ Modelo cargado: {MODEL_PATH}")
    else:
        print(f"⚠ Modelo no encontrado en: {MODEL_PATH}")

load_model()

# ── Clases y recursos ─────────────────────────────────────────
CLASS_NAMES = ['happy', 'neutral', 'sad']

RECURSOS = {
    'happy': {
        'emoji': '😊',
        'label': 'Feliz',
        'mensaje': '¡Tu expresión refleja bienestar! Sigue cuidando tu salud mental.',
        'color': '#22c55e',
        'recursos': [
            {'nombre': 'Hablemos de Todo', 'url': 'https://hablemosdetodo.gov.co', 'desc': 'Plataforma para jóvenes'},
            {'nombre': 'Mentally Colombia', 'url': 'https://mentally.co', 'desc': 'App de bienestar mental'},
            {'nombre': 'Minsalud - Salud Mental', 'url': 'https://www.minsalud.gov.co/salud/publica/SMental', 'desc': 'Recursos oficiales'},
        ]
    },
    'neutral': {
        'emoji': '😐',
        'label': 'Neutral',
        'mensaje': 'Pareces tranquilo/a. Si necesitas apoyo, estos recursos están disponibles.',
        'color': '#3b82f6',
        'recursos': [
            {'nombre': 'Aquí Estoy Colombia', 'url': 'https://aquiestoy.co', 'desc': 'Chat de apoyo emocional'},
            {'nombre': 'Mentally Colombia', 'url': 'https://mentally.co', 'desc': 'App de bienestar mental'},
            {'nombre': 'Línea 106', 'url': 'tel:106', 'desc': 'Línea gratuita 24/7'},
        ]
    },
    'sad': {
        'emoji': '😢',
        'label': 'Triste',
        'mensaje': 'Parece que puedes estar pasando un momento difícil. No estás solo/a.',
        'color': '#f59e0b',
        'recursos': [
            {'nombre': 'Línea 106', 'url': 'tel:106', 'desc': 'Línea gratuita 24/7'},
            {'nombre': 'Aquí Estoy Colombia', 'url': 'https://aquiestoy.co', 'desc': 'Chat de apoyo emocional'},
            {'nombre': 'Fundación Escucha', 'url': 'https://fundacionescucha.org', 'desc': 'Apoyo psicológico gratuito'},
        ]
    }
}

# ── Preprocesar imagen ────────────────────────────────────────
def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert('L')  # grayscale
    img = img.resize((48, 48))
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = arr.reshape(1, 48, 48, 1)
    return arr

# ── Rutas ─────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Modelo no cargado'}), 500

    try:
        # Aceptar imagen como archivo o base64
        if 'file' in request.files:
            image_bytes = request.files['file'].read()
        elif request.json and 'image' in request.json:
            image_data = request.json['image'].split(',')[1]
            image_bytes = base64.b64decode(image_data)
        else:
            return jsonify({'error': 'No se recibió imagen'}), 400

        arr = preprocess_image(image_bytes)
        pred = model.predict(arr, verbose=0)
        idx = int(np.argmax(pred[0]))
        emocion = CLASS_NAMES[idx]
        confianza = float(pred[0][idx]) * 100

        probabilidades = {
            CLASS_NAMES[i]: round(float(pred[0][i]) * 100, 1)
            for i in range(len(CLASS_NAMES))
        }

        return jsonify({
            'emocion': emocion,
            'label': RECURSOS[emocion]['label'],
            'emoji': RECURSOS[emocion]['emoji'],
            'confianza': round(confianza, 2),
            'color': RECURSOS[emocion]['color'],
            'mensaje': RECURSOS[emocion]['mensaje'],
            'recursos': RECURSOS[emocion]['recursos'],
            'probabilidades': probabilidades
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
