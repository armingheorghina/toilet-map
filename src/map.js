function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const TOILET_ICON_URL = "./src/toilet-marker.png";

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

function createPopupContent(toilet) {
  const feeValue = toilet.fee ? toilet.fee.toLowerCase() : "no";
  const isPaid = feeValue === "yes";
  const feeLabel = isPaid ? "Fee required" : "Free";

  return `
    <article class="popup-card">
      <h3>${escapeHtml(toilet.name)}</h3>
      <p class="popup-fee ${isPaid ? "popup-fee-paid" : "popup-fee-free"}">${feeLabel}</p>
    </article>
  `;
}

function buildMarker(toilet) {
  return L.marker([toilet.lat, toilet.lng], {
    icon: toilet.source === "custom" ? customIcon : osmIcon,
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

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    subdomains: "abcd",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(map);

  return map;
}

export function renderToilets(map, toilets) {
  const markers = toilets.map(buildMarker);
  const layerGroup = L.layerGroup(markers).addTo(map);
  return layerGroup;
}
