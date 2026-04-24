const STORAGE_KEY = "cluj-public-toilets-custom";

export function loadCustomToilets() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidCustomToilet);
  } catch (error) {
    console.warn("Custom toilets could not be read from local storage.", error);
    return [];
  }
}

export function saveCustomToilets(toilets) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toilets));
}

export function createCustomToilet({ name, notes, lat, lng }) {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    source: "custom",
    name: name.trim(),
    notes: notes.trim() || null,
    lat: Number(lat),
    lng: Number(lng),
    access: null,
    fee: null,
    wheelchair: null,
    openingHours: null
  };
}

function isValidCustomToilet(item) {
  return (
    item &&
    item.source === "custom" &&
    typeof item.name === "string" &&
    Number.isFinite(Number(item.lat)) &&
    Number.isFinite(Number(item.lng))
  );
}
