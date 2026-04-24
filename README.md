# Cluj public toilets map

Mobile-first static site: a Leaflet map centered on **Cluj-Napoca, Romania**, public toilets from **OpenStreetMap** (Overpass API) with a **local fallback** if the network fails, plus **your own markers** stored in the browser.

**Live site (GitHub Pages):** after you enable Pages for this repository, the app is usually available at:

`https://<your-username>.github.io/<repository-name>/`

Use the same URL in your browser as the “homepage” for the deployed project. Paths like `./src/...` are relative to that root.

## What you get

- Map with OSM-compatible CARTO Voyager tiles and touch-friendly zoom buttons  
- Toilet markers from Overpass (`amenity=toilets` in the Cluj-Napoca admin area), with optional **12-hour local cache** of that response  
- **Fallback JSON** in `src/fallback-toilets.json` when Overpass is down or blocked  
- **Add your own toilets** (name, notes, coordinates) with **localStorage** persistence  
- Popups with source (OSM vs your data), fee hint, and other tags when present  

## Run locally

This project uses **ES modules**. Serve the repo root with any static server (do not open `index.html` as a `file://` URL).

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` publishes the **repository root** as a Pages artifact. In the repository **Settings → Pages**, set the source to **GitHub Actions** if prompted. Pushes to the configured branches trigger a deploy.

After deploy, verify that `index.html` loads and that requests to `./src/...` return 200 (same layout as local).

## Configuration

| Item | Where |
|------|--------|
| Buy Me a Coffee button | Set `BUY_ME_A_COFFEE_USERNAME` in `src/site-config.js` to your profile slug (empty = button hidden). |
| Map center / zoom | `CLUJ_CENTER` in `src/data.js` |
| Overpass query / cache TTL | `src/data.js` |
| Custom toilets storage key | `src/storage.js` |

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
    ├── site-config.js
    ├── storage.js
    ├── styles.css
    └── toilet-funny-dark.svg   # marker image
```

## Data sources

- **Live:** [Overpass API](https://overpass-api.de/) interpreting OSM data for Cluj-Napoca.  
- **Fallback:** bundled sample points in `src/fallback-toilets.json`.  
- **Custom:** only in the visitor’s browser (`localStorage`).

## Limitations

- No accounts or server-side database; custom data does not sync across devices.  
- Overpass rate limits, timeouts, and CORS policies depend on where the site is opened from.  
- The fallback file is a small sample, not a full city extract.

## License

Add a `LICENSE` file if you want explicit terms; map data remains subject to [OpenStreetMap](https://www.openstreetmap.org/copyright) and [CARTO](https://carto.com/attributions) attribution as shown on the map.
