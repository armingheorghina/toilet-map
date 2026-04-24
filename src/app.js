import { getToilets, CLUJ_CENTER } from "./data.js";
import { createMap, renderToilets } from "./map.js";

const map = createMap({
  containerId: "map",
  center: CLUJ_CENTER
});

const statusMessage = document.querySelector("#status-message");
const zoomInButton = document.querySelector("#zoom-in-button");
const zoomOutButton = document.querySelector("#zoom-out-button");
const selectionCoordinates = document.querySelector("#selection-coordinates");

let osmToilets = [];
let currentLayer = null;

function updateStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.dataset.state = isError ? "error" : "normal";
}

function refreshMarkers() {
  if (currentLayer) {
    currentLayer.remove();
  }

  currentLayer = renderToilets(map, osmToilets);
}

function formatLatLng(latlng) {
  return `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
}

function updateSelectionSummary() {
  selectionCoordinates.textContent = `Map center: ${formatLatLng(map.getCenter())}`;
}

async function initialize() {
  try {
    const result = await getToilets();
    osmToilets = result.toilets;
    refreshMarkers();
    updateStatus(result.message, result.usedFallback);
  } catch (error) {
    console.error(error);
    osmToilets = [];
    refreshMarkers();
    updateStatus("The map loaded, but toilet data could not be loaded right now.", true);
  }
}

map.on("moveend", () => {
  updateSelectionSummary();
});

zoomInButton.addEventListener("click", () => map.zoomIn());
zoomOutButton.addEventListener("click", () => map.zoomOut());

updateSelectionSummary();
initialize();
