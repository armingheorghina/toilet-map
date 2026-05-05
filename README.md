# Cluj Public Toilets Map

Live site:  
https://armingheorghina.github.io/toilet-map/

---

## Overview

Mobile-first interactive map of public toilets in Cluj-Napoca.

- Basemap powered by **MapTiler**
- Built with MapLibre GL JS  
- Toilet data currently sourced from **OSM (Overpass API)**  
- Project is **actively developed** — data will be improved over time  
- Planned migration to a **custom on-prem geospatial dataset**

---

## Features

- Interactive, mobile-friendly map  
- Public toilets from OSM (with local fallback)  
- Optional local caching for faster reloads  
- Add your own toilets (stored in browser)  
- Popups with info, ratings, and navigation link  

---

## Run Locally

```bash
python -m http.server 8000