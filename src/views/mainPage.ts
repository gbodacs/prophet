export function renderMainPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prophet CSV Processor</title>
  <link rel="stylesheet" href="/public/ui/styles.css" />
</head>
<body>
  <header class="site-header">
    <div class="brand-wrap">
      <h1>Prophet CSV Processor</h1>
      <p>Upload, inspect and manage successful processing runs.</p>
    </div>
  </header>

  <main class="app-shell">
    <nav class="tabs" aria-label="Operations tabs">
      <button type="button" class="tab-button active" data-tab="upload-tab">Upload CSV File</button>
      <button type="button" class="tab-button" data-tab="list-tab">List Successful Runs</button>
      <button type="button" class="tab-button" data-tab="delete-tab">Delete Runs</button>
    </nav>

    <section id="upload-tab" class="tab-panel active" aria-labelledby="Upload CSV File">
      <h2>Upload CSV File</h2>
      <form id="upload-form" class="card">
        <label for="csv-file">CSV file</label>
        <input id="csv-file" name="file" type="file" accept=".csv,text/csv" required />
        <button type="submit">Upload and Process</button>
      </form>

      <div class="card">
        <h3>Progress</h3>
        <div class="progress-outer" aria-live="polite">
          <div id="progress-bar" class="progress-inner"></div>
        </div>
        <p id="upload-status" class="status-text">No upload started.</p>
        <ul id="upload-log" class="log-list"></ul>
      </div>
    </section>

    <section id="list-tab" class="tab-panel" aria-labelledby="List Successful Runs">
      <h2>List Successful Runs</h2>
      <div class="grid">
        <div class="card">
          <h3>Runs</h3>
          <button type="button" id="refresh-list">Refresh List</button>
          <ul id="runs-list" class="selectable-list"></ul>
        </div>

        <div class="card">
          <h3>Selected Run</h3>
          <p id="selected-run-meta" class="muted">Select a run to see its three generated images.</p>
          <div id="images-grid" class="images-grid"></div>
        </div>
      </div>
    </section>

    <section id="delete-tab" class="tab-panel" aria-labelledby="Delete Runs">
      <h2>Delete Runs</h2>
      <div class="card">
        <p class="muted">Select a run and delete it permanently. CSV and generated PNG files will be removed with best-effort cleanup.</p>
        <button type="button" id="refresh-delete-list">Refresh Delete List</button>
        <ul id="delete-runs-list" class="delete-list"></ul>
        <p id="delete-feedback" class="status-text"></p>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <p>Prophet CSV Processor backend-rendered interface</p>
  </footer>

  <script src="/public/ui/app.js" defer></script>
</body>
</html>`;
}
