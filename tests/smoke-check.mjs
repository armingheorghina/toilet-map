import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function run() {
  const html = read("index.html");
  const app = read("src/app.js");
  const map = read("src/map.js");
  const styles = read("src/styles.css");
  const siteConfig = read("src/site-config.js");

  assert.match(html, /Când te scapă, te scapă!/);
  assert.doesNotMatch(html, /Your saved toilets/i);
  assert.doesNotMatch(html, /Browse public toilets from OpenStreetMap/i);
  assert.doesNotMatch(html, /Loading map data/i);
  assert.doesNotMatch(html, /Map guide/i);
  
  
  
  assert.match(html, /id="locate-me-button"/);
  assert.match(html, /id="tilt-toggle-button"/);
  assert.match(html, /toilet roll 🧻/);
  assert.doesNotMatch(html, /add-toilet-summary/);
  assert.doesNotMatch(html, /hero-card/);

  assert.match(siteConfig, /KOFI_URL/);
  assert.match(siteConfig, /https:\/\/ko-fi\.com\/arming/);

  assert.match(app, /map\.easeTo\(/);
  assert.match(app, /navigator\.geolocation/);
  assert.match(app, /map\.getPitch\(\)/);
  assert.match(app, /setUserLocationMarker/);
  assert.doesNotMatch(app, /status-message/);
  assert.doesNotMatch(app, /selection-coordinates/);
  assert.doesNotMatch(app, /updateStatus\(/);

  assert.match(map, /maxBounds:\s*CLUJ_COUNTY_BOUNDS/);
  assert.match(map, /minZoom:\s*MIN_ZOOM/);
  assert.match(map, /maxZoom:\s*MAX_ZOOM/);
  assert.match(map, /maxPitch:\s*MAX_PITCH/);

  assert.match(styles, /maplibregl-ctrl-attrib-inner/);
  assert.match(styles, /white-space:\s*nowrap/i);
  assert.match(styles, /maplibregl-ctrl-attrib-button::before/);
  assert.match(styles, /user-location-dot/);

  console.log("Smoke checks passed.");
}

run();
