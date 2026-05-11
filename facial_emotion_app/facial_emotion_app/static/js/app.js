// ── Estado ────────────────────────────────────────────────────
let stream = null;
let capturedBlob = null;
let currentTab = 'camara';

// ── Tabs ──────────────────────────────────────────────────────
function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`#tab-${tab}`).classList.add('active');
  event.target.classList.add('active');
  resetPreview();
}

// ── Cámara ────────────────────────────────────────────────────
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    const video = document.getElementById('video');
    video.srcObject = stream;
    document.getElementById('video-overlay').style.display = 'none';
    document.getElementById('btn-capture').disabled = false;
  } catch (e) {
    alert('No se pudo acceder a la cámara: ' + e.message);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  document.getElementById('video-overlay').style.display = 'flex';
  document.getElementById('btn-capture').disabled = true;
}

function capturePhoto() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -canvas.width, 0);
  ctx.restore();

  canvas.toBlob(blob => {
    capturedBlob = blob;
    showPreview(URL.createObjectURL(blob));
  }, 'image/jpeg', 0.92);
}

// ── Archivo ───────────────────────────────────────────────────
function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('La imagen supera 5MB. Por favor usa una imagen más pequeña.');
    return;
  }
  capturedBlob = file;
  showPreview(URL.createObjectURL(file));
}

// Drag & drop
const dropZone = document.getElementById('drop-zone');
if (dropZone) {
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent)'; });
  dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      capturedBlob = file;
      showPreview(URL.createObjectURL(file));
    }
  });
}

// ── Preview ───────────────────────────────────────────────────
function showPreview(url) {
  const area = document.getElementById('preview-area');
  const img  = document.getElementById('preview-img');
  img.src = url;
  area.style.display = 'flex';
  resetResult();
}

function resetPreview() {
  capturedBlob = null;
  document.getElementById('preview-area').style.display = 'none';
  document.getElementById('preview-img').src = '';
  resetResult();
}

// ── Análisis ──────────────────────────────────────────────────
async function analyzeImage() {
  if (!capturedBlob) return;

  showLoading();

  const formData = new FormData();
  formData.append('file', capturedBlob, 'foto.jpg');

  try {
    const res = await fetch('/predict', { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();
    showResult(data);
  } catch (err) {
    hideLoading();
    alert('Error al analizar la imagen: ' + err.message);
  }
}

// ── UI States ─────────────────────────────────────────────────
function showLoading() {
  document.getElementById('result-empty').style.display   = 'none';
  document.getElementById('result-loading').style.display = 'flex';
  document.getElementById('result-content').style.display = 'none';
}

function hideLoading() {
  document.getElementById('result-loading').style.display = 'none';
}

function resetResult() {
  document.getElementById('result-empty').style.display   = 'flex';
  document.getElementById('result-loading').style.display = 'none';
  document.getElementById('result-content').style.display = 'none';
}

function showResult(data) {
  hideLoading();

  // Emoción card
  document.getElementById('emocion-emoji').textContent    = data.emoji;
  document.getElementById('emocion-label').textContent    = data.label;
  document.getElementById('emocion-confianza').textContent = `Confianza: ${data.confianza.toFixed(1)}%`;

  const card = document.getElementById('emocion-card');
  card.style.borderColor = data.color;

  // Barras de probabilidad
  const barsEl = document.getElementById('prob-bars');
  barsEl.innerHTML = '';
  const EMOJIS = { happy: '😊', neutral: '😐', sad: '😢' };
  const COLORS = { happy: '#22c55e', neutral: '#3b82f6', sad: '#f59e0b' };
  const LABELS = { happy: 'Feliz', neutral: 'Neutral', sad: 'Triste' };

  Object.entries(data.probabilidades)
    .sort((a, b) => b[1] - a[1])
    .forEach(([emo, pct]) => {
      barsEl.innerHTML += `
        <div class="prob-bar-item">
          <span class="prob-label">${EMOJIS[emo]} ${LABELS[emo]}</span>
          <div class="prob-track">
            <div class="prob-fill" style="width:${pct}%;background:${COLORS[emo]}"></div>
          </div>
          <span class="prob-val">${pct}%</span>
        </div>`;
    });

  // Mensaje
  const msgCard = document.getElementById('mensaje-card');
  msgCard.style.borderLeftColor = data.color;
  document.getElementById('mensaje-text').textContent = data.mensaje;

  // Recursos
  const recursosEl = document.getElementById('recursos-list');
  recursosEl.innerHTML = '';
  data.recursos.forEach(r => {
    recursosEl.innerHTML += `
      <a href="${r.url}" target="_blank" rel="noopener" class="recurso-item">
        <div class="recurso-dot" style="background:${data.color}"></div>
        <div class="recurso-info">
          <div class="recurso-nombre">${r.nombre}</div>
          <div class="recurso-desc">${r.desc}</div>
        </div>
        <span class="recurso-arrow">→</span>
      </a>`;
  });

  document.getElementById('result-content').style.display = 'block';

  // Scroll suave al resultado en móvil
  if (window.innerWidth < 768) {
    document.getElementById('result-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
