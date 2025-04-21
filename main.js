// Updated main.js to support recenter checkbox, UI toggle, and charts
const { DeckGL, GeoJsonLayer, ArcLayer } = deck;

import { getAllCountryMemberships } from './js/wdTreatyDataRetreival.js';
import { wdGetAllStatsByISO } from './js/wdGetAllStatsByISO.js';
import { drawMiniHorizontalBarChart } from './js/d3_drawCharts.js';
import { createSpectralDonutChart } from './js/d3_drawCharts.js';
import { wdCategoryCounts } from './js/wdCategoryCount.js';

let treatyData = [];
let selectedCountryISO = "NGA";
let currentGeoData;
let countryStatistics = [];
let recenterOnClick = false;

const presets = [5, 10, 30, 50, 70, 100, 150, Infinity];
let maxParticipants = presets[2];

const deckgl = new DeckGL({
    mapStyle: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    initialViewState: { longitude: 0, latitude: 20, zoom: 2.5, pitch: 30, bearing: 30 },
    controller: true,
    layers: [],
    getTooltip: ({ object }) => object?.properties?.name
});

// UI toggle button
const toggleBtn = document.getElementById("ui-toggle-btn");
const uiWrapper = document.getElementById("ui-wrapper");
const arrowIcon = document.getElementById("arrow-icon");

toggleBtn.addEventListener("click", () => {
    const isOpen = uiWrapper.classList.toggle("slide-in");
    arrowIcon.src = isOpen ? "public/chevron-left.svg" : "public/chevron-right.svg";
});

const slider = document.getElementById("participant-slider");
const valueLabel = document.getElementById("participant-value");
slider.value = "2";
updateSlider();
slider.addEventListener("input", () => {
    maxParticipants = presets[parseInt(slider.value)];
    valueLabel.textContent = maxParticipants === Infinity ? "All" : maxParticipants;
    if (currentGeoData) renderMap(selectedCountryISO);
    updateSlider();
});

document.getElementById("recenter-checkbox").addEventListener("change", (e) => {
    recenterOnClick = e.target.checked;
});

function updateSlider() {
    const val = +slider.value, max = +slider.max;
    const percent = (val / max) * 100;
    slider.style.background = `linear-gradient(to right, #B0ADCA 0%, #B0ADCA ${percent}%, #e0e0e0 ${percent}%, #e0e0e0 100%)`;
}

function getFeatureMap(geoData) {
    return Object.fromEntries(geoData.features.map(f => [f.properties.iso_a3, f]));
}

function makeArcLayer(centroid, members, featureByIso, treatyId) {
    const arcs = members.filter(iso => iso !== selectedCountryISO && featureByIso[iso]?.properties?.centroid)
        .map(iso => ({ source: centroid, target: featureByIso[iso].properties.centroid }));
    return new ArcLayer({
        id: `arc-${treatyId}`,
        data: arcs,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getSourceColor: [0, 128, 200],
        getTargetColor: [200, 0, 80],
        strokeWidth: 3,
        pickable: true
    });
}

function makeBaseLayer(data, selectedISO) {
    return new GeoJsonLayer({
        id: `geojson-${selectedISO}`,
        data,
        stroked: true,
        filled: true,
        autoHighlight: true,
        pickable: true,
        highlightColor: [158, 154, 200, 120],
        getFillColor: f =>
            f.properties.iso_a3 === selectedISO
                ? [176, 173, 202, 255]  // #B0ADCA
                : [203, 201, 226, 120],
        getLineColor: () => [158, 154, 200, 255],
        lineWidthMinPixels: 1,
        onClick: info => renderMap(info.object.properties.iso_a3)
    });
}

function getTreatiesForCountry(isoCode) {
    return treatyData
        .filter(org => org.memberCountries.includes(isoCode))
        .filter(org => org.memberCount <= maxParticipants);
}

function filterByIsoCodes(data, isoCodes) {
    const isoSet = new Set(isoCodes);
    return data.results.bindings.filter(entry => isoSet.has(entry.isoCode.value));
}

function drawCountryCharts(selectedISO, treatyGroups) {
    const MAX_LABEL_LENGTH = 15;
    const memberCountries = [...new Set(treatyGroups.flatMap(t => t.memberCountries).filter(iso => iso !== selectedISO))];
    const stats = filterByIsoCodes(countryStatistics, [...memberCountries, selectedISO]);

    const makeBarData = (key, title, containerId) => {
        const data = stats
            .filter(d => d[key] && !isNaN(+d[key].value))
            .map(d => ({
                fullName: d.countryLabel.value,
                category: d.countryLabel.value.length > MAX_LABEL_LENGTH
                    ? d.countryLabel.value.slice(0, MAX_LABEL_LENGTH) + "…"
                    : d.countryLabel.value,
                value: +d[key].value,
                highlight: d.isoCode.value === selectedISO
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        drawMiniHorizontalBarChart(data, containerId, title);
    };

    makeBarData("population", "Population by Country (Top 10)", "#pop-chart-container");
    makeBarData("gdp", "GDP by Country (USD) (Top 10)", "#gdp-chart-container");
}

async function renderMap(isoCode) {
    selectedCountryISO = isoCode;
    const selectedFeature = currentGeoData.features.find(f => f.properties.iso_a3 === selectedCountryISO);
    const { centroid } = selectedFeature.properties;

    if (recenterOnClick && centroid) {
        const [lon, lat] = centroid;
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

    const featureByIso = getFeatureMap(currentGeoData);
    const countryTreaties = getTreatiesForCountry(selectedCountryISO);

    const container = document.getElementById("treaty-list");
    container.innerHTML = `<h4 class="treaty-title">Treaties & Members<br>Total Treaties:  ${countryTreaties.length}</h4>` +
    countryTreaties.map(org => {
        const tooltip = org.description || 'No description available';
        const labelHTML = `${org.organization_name}: ${org.memberCount} Mbrs.`;

        if (org.officialWebsite) {
            return `<a href="${org.officialWebsite}" target="_blank" class="treaty-label" data-treaty="${org.organization_name}" title="${tooltip}" style="display: block;">
                ${labelHTML}
            </a>`;
        } else {
            return `<div class="treaty-label" data-treaty="${org.organization_name}" title="${tooltip}" style="display: block;">
                ${labelHTML}
            </div>`;
        }
    }).join('');

    document.querySelectorAll(".treaty-label").forEach(label => {
        const treaty = countryTreaties.find(t => t.organization_name === label.dataset.treaty);
        label.addEventListener("mouseover", () => {
            deckgl.setProps({
                layers: [makeBaseLayer(currentGeoData, selectedCountryISO), makeArcLayer(centroid, treaty.memberCountries, featureByIso, treaty.organization_name)]
            });
        });
        label.addEventListener("mouseout", () => {
            deckgl.setProps({
                layers: [
                    makeBaseLayer(currentGeoData, selectedCountryISO),
                    ...countryTreaties.map(t => makeArcLayer(centroid, t.memberCountries, featureByIso, t.organization_name))
                ]
            });
        });
    });

    const arcLayers = countryTreaties.map(t => makeArcLayer(centroid, t.memberCountries, featureByIso, t.organization_name));
    deckgl.setProps({ layers: [makeBaseLayer(currentGeoData, selectedCountryISO), ...arcLayers] });

    drawCountryCharts(selectedCountryISO, countryTreaties);

    const categoryData = await wdCategoryCounts(selectedCountryISO, Object.fromEntries(countryTreaties.map(t => [t.organization_name, t.memberCountries])));
    const donutChart = createSpectralDonutChart(Object.entries(categoryData).map(([name, value]) => ({ name, value })), 420);
    const donutContainer = document.querySelector("#chart-container");
    donutContainer.innerHTML = "";
    donutContainer.appendChild(donutChart);
}

window.addEventListener("load", () => {
    Promise.all([
        fetch('data/WorldPoly_with_centroids.geojson').then(res => res.json()),
        getAllCountryMemberships(),
        wdGetAllStatsByISO()
    ])
        .then(([geoData, memberships, ctrStats]) => {
            currentGeoData = geoData;
            treatyData = memberships;
            countryStatistics = ctrStats;
            renderMap(selectedCountryISO);
            const modal = document.getElementById("info-modal");
            const dismissBtn = document.getElementById("dismiss-btn");

            if (dismissBtn && modal) {
                dismissBtn.addEventListener("click", () => {
                    modal.classList.add("fade-out");
                    setTimeout(() => {
                        modal.style.display = "none";
                    }, 500); // match the CSS transition duration
                });
            }
        });
});
