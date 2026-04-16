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
    uploadStatus.textContent = `Processing${'.'.repeat(dots)}`;
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
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to load operations');
  }

  return payload.operations || [];
}

function renderSelectedRun(run) {
  selectedRunMeta.textContent = `${run.csvFileName} | token: ${run.token} | created: ${run.createdAt}`;
  imagesGrid.innerHTML = '';

  run.pngFileNames.forEach((fileName, index) => {
    const img = document.createElement('img');
    img.alt = `Result image ${index + 1}`;
    img.src = `/public/results/${encodeURIComponent(fileName)}`;
    imagesGrid.appendChild(img);
  });
}

function renderRunsList(operations) {
  runsList.innerHTML = '';
  imagesGrid.innerHTML = '';
  selectedRunMeta.textContent = 'Select a run to see its three generated images.';

  if (!operations.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No successful runs yet.';
    runsList.appendChild(empty);
    return;
  }

  operations.forEach((operation) => {
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
    empty.textContent = 'No runs available for deletion.';
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
    button.textContent = 'Delete';
    button.addEventListener('click', async () => {
      const confirmDelete = window.confirm(`Are you sure you want to delete run ${operation.csvFileName}?`);
      if (!confirmDelete) {
        return;
      }

      deleteFeedback.textContent = 'Deleting run...';
      try {
        const response = await fetch(`/api/operations/${encodeURIComponent(operation.id)}`, {
          method: 'DELETE'
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Delete failed');
        }

        deleteFeedback.textContent = 'Run deleted successfully.';
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
      uploadStatus.textContent = `Uploading ${percent}%`;
    };

    xhr.onloadstart = () => {
      setProgress(5);
      logStep('Upload started');
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload);
          return;
        }

        reject(new Error(payload.error || 'Upload failed'));
      } catch {
        reject(new Error('Invalid server response'));
      }
    };

    xhr.send(formData);
  });
}

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const file = fileInput.files && fileInput.files[0];
  if (!file) {
    uploadStatus.textContent = 'Please choose a CSV file.';
    return;
  }

  setProgress(0);
  uploadLog.innerHTML = '';
  deleteFeedback.textContent = '';

  try {
    logStep(`Selected file: ${file.name}`);
    const uploadPromise = uploadWithProgress(file);

    startWaitingAnimation();
    logStep('File uploaded. Waiting for server-side processing');

    const payload = await uploadPromise;

    stopWaitingAnimation();
    setProgress(100);
    uploadStatus.textContent = 'Processing completed successfully.';
    logStep(payload.message || 'Run completed');
    await refreshLists();
  } catch (error) {
    stopWaitingAnimation();
    setProgress(0);
    uploadStatus.textContent = error.message;
    logStep(`Error: ${error.message}`);
  }
});

refreshListButton.addEventListener('click', refreshLists);
refreshDeleteButton.addEventListener('click', refreshLists);

tabs.forEach((button) => {
  button.addEventListener('click', () => {
    setActiveTab(button.dataset.tab);
  });
});

void refreshLists();
