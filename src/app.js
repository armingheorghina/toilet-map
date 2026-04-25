import { getToilets, CLUJ_CENTER } from "./data.js";
import { createMap, renderToilets } from "./map.js";
import { loadCustomToilets, saveCustomToilets, createCustomToilet } from "./storage.js";
import { KOFI_URL } from "./site-config.js";

let map;
try {
  map = createMap({
    containerId: "map",
    center: CLUJ_CENTER
  });
} catch (error) {
  console.error(error);
  map = undefined;
}
const zoomInButton = document.querySelector("#zoom-in-button");
const zoomOutButton = document.querySelector("#zoom-out-button");
const addToiletForm = document.querySelector("#add-toilet-form");
const pickLocationButton = document.querySelector("#pick-location-button");
const useMapCenterButton = document.querySelector("#use-map-center-button");
const supportFooter = document.querySelector("#support-footer");
const supportLink = document.querySelector("#support-footer-link");

let osmToilets = [];
let customToilets = loadCustomToilets();
let markerLayer = null;
let placementMode = false;

function toiletsForMap() {
  return [...osmToilets, ...customToilets];
}

function refreshMarkers() {
  if (!map) {
    return;
  }
  if (markerLayer) {
    markerLayer.remove();
  }
  markerLayer = renderToilets(map, toiletsForMap());
}

function setPlacementMode(active) {
  placementMode = active;
  pickLocationButton.dataset.active = active ? "true" : "false";
  pickLocationButton.textContent = active ? "Tap the map to set location…" : "Pick on map";
  map?.getCanvasContainer().classList.toggle("map--placing", active);
}

function initSupportFooter() {
  const kofiUrl = KOFI_URL?.trim();
  if (!supportFooter || !supportLink || !kofiUrl) {
    return;
  }
  supportLink.href = kofiUrl;
  supportFooter.hidden = false;
}

function readFormLatLng() {
  const lat = Number(addToiletForm.querySelector('[name="lat"]').value);
  const lng = Number(addToiletForm.querySelector('[name="lng"]').value);
  return { lat, lng };
}

function handleAddToiletSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.querySelector('[name="name"]').value;
  const notes = form.querySelector('[name="notes"]').value;
  const { lat, lng } = readFormLatLng();

  if (!name.trim()) {
    updateStatus("Please enter a name for the toilet.", true);
    return;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    updateStatus("Please set valid latitude and longitude.", true);
    return;
  }

  customToilets = [...customToilets, createCustomToilet({ name, notes, lat, lng })];
  saveCustomToilets(customToilets);
  refreshMarkers();
  form.reset();
  setPlacementMode(false);
}

function handleMapClickForPlacement(event) {
  if (!placementMode) {
    return;
  }
  const { lat, lng } = event.lngLat;
  addToiletForm.querySelector('[name="lat"]').value = lat.toFixed(6);
  addToiletForm.querySelector('[name="lng"]').value = lng.toFixed(6);
  setPlacementMode(false);
}

async function loadOsmToilets() {
  try {
    const result = await getToilets();
    osmToilets = result.toilets;
    refreshMarkers();
  } catch (error) {
    console.error(error);
    osmToilets = [];
    refreshMarkers();
  }
}

initSupportFooter();

if (map) {
  map.on("click", handleMapClickForPlacement);

  zoomInButton.addEventListener("click", () =>
    map.easeTo({ zoom: map.getZoom() + 1, duration: 240, easing: (t) => 1 - (1 - t) * (1 - t) })
  );
  zoomOutButton.addEventListener("click", () =>
    map.easeTo({ zoom: map.getZoom() - 1, duration: 240, easing: (t) => 1 - (1 - t) * (1 - t) })
  );

  pickLocationButton.addEventListener("click", () => {
    setPlacementMode(!placementMode);
  });

  useMapCenterButton.addEventListener("click", () => {
    const c = map.getCenter();
    addToiletForm.querySelector('[name="lat"]').value = c.lat.toFixed(6);
    addToiletForm.querySelector('[name="lng"]').value = c.lng.toFixed(6);
    setPlacementMode(false);
  });

  addToiletForm.addEventListener("submit", handleAddToiletSubmit);

  loadOsmToilets();
} else {
  addToiletForm.addEventListener("submit", handleAddToiletSubmit);
}
