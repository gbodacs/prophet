const tabs = Array.from(document.querySelectorAll('.tab-button'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));

const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('csv-file');
const progressBar = document.getElementById('progress-bar');
const uploadStatus = document.getElementById('upload-status');
const uploadLog = document.getElementById('upload-log');

const runsList = document.getElementById('runs-list');
const refreshListButton = document.getElementById('refresh-list');
const selectedRunMeta = document.getElementById('selected-run-meta');
const imagesGrid = document.getElementById('images-grid');

const deleteRunsList = document.getElementById('delete-runs-list');
const deleteFeedback = document.getElementById('delete-feedback');
const refreshDeleteButton = document.getElementById('refresh-delete-list');

let waitingInterval = null;

function setActiveTab(tabId) {
  tabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabId);
  });

  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

function logStep(message) {
  const li = document.createElement('li');
  li.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  uploadLog.prepend(li);
}

function setProgress(percent) {
  progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function startWaitingAnimation() {
  stopWaitingAnimation();
  let dots = 0;
  waitingInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    uploadStatus.textContent = `Feldolgozás folyamatban${'.'.repeat(dots)}`;
  }, 350);
}

function stopWaitingAnimation() {
  if (waitingInterval) {
    clearInterval(waitingInterval);
    waitingInterval = null;
  }
}

async function fetchOperations() {
  const response = await fetch('/api/operations');

  if (response.status === 401) {
    window.location.href = '/login';
    return [];
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'A számítások betöltése sikertelen');
  }

  return payload.operations || [];
}

function renderSelectedRun(run) {
  selectedRunMeta.textContent = `${run.csvFileName}`;
  imagesGrid.innerHTML = '';

  const csvName = typeof run.csvFileName === 'string' ? run.csvFileName : '';
  if (csvName) {
    const predictCsvName = csvName.replace(/\.csv$/i, '_predict.csv');
    const downloadWrap = document.createElement('div');
    downloadWrap.className = 'predict-download';

    const downloadLink = document.createElement('a');
    downloadLink.href = `/public/results/${encodeURIComponent(predictCsvName)}`;
    downloadLink.download = predictCsvName;
    downloadLink.textContent = `Predikció CSV letöltése (${predictCsvName})`;

    downloadWrap.appendChild(downloadLink);
    imagesGrid.appendChild(downloadWrap);
  }

  run.pngFileNames.forEach((fileName, index) => {
    const img = document.createElement('img');
    img.alt = `Result image ${index + 1}`;
    img.src = `/public/results/${encodeURIComponent(fileName)}`;
    img.addEventListener('click', () => openImageModal(img.src));
    imagesGrid.appendChild(img);
  });
}

function renderRunsList(operations) {
  runsList.innerHTML = '';
  imagesGrid.innerHTML = '';
  selectedRunMeta.textContent = 'Válassz egy számítást, hogy megnézd a képeit.';

  if (!operations.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Még nincs sikeres számítás.';
    runsList.appendChild(empty);
    return;
  }

  operations.reverse().forEach((operation) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${operation.baseName} (${operation.token})`;
    button.addEventListener('click', () => renderSelectedRun(operation));
    li.appendChild(button);
    runsList.appendChild(li);
  });
}

function renderDeleteList(operations) {
  deleteRunsList.innerHTML = '';

  if (!operations.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Nincs elérhető számítás törlésre.';
    deleteRunsList.appendChild(empty);
    return;
  }

  operations.forEach((operation) => {
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'delete-row';

    const text = document.createElement('span');
    text.textContent = `${operation.csvFileName}`;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Törlés';
    button.addEventListener('click', async () => {
      const confirmDelete = window.confirm(`Biztosan törölni szeretnéd a(z) ${operation.csvFileName} számítást?`);
      if (!confirmDelete) {
        return;
      }

      deleteFeedback.textContent = 'A számítás törlése folyamatban...';
      try {
        const response = await fetch(`/api/operations/${encodeURIComponent(operation.id)}`, {
          method: 'DELETE'
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'A törlés sikertelen');
        }

        deleteFeedback.textContent = 'A számítás sikeresen törölve.';
        await refreshLists();
      } catch (error) {
        deleteFeedback.textContent = error.message;
      }
    });

    row.appendChild(text);
    row.appendChild(button);
    li.appendChild(row);
    deleteRunsList.appendChild(li);
  });
}

async function refreshLists() {
  try {
    const operations = await fetchOperations();
    renderRunsList(operations);
    renderDeleteList(operations);
  } catch (error) {
    runsList.innerHTML = `<li>${error.message}</li>`;
    deleteRunsList.innerHTML = `<li>${error.message}</li>`;
  }
}

function uploadWithProgress(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const percent = Math.round((event.loaded / event.total) * 80);
      setProgress(percent);
      uploadStatus.textContent = `Feltöltés ${percent}%`;
    };

    xhr.onloadstart = () => {
      setProgress(5);
      logStep('A feltöltés megkezdődött.');
    };

    xhr.onerror = () => {
      reject(new Error('Hálózati hiba a feltöltés során'));
    };

    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || '{}');

        if (xhr.status === 401) {
          window.location.href = '/login';
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload);
          return;
        }

        reject(new Error(payload.error || 'A feltöltés sikertelen'));
      } catch {
        reject(new Error('Hibás válasz a szervertől'));
      }
    };

    xhr.send(formData);
  });
}

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const file = fileInput.files && fileInput.files[0];
  if (!file) {
    uploadStatus.textContent = 'Kérlek, válassz egy CSV fájlt.';
    return;
  }

  setProgress(0);
  uploadLog.innerHTML = '';
  deleteFeedback.textContent = '';

  try {
    logStep(`Kiválasztott fájl: ${file.name}`);
    const uploadPromise = uploadWithProgress(file);

    startWaitingAnimation();
    logStep('Fájl feltöltve. Várakozás a szerver oldali feldolgozásra...');
    const payload = await uploadPromise;

    stopWaitingAnimation();
    setProgress(100);
    uploadStatus.textContent = 'A feldolgozás sikeresen befejeződött.';
    logStep(payload.message || 'A feldolgozás sikeresen befejeződött.');
    await refreshLists();
  } catch (error) {
    stopWaitingAnimation();
    setProgress(0);
    uploadStatus.textContent = error.message;
    logStep(`Hiba: ${error.message}`);
  }
});

refreshListButton.addEventListener('click', refreshLists);
refreshDeleteButton.addEventListener('click', refreshLists);

tabs.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveTab(button.dataset.tab);
  });
});

// Image Modal Functionality
function createImageModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'image-modal';

  const content = document.createElement('div');
  content.className = 'modal-content';

  const closeBtn = document.createElement('div');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closeImageModal);

  const img = document.createElement('img');
  img.className = 'modal-image';

  content.appendChild(closeBtn);
  content.appendChild(img);
  overlay.appendChild(content);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeImageModal();
    }
  });

  document.body.appendChild(overlay);
  return overlay;
}

const imageModal = createImageModal();
const modalImage = imageModal.querySelector('.modal-image');

function openImageModal(src) {
  modalImage.src = src;
  imageModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeImageModal() {
  imageModal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && imageModal.classList.contains('active')) {
    closeImageModal();
  }
});

void refreshLists();
