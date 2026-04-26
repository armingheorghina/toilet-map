# Cluj public toilets map

Mobile-first static site: a **MapLibre GL JS** map centered on **Cluj-Napoca, Romania**, using **MapTiler Streets** as the basemap, plus public toilets from **OpenStreetMap** (Overpass API) with a **local fallback** if the network fails and **your own markers** stored in the browser.

**Live site (GitHub Pages):** after you enable Pages for this repository, the app is usually available at:

`https://<your-username>.github.io/<repository-name>/`

Use the same URL in your browser as the “homepage” for the deployed project. Paths like `./src/...` are relative to that root.

## What you get

- **MapTiler Streets** vector style via **[MapLibre GL JS](https://maplibre.org/)**, with custom touch-friendly zoom buttons  
- Toilet markers from Overpass (`amenity=toilets` in the Cluj-Napoca admin area), with optional **12-hour local cache** of that response  
- **Fallback JSON** in `src/fallback-toilets.json` when Overpass is down or blocked  
- **Add your own toilets** (name, notes, coordinates) with **localStorage** persistence  
- Popups: fee, **star rating** (stored per toilet id in `localStorage`; tap stars to vote — display reflects average, or all five when there are no votes), and **Open in maps**  

## Run locally

This project uses **ES modules**. Serve the repo root with any static server (do not open `index.html` as a `file://` URL).

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

### Quick checks

Run the project smoke checks:

```bash
node tests/smoke-check.mjs
```

### MapTiler key (local)

`src/maptiler-config.js` is **gitignored** so your public API key is not committed. One-time setup:

```text
copy src\maptiler-config.example.js src\maptiler-config.js
```

Edit `src/maptiler-config.js` and set `MAPTILER_API_KEY` to your [MapTiler Cloud key](https://cloud.maptiler.com/account/keys/). In MapTiler Cloud, restrict the key by URL (e.g. `http://localhost:8000/*`, `https://<you>.github.io/*`).

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` publishes the **repository root** as a Pages artifact. In the repository **Settings → Pages**, set the source to **GitHub Actions** if prompted. Pushes to the configured branches trigger a deploy.

Add repository secret **`MAPTILER_API_KEY`** (same value as in your local `maptiler-config.js`). The workflow writes `src/maptiler-config.js` into the deploy artifact only; the key is not stored in git history.

Use a **public browser key** in the secret and locally (never a private server-side key).

After deploy, verify that `index.html` loads and that requests to `./src/...` return 200 (same layout as local).

### Basemap: 401, “Failed to fetch”, or CORS on MapTiler APIs

Browsers often show **CORS blocked** when MapTiler returns **401/403** (API responses can omit permissive CORS headers, so the console may blame CORS instead of auth).

1. **URL restrictions** — In [MapTiler keys](https://cloud.maptiler.com/account/keys/), edit the key and allow every site origin you use, for example:
   - `http://localhost:8000/*`
   - `https://armingheorghina.github.io/*` (covers `https://armingheorghina.github.io/toilet-map/` as well)
2. **Secret** — In GitHub **Settings → Secrets and variables → Actions**, the value must be the raw key only (no spaces or wrapping quotes). Re-save `MAPTILER_API_KEY` after fixing; the deploy workflow trims whitespace and strips one pair of surrounding quotes.
3. **Key restrictions** — Ensure your key allows browser usage for styles/tiles/fonts from your deploy domain.

## Configuration

| Item | Where |
|------|--------|
| **MapTiler API key** | Local: `src/maptiler-config.js` (copy from `maptiler-config.example.js`, gitignored). Pages: secret `MAPTILER_API_KEY`. |
| Buy Me a Coffee button | Set `BUY_ME_A_COFFEE_USERNAME` in `src/site-config.js` to your profile slug (empty = button hidden). |
| Map center / zoom | `CLUJ_CENTER` in `src/data.js` |
| Overpass query / cache TTL | `src/data.js` |
| Custom toilets storage key | `src/storage.js` |
| Toilet ratings (average votes) | `src/reviews.js` (`localStorage`, this browser only) |

## Project layout

```text
.
├── .github/workflows/deploy-pages.yml
├── docs/
│   ├── implementation-brief.md
│   └── requirements.md
├── index.html
├── README.md
└── src/
    ├── app.js
    ├── data.js
    ├── fallback-toilets.json
    ├── map.js
    ├── maptiler-config.example.js # copy → maptiler-config.js (gitignored)
    ├── reviews.js
    ├── site-config.js
    ├── storage.js
    ├── styles.css
    └── toilet.png              # map marker icon
```

## Data sources

- **Live:** [Overpass API](https://overpass-api.de/) interpreting OSM data for Cluj-Napoca.  
- **Fallback:** bundled sample points in `src/fallback-toilets.json`.  
- **Custom:** only in the visitor’s browser (`localStorage`).

## Limitations

- **MapTiler browser keys are always visible** in DevTools; use URL restrictions and separate keys for dev vs production. Anyone can copy a deployed key, so treat it as public and scope it tightly.  
- No accounts or server-side database; custom toilets and **ratings** do not sync across devices or users (averages are only from votes in the same browser).  
- Overpass rate limits, timeouts, and CORS policies depend on where the site is opened from.  
- The fallback file is a small sample, not a full city extract.

## License

Add a `LICENSE` file if you want explicit terms; map data remains subject to [OpenStreetMap](https://www.openstreetmap.org/copyright) and [MapTiler](https://www.maptiler.com/copyright/) attribution as shown on the map.
