const TOILET_ICON_URL = "./src/toilet-funny-dark.svg";

const TILE_LAYER_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createToiletIcon(kind) {
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <span class="toilet-marker toilet-marker-${kind}" aria-hidden="true">
        <img src="${TOILET_ICON_URL}" class="toilet-marker-image" alt="">
      </span>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -14]
  });
}

const osmIcon = createToiletIcon("osm");
const customIcon = createToiletIcon("custom");

function feeLabelAndClass(toilet) {
  const feeValue = toilet.fee ? String(toilet.fee).toLowerCase() : "no";
  const isPaid = feeValue === "yes";
  return {
    text: isPaid ? "Fee required" : "Free",
    className: isPaid ? "popup-fee-paid" : "popup-fee-free"
  };
}

function optionalRow(label, value) {
  if (value == null || String(value).trim() === "") {
    return "";
  }
  return `<p class="popup-meta"><span class="popup-meta-label">${escapeHtml(label)}</span> ${escapeHtml(String(value))}</p>`;
}

function createPopupContent(toilet) {
  const sourceLabel = toilet.source === "custom" ? "Your saved location" : "OpenStreetMap";
  const fee = feeLabelAndClass(toilet);

  return `
    <article class="popup-card">
      <p class="popup-source">${escapeHtml(sourceLabel)}</p>
      <h3>${escapeHtml(toilet.name)}</h3>
      <p class="popup-fee ${fee.className}">${fee.text}</p>
      ${optionalRow("Access", toilet.access)}
      ${optionalRow("Wheelchair", toilet.wheelchair)}
      ${optionalRow("Hours", toilet.openingHours)}
      ${optionalRow("Notes", toilet.notes)}
    </article>
  `;
}

function buildMarker(toilet) {
  const icon = toilet.source === "custom" ? customIcon : osmIcon;
  return L.marker([toilet.lat, toilet.lng], {
    icon,
    title: toilet.name
  }).bindPopup(createPopupContent(toilet));
}

export function createMap({ containerId, center }) {
  const map = L.map(containerId, {
    center: [center.lat, center.lng],
    zoom: center.zoom,
    zoomControl: false,
    preferCanvas: true
  });

  L.tileLayer(TILE_LAYER_URL, {
    maxZoom: 20,
    subdomains: "abcd",
    attribution: TILE_ATTRIBUTION
  }).addTo(map);

  return map;
}

export function renderToilets(map, toilets) {
  const markers = toilets.map(buildMarker);
  return L.layerGroup(markers).addTo(map);
}
