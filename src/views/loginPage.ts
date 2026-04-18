type LoginPageOptions = {
  errorMessage?: string;
};

export function renderLoginPage(options: LoginPageOptions = {}): string {
  const { errorMessage } = options;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bejelentkezés | Próféta</title>
  <link rel="stylesheet" href="/public/ui/styles.css" />
</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <div class="brand-wrap">
        <h1 class="text-blue-600 dark:text-sky-400">Próféta</h1>
        <p>Az univerzális előrejelző rendszer.</p>
      </div>
      <form method="post" action="/logout" class="logout-form">
        <button type="submit" class="logout-button">Kilépés</button>
      </form>
    </div>
  </header>

  <main class="app-shell">
    <section class="card" aria-labelledby="login-title">
      <h2 id="login-title">Biztonságos bejelentkezés</h2>
      <p class="muted">A rendszer használatához jelentkezz be.</p>
      <br/>
      ${errorMessage ? `<p class="alert danger" role="alert">${errorMessage}</p>` : ""}

      <form method="post" action="/login" class="form-group">
        <label for="username">Felhasználónév</label>
        <input id="username" name="username" type="text" autocomplete="username" required />

        <label for="password">Jelszó</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />

        <br/>
        <button type="submit">Belépés</button>
      </form>
    </section>
  </main>

  <footer class="site-footer">
    <p>TudatAI - Próféta - Copyright 2026</p>
  </footer>
</body>
</html>`;
}
