# Cluj public toilets map

Mobile-first static site: a **MapLibre GL** map centered on **Cluj-Napoca, Romania**, public toilets from **OpenStreetMap** (Overpass API) with a **local fallback** if the network fails, plus **your own markers** stored in the browser.

**Live site (GitHub Pages):** after you enable Pages for this repository, the app is usually available at:

`https://<your-username>.github.io/<repository-name>/`

Use the same URL in your browser as the “homepage” for the deployed project. Paths like `./src/...` are relative to that root.

## What you get

- **Mapbox Outdoors** vector style via **[MapLibre GL JS](https://maplibre.org/)** (MapLibre-compatible Mapbox style URL + token), with custom touch-friendly zoom buttons  
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

### Mapbox token (local)

`src/mapbox-config.js` is **gitignored** so your public access token is not committed. One-time setup:

```text
copy src\mapbox-config.example.js src\mapbox-config.js
```

Edit `src/mapbox-config.js` and set `MAPBOX_ACCESS_TOKEN` to your [Mapbox public token](https://account.mapbox.com/access-tokens/). Vector styles require a token with **styles:read** (default public tokens include this). In the Mapbox dashboard, **restrict the token by URL** (e.g. `http://localhost:8000/*`, `https://<you>.github.io/*`).

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` publishes the **repository root** as a Pages artifact. In the repository **Settings → Pages**, set the source to **GitHub Actions** if prompted. Pushes to the configured branches trigger a deploy.

Add repository secret **`MAPBOX_ACCESS_TOKEN`** (same value as in your local `mapbox-config.js`). The workflow writes `src/mapbox-config.js` into the deploy artifact only; the token is not stored in git history.

After deploy, verify that `index.html` loads and that requests to `./src/...` return 200 (same layout as local).

## Configuration

| Item | Where |
|------|--------|
| **Mapbox token** | Local: `src/mapbox-config.js` (copy from `mapbox-config.example.js`, gitignored). Pages: secret `MAPBOX_ACCESS_TOKEN`. |
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
    ├── mapbox-config.example.js   # copy → mapbox-config.js (gitignored)
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

- **Mapbox tokens in the browser are always visible** in DevTools; use URL restrictions and separate tokens for dev vs production. Anyone can copy a token from a deployed site, so treat it as public and scope it tightly.  
- No accounts or server-side database; custom toilets and **ratings** do not sync across devices or users (averages are only from votes in the same browser).  
- Overpass rate limits, timeouts, and CORS policies depend on where the site is opened from.  
- The fallback file is a small sample, not a full city extract.

## License

Add a `LICENSE` file if you want explicit terms; map data remains subject to [OpenStreetMap](https://www.openstreetmap.org/copyright) and [Mapbox](https://www.mapbox.com/about/maps/) attribution as shown on the map.
