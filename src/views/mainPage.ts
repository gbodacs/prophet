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
      <h1 class="text-blue-600 dark:text-sky-400">Próféta</h1>
      <p>Adatok feltöltése, ellenőrzése és a sikeres feldolgozások kezelése.</p>
    </div>
  </header>

  <main class="app-shell">
    <nav class="tabs" aria-label="Operations tabs">
      <button type="button" class="tab-button active" data-tab="upload-tab">Adatok feltöltése</button>
      <button type="button" class="tab-button" data-tab="list-tab">Korábbi számítások</button>
      <button type="button" class="tab-button" data-tab="delete-tab">Törlés</button>
    </nav>

    <section id="upload-tab" class="tab-panel active" aria-labelledby="Upload CSV File">
      <h2>Adatok feltöltése</h2>
      <form id="upload-form" class="card">
        <label for="csv-file">CSV fájl</label>
        <input id="csv-file" name="file" type="file" accept=".csv,text/csv" required />
        <br/>
        <button type="submit">Feltöltés és feldolgozás</button>
      </form>

      <div class="card">
        <h3>Folyamat</h3>
        <div class="progress-outer" aria-live="polite">
          <div id="progress-bar" class="progress-inner"></div>
        </div>
        <p id="upload-status" class="status-text">A feltöltés még nem kezdődött el.</p>
        <ul id="upload-log" class="log-list"></ul>
      </div>
    </section>

    <section id="list-tab" class="tab-panel" aria-labelledby="List Successful Runs">
      <h2>Korábbi számítások</h2>
      <div class="grid">
        <div class="card">
          <h3>Korábbi számítások</h3>
          <button type="button" id="refresh-list">Lista frissítése</button>
          <br/>
          <br/>
          <ul id="runs-list" class="selectable-list"></ul>
        </div>

        <div class="card">
          <h3>Kiválasztott számítás</h3>
          <p id="selected-run-meta" class="muted">Válassz egy számítást, hogy lásd a három generált képet.</p>
          <div id="images-grid" class="images-grid"></div>
        </div>
      </div>
    </section>

    <section id="delete-tab" class="tab-panel" aria-labelledby="Delete Runs">
      <h2>Törlés</h2>
      <div class="card">
        <p class="muted">Válassz egy számítást, és töröld véglegesen. A CSV és a generált PNG fájlok a lehető legjobb erőfeszítéssel kerülnek eltávolításra.</p>
        <br/>
        <button type="button" id="refresh-delete-list">Lista frissítése</button>
        <br/>
        <br/>
        <ul id="delete-runs-list" class="delete-list"></ul>
        <p id="delete-feedback" class="status-text"></p>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <p>TudatAI - Próféta - (C) 2026</p>
  </footer>

  <script src="/public/ui/app.js" defer></script>
</body>
</html>`;
}
