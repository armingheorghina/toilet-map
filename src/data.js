const CLUJ_CENTER = {
  lat: 46.7712,
  lng: 23.6236,
  zoom: 13
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const FALLBACK_DATA_URL = "./src/fallback-toilets.json";
const CACHE_KEY = "cluj-public-toilets-cache-v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

async function fetchFallbackToilets() {
  const response = await fetch(FALLBACK_DATA_URL);
  if (!response.ok) {
    throw new Error("Fallback toilet dataset could not be loaded.");
  }

  const items = await response.json();
  return items.map(normalizeToilet);
}

function readCachedToilets() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.toilets) || typeof parsed.savedAt !== "number") {
      return null;
    }

    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) {
      return null;
    }

    return parsed.toilets.map(normalizeToilet);
  } catch (error) {
    console.warn("Cached toilet data could not be read.", error);
    return null;
  }
}

function writeCachedToilets(toilets) {
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        toilets
      })
    );
  } catch (error) {
    console.warn("Toilet data could not be cached.", error);
  }
}

function buildOverpassQuery() {
  return `
[out:json][timeout:25];
area["name"="Cluj-Napoca"]["boundary"="administrative"]->.searchArea;
(
  node["amenity"="toilets"](area.searchArea);
  way["amenity"="toilets"](area.searchArea);
  relation["amenity"="toilets"](area.searchArea);
);
out center tags;
`.trim();
}

function normalizeToilet(item) {
  return {
    id: item.id,
    source: item.source ?? "osm",
    name: item.name || "Public toilet",
    lat: Number(item.lat),
    lng: Number(item.lng),
    access: item.access ?? null,
    fee: item.fee ?? null,
    wheelchair: item.wheelchair ?? null,
    openingHours: item.openingHours ?? item.opening_hours ?? null,
    notes: item.notes ?? null
  };
}

function normalizeOverpassElement(element) {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return normalizeToilet({
    id: `osm-${element.type}-${element.id}`,
    source: "osm",
    name: element.tags?.name || "Public toilet",
    lat,
    lng,
    access: element.tags?.access ?? null,
    fee: element.tags?.fee ?? null,
    wheelchair: element.tags?.wheelchair ?? null,
    opening_hours: element.tags?.opening_hours ?? null,
    notes: element.tags?.description ?? null
  });
}

async function fetchOsmToilets() {
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8"
    },
    body: buildOverpassQuery()
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return (payload.elements || [])
    .map(normalizeOverpassElement)
    .filter(Boolean);
}

export async function getToilets() {
  const cachedToilets = readCachedToilets();
  if (cachedToilets) {
    return {
      toilets: cachedToilets,
      message: `Loaded ${cachedToilets.length} public toilets from cached map data.`,
      usedFallback: false,
      usedCache: true
    };
  }

  try {
    const toilets = await fetchOsmToilets();
    writeCachedToilets(toilets);
    return {
      toilets,
      message: `Loaded ${toilets.length} public toilets from OpenStreetMap.`,
      usedFallback: false,
      usedCache: false
    };
  } catch (error) {
    const toilets = await fetchFallbackToilets();
    return {
      toilets,
      message: "Live OpenStreetMap data is unavailable, so a local fallback dataset is being shown.",
      usedFallback: true,
      usedCache: false,
      error
    };
  }
}

export { CLUJ_CENTER };
