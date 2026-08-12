/**
 * Modo mantenimiento (zero-cost, sin servicio externo). Activado por
 * `MAINTENANCE_MODE=true` — cuando está activo, `src/proxy.ts` devuelve
 * esta página para toda la app (excepto quien tenga el bypass) con status
 * 503 + Retry-After, correcto para SEO ("no me desindexes, vuelvo pronto").
 *
 * HTML autocontenido (sin depender de Tailwind/globals.css ni del
 * renderizado normal de Next) a propósito: si algo en el pipeline de
 * build/render está roto, esta página debe seguir funcionando igual — es
 * el mecanismo que se usa precisamente cuando algo más falló.
 */
export function isMaintenanceModeEnabled(): boolean {
  return process.env.MAINTENANCE_MODE?.trim().toLowerCase() === "true";
}

export function renderMaintenanceHtml(): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>STOKA Finance — En mantenimiento</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0a0d14;
    color: #e7e9ee;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 24px;
    text-align: center;
  }
  .card { max-width: 420px; }
  .mark {
    width: 56px;
    height: 56px;
    margin: 0 auto 20px;
    border-radius: 14px;
    background: linear-gradient(135deg, #00C8A3 0%, #008F75 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 700;
    font-size: 28px;
  }
  h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 8px; }
  .brand { font-weight: 700; }
  .brand-finance { color: #00C8A3; }
  p { color: #8b93a7; font-size: 0.9rem; line-height: 1.5; margin: 0; }
</style>
</head>
<body>
  <div class="card">
    <div class="mark">S</div>
    <h1><span class="brand">STOKA</span> <span class="brand brand-finance">FINANCE</span></h1>
    <p>Estamos haciendo mejoras en la plataforma. Volvemos en breve — tus datos están seguros, no se pierde nada.</p>
  </div>
</body>
</html>`;
}
