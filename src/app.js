import { getToilets, CLUJ_CENTER } from "./data.js";
import { createMap, renderToilets } from "./map.js";
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
const locateMeButton = document.querySelector("#locate-me-button");
const tiltToggleButton = document.querySelector("#tilt-toggle-button");
const cardOnlyButton = document.querySelector("#card-only-button");
const supportFooter = document.querySelector("#support-footer");
const supportLink = document.querySelector("#support-footer-link");

let osmToilets = [];
let markerLayer = null;
let userLocationMarker = null;
let cardOnlyActive = false;

function toiletsForMap() {
  if (cardOnlyActive) {
    return osmToilets.filter((toilet) => String(toilet.cardPayment ?? "").trim().toLowerCase() === "yes");
  }
  return [...osmToilets];
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

function initSupportFooter() {
  const kofiUrl = KOFI_URL?.trim();
  if (!supportFooter || !supportLink || !kofiUrl) {
    return;
  }
  supportLink.href = kofiUrl;
  supportFooter.hidden = false;
}

function setUserLocationMarker({ lat, lng }) {
  if (!map) {
    return;
  }
  if (!userLocationMarker) {
    const dot = document.createElement("span");
    dot.className = "user-location-dot";
    userLocationMarker = new maplibregl.Marker({ element: dot, anchor: "center" });
  }
  userLocationMarker.setLngLat([lng, lat]).addTo(map);
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

function updateTiltToggleLabel() {
  if (!map || !tiltToggleButton) {
    return;
  }
  tiltToggleButton.textContent = map.getPitch() > 0 ? "3D" : "2D";
}

function updateCardOnlyButtonState() {
  if (!cardOnlyButton) {
    return;
  }
  cardOnlyButton.dataset.active = String(cardOnlyActive);
  cardOnlyButton.setAttribute("aria-pressed", String(cardOnlyActive));
}

if (map) {
  map.on("pitchend", updateTiltToggleLabel);

  zoomInButton.addEventListener("click", () =>
    map.easeTo({ zoom: map.getZoom() + 1, duration: 240, easing: (t) => 1 - (1 - t) * (1 - t) })
  );
  zoomOutButton.addEventListener("click", () =>
    map.easeTo({ zoom: map.getZoom() - 1, duration: 240, easing: (t) => 1 - (1 - t) * (1 - t) })
  );
  locateMeButton?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocationMarker({ lat, lng });
        map.easeTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 16),
          duration: 500
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
  tiltToggleButton?.addEventListener("click", () => {
    const nextPitch = map.getPitch() > 0 ? 0 : 55;
    map.easeTo({ pitch: nextPitch, duration: 320 });
  });
  cardOnlyButton?.addEventListener("click", () => {
    cardOnlyActive = !cardOnlyActive;
    updateCardOnlyButtonState();
    refreshMarkers();
  });

  updateTiltToggleLabel();
  updateCardOnlyButtonState();
  loadOsmToilets();
}
