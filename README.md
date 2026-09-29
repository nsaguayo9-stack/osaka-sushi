# Osaka Sushi & Wok Calama

Catálogo con carrito y pedido por WhatsApp. La carta se carga desde el CSV publicado de Google Sheets en cada visita mediante `api/catalog.js` en Vercel (caché de hasta un minuto). Los precios y el stock se vuelven a comprobar al cargar el carrito.

## Ejecutar

```bash
npm install
npm run dev
```

## Publicar

Subir este directorio a un repositorio de GitHub y conectarlo a Vercel. Framework: Vite. Comando de compilación: `npm run build`. Directorio de salida: `dist`. La función `api/catalog.js` debe estar en la raíz del proyecto.

El enlace CSV y WhatsApp están definidos en `src/main.js`; el enlace CSV también está en `api/catalog.js`. Si la URL del Sheet cambia, editar ambos lugares. Los datos dentro de la misma URL se actualizan sin publicar de nuevo.

`public/catalogo-inicial.csv` es una copia para revisión cuando el Sheet no está disponible; en ese caso se deshabilita el pedido para evitar precios antiguos. Las fotos individuales provienen solo de la columna `foto`. Una URL rota se oculta sin dejar marco vacío.

El logo original está en `public/assets/logo.png`. La imagen de portada es una ambientación generada y no corresponde a un producto individual.
