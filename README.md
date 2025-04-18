# 🌍 TreatyGraph

**TreatyGraph** is an interactive, map-based data visualization tool that reveals international treaty participation and collaboration patterns. Using live data from Wikidata, the project enables data scientists, NGO analysts, and government researchers to explore geopolitical relationships through an engaging and customizable interface.

![TreatyGraph screenshot placeholder](https://via.placeholder.com/900x400?text=TreatyGraph+Visualization+Preview)

---

## 🔍 Features

- 🗺️ **Interactive Web Map** with Deck.gl and MapLibre
- 📊 **Dynamic Charts** showing population, GDP, and treaty category breakdowns
- 🔄 **Live Data** from Wikidata SPARQL queries (no backend required)
- 🎯 **Country Selection** to compare treaty participation patterns
- 🎛️ **Participant Slider** to filter treaties by size (number of members)
- 🧠 **Categorical Analysis** using a custom mapping of treaty types

---

## 📽️ Live Demo (coming soon)

A YouTube walkthrough of TreatyGraph will be available here soon.

---

## 🛠️ Technologies Used

- [Deck.gl](https://deck.gl) for high-performance WebGL visualizations  
- [MapLibre GL](https://maplibre.org) for open-source map rendering  
- [D3.js](https://d3js.org) for charts (donut and bar charts)  
- [Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page) as the live data source via SPARQL  
- Vanilla JavaScript + Vite for a fast frontend development experience  
- GeoJSON + custom data preprocessing for map layers  

---

## 🚀 Setup Instructions

Clone the repository and serve it locally using a dev server such as Vite:

```bash
git clone https://github.com/YOUR_USERNAME/TreatyGraph.git
cd TreatyGraph
npm install
npm run dev
