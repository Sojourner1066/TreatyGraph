const { DeckGL, GeoJsonLayer, ArcLayer } = deck;

// Import external modules for charting and data handling
import { wdCategoryCounts } from './js/wdCategoryCount.js';
import { createSpectralDonutChart } from './js/d3_drawCharts.js';
import { drawMiniHorizontalBarChart } from './js/d3_drawCharts.js';
import { wdGetAllStatsByISO } from './js/wdGetAllStatsByISO.js';
import { getSmallTreatyMembersGrouped, getUniqueMemberCountries } from './js/wdTreatyMembership.js';

// Initial default selections and global state
let selectedCountryISO = "NGA";
let currentGeoData;
const presets = [5, 10, 30, 50, 70, 100, 150, Infinity];
let maxParticipants = presets[2];

// Load all country stats from Wikidata
let CountryStats = await wdGetAllStatsByISO();

// Filter utility to match only desired ISO codes
function filterByIsoCodes(data, isoCodes) {
  const isoSet = new Set(isoCodes);
  return data.results.bindings.filter(entry => isoSet.has(entry.isoCode.value));
}

// Initialize DeckGL map visualization
const deckgl = new DeckGL({
  mapStyle: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  initialViewState: {
    longitude: -2.6753,
    latitude: 18.0820,
    zoom: 3,
    maxZoom: 6,
    pitch: 30,
    bearing: 30
  },
  controller: true,
  layers: [],
  getTooltip: ({ object }) => object?.properties?.name
});

const uiWrapper = document.getElementById('ui-wrapper');
const toggleBtn = document.getElementById('ui-toggle-btn');
const arrowIcon = document.getElementById('arrow-icon');

toggleBtn.addEventListener('click', () => {
  const isVisible = uiWrapper.classList.toggle('slide-in');
  arrowIcon.src = isVisible ? "public/chevron-left.svg" : "public/chevron-right.svg";
});

// Setup the slider and label for controlling treaty participant filter
const slider = document.getElementById("participant-slider");
slider.value = "2";
const valueLabel = document.getElementById("participant-value");

// Function to visually update the slider’s gradient background
function updateSliderBackground() {
  const val = +slider.value;
  const max = +slider.max;
  const percent = (val / max) * 100;

  slider.style.background = `linear-gradient(to right, #B0ADCA 0%, #B0ADCA ${percent}%, #e0e0e0 ${percent}%, #e0e0e0 100%)`;
}

// Initialize the slider’s background on load
updateSliderBackground();

// Respond to slider input: update filter, chart label, and re-render map
slider.addEventListener("input", () => {
  const selected = presets[parseInt(slider.value)];
  maxParticipants = selected;
  valueLabel.textContent = selected === Infinity ? "All" : selected;

  if (currentGeoData) {
    renderLayers(currentGeoData, null);
  }

  updateSliderBackground();
});

// gets the statues of the recenter toggle
let recenterOnClick = false;

document.getElementById('recenter-checkbox').addEventListener('change', (e) => {
  recenterOnClick = e.target.checked;
});

// Generate ArcLayer showing connections from selected country to treaty members
function getArcLayer(data, selectedFeature, targetIsoCodes) {
  const { centroid } = selectedFeature.properties;

  const featureByIso = Object.fromEntries(
    data.features.map(f => [f.properties.iso_a3, f])
  );

  const arcs = targetIsoCodes
    .map(iso => {
      const targetFeature = featureByIso[iso];
      if (!targetFeature || !targetFeature.properties.centroid) return null;

      return {
        source: centroid,
        target: targetFeature.properties.centroid
      };
    })
    .filter(d => d);

  return new ArcLayer({
    id: 'arc',
    data: arcs,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: [0, 128, 200],
    getTargetColor: [200, 0, 80],
    strokeWidth: 4,
    pickable: true
  });
}

// Main render function: updates map and charts based on selection and filters
async function renderLayers(data, selectedFeature) {
  if (selectedFeature) {
    selectedCountryISO = selectedFeature.properties.iso_a3;
  } else {
    selectedFeature = data.features.find(f => f.properties.iso_a3 === selectedCountryISO);
  }

  if (recenterOnClick && selectedFeature?.properties?.centroid) {
    const [lon, lat] = selectedFeature.properties.centroid;
  
    deckgl.setProps({
      initialViewState: {
        longitude: lon,
        latitude: lat,
        zoom: 3,
        pitch: 30,
        bearing: 30,
        transitionDuration: 1000,
        transitionInterpolator: new deck.LinearInterpolator(['longitude', 'latitude', 'zoom'])
      }
    });
  }

  const treatyCountryGroups = await getSmallTreatyMembersGrouped(selectedCountryISO, maxParticipants);

  const sortedTreaties = Object.entries(treatyCountryGroups)
    .map(([treaty, countries]) => ({ treaty, count: countries.length }))
    .sort((a, b) => b.count - a.count);

  const container = document.getElementById("treaty-list");
  container.innerHTML = `
    <h4 class="treaty-title">Treaties and Number of Members</h4>
    ${sortedTreaties.map(t => `<div><strong>${t.treaty}</strong>: ${t.count}</div>`).join('')}
  `;

  const targetIsoCodes = getUniqueMemberCountries(treatyCountryGroups, selectedCountryISO);

  const CategoryCounts = await wdCategoryCounts(selectedCountryISO, treatyCountryGroups);
  const donutData = Object.entries(CategoryCounts).map(([name, value]) => ({ name, value }));

  const donutContainer = document.querySelector("#chart-container");
  donutContainer.innerHTML = "";
  const chart = createSpectralDonutChart(donutData, 420);
  donutContainer.appendChild(chart);

  const chartDataIsoCodes = [...targetIsoCodes, selectedCountryISO];
  const selectedData = filterByIsoCodes(CountryStats, chartDataIsoCodes);

  const MAX_LABEL_LENGTH = 15;

  const populationData = selectedData
    .map(d => ({
      fullName: d.countryLabel.value,
      category: d.countryLabel.value.length > MAX_LABEL_LENGTH
        ? d.countryLabel.value.slice(0, MAX_LABEL_LENGTH) + "…"
        : d.countryLabel.value,
      value: d.population?.value ? +d.population.value : 0,
      highlight: d.isoCode?.value === selectedCountryISO
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  drawMiniHorizontalBarChart(populationData, "#pop-chart-container", "Population by Country (Top 10)");

  const gdpData = selectedData
    .filter(d => d.gdp && !isNaN(+d.gdp.value))
    .map(d => ({
      fullName: d.countryLabel.value,
      category: d.countryLabel.value.length > MAX_LABEL_LENGTH
        ? d.countryLabel.value.slice(0, MAX_LABEL_LENGTH) + "…"
        : d.countryLabel.value,
      value: +d.gdp.value,
      highlight: d.isoCode?.value === selectedCountryISO
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  drawMiniHorizontalBarChart(gdpData, "#gdp-chart-container", "GDP by Country (USD) (Top 10)");

  const arcLayer = getArcLayer(data, selectedFeature, targetIsoCodes);

  const countyLayer = new GeoJsonLayer({
    id: 'geojson',
    data,
    stroked: true,
    filled: true,
    autoHighlight: true,
    pickable: true,
    highlightColor: [158, 154, 200, 120],
    getFillColor: f => {
      return f.properties.iso_a3 === selectedCountryISO
        ? [158, 154, 200, 160]
        : [203, 201, 226, 120];
    },
    updateTriggers: {
      getFillColor: [selectedCountryISO]
    },
    getLineColor: () => [158, 154, 200, 255],
    lineWidthMinPixels: 1,
    onClick: info => renderLayers(data, info.object)
  });

  deckgl.setProps({ layers: [countyLayer, arcLayer] });
}

// Load GeoJSON data and initialize the app
fetch('data/WorldPoly_with_centroids.geojson')
  .then(res => res.json())
  .then(data => {
    currentGeoData = data;
    renderLayers(data);

    // Initialize modal dismiss logic
    const dismissBtn = document.getElementById('dismiss-btn');
    const modal = document.getElementById('info-modal');

    if (dismissBtn && modal) {
      dismissBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    } else {
      console.warn("Modal or dismiss button not found.");
    }
  });