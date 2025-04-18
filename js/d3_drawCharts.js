// This module contains functions to draw various types of charts using D3.js.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Draws a horizontal bar chart showing values (e.g., population or GDP) for a list of countries
export function drawMiniHorizontalBarChart(data, selector, title) {
  const container = d3.select(selector);
  container.selectAll("*").remove();

  // Create a tooltip (if one doesn't already exist)
  let tooltip = d3.select("#tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("padding", "6px 10px")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("display", "none")
      .style("z-index", "3000");
  }

  // Chart dimensions and layout
  const margin = { top: 30, right: 10, bottom: 20, left: 100 };
  const width = 300 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  // Create SVG container
  const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("background-color", "white")
    .style("border-radius", "8px");

  // Add chart title
  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(title);

  // Group to hold the chart bars and axes
  const chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales for x (value) and y (category)
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, height])
    .padding(0.1);

  // Add y-axis (country names)
  chartGroup.append("g").call(d3.axisLeft(y));

  // Add x-axis (value scale)
  chartGroup.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(3).tickFormat(d3.format(".2s")));

  // Tooltip label prefix based on chart type
  const displayLabel = title.startsWith("GDP") ? "GDP: $" : "Population: ";

  // Draw bars and bind interaction events
  chartGroup.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("y", d => y(d.category))
    .attr("height", y.bandwidth())
    .attr("x", 0)
    .attr("width", d => x(d.value))
    .attr("fill", d => d.highlight ? "#B9B6D1" : "#E1DEE7")
    .on("mouseover", (event, d) => {
      tooltip
        .style("display", "block")
        .html(`<strong>${d.fullName}</strong><br>${displayLabel}${d.value.toLocaleString()}`);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", (event.pageY - 28) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });
}

// Draws a circular bar chart using radial arcs for treaty categories
export function drawCircularBarChart(data, selector) {
  const container = d3.select(selector);
  container.selectAll("*").remove();

  const width = 600;
  const height = 600;
  const innerRadius = 100;
  const outerRadius = Math.min(width, height) / 2 - 40;

  // SVG container setup
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("max-width", `${width}px`)
    .style("height", "auto")
    .style("background-color", "white")
    .style("display", "block")
    .style("margin", "0 auto")
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  // X (angular) and Y (radial) scales
  const x = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, 2 * Math.PI]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([innerRadius, outerRadius]);

  const color = d => categoryColorMap[d] || "#ccc";

  // Draw the bars as arcs
  svg.append("g")
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("fill", d => color(d.category))
    .attr("d", d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(d => y(d.value))
      .startAngle(d => x(d.category))
      .endAngle(d => x(d.category) + x.bandwidth())
      .padAngle(0.01)
      .padRadius(innerRadius)
    );

  // Draw category labels
  svg.append("g")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("text-anchor", d => {
      const angle = x(d.category) + x.bandwidth() / 2;
      return (angle > Math.PI && angle < 2 * Math.PI) ? "end" : "start";
    })
    .attr("transform", d => {
      const angle = x(d.category) + x.bandwidth() / 2 - Math.PI / 2;
      const radius = y(d.value) + 10;
      return `rotate(${(angle * 180 / Math.PI)})translate(${radius},0)`;
    })
    .append("text")
    .text(d => d.category)
    .attr("transform", d => {
      const angle = x(d.category) + x.bandwidth() / 2;
      return (angle > Math.PI && angle < 2 * Math.PI) ? "rotate(180)" : null;
    })
    .style("font-size", "16px")
    .attr("alignment-baseline", "middle");

  // Chart title
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("y", -outerRadius - 10)
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("International Organization Types");
}

// Map of treaty categories to specific colors
const categoryColorMap = {
  "Cultural/Educational": "#189AB4",
  "Economic/Trade Organizations": "#D6AD60",
  "Environmental": "#76B947",
  "General International Orgs": "#D9A5B3",
  "Intergovernmental Organizations (IGOs)": "#7FA6C9",
  "Military Alliances": "#d2d4a4",
  "Political Alliances": "#b1e3b1",
  "Religious or Ideological": "#887BB0",
  "Scientific & Technical": "#955f63",
  "Sports Organizations": "#A49393"
};

// Draws a donut chart showing treaty categories and proportions
export function createSpectralDonutChart(data, width = 420) {
  const scaleFactor = 0.6;
  const radius = width / 2 * scaleFactor;
  const height = radius * 2 + 50;

  const arc = d3.arc()
    .innerRadius(radius * 0.67)
    .outerRadius(radius - 1);

  const pie = d3.pie()
    .padAngle(1 / radius)
    .sort(null)
    .value(d => d.value);

  const color = d => categoryColorMap[d] || "#ccc";

  const svg = d3.create("svg")
    .attr("class", "spectral-donut")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -radius - 20, width, height])
    .attr("style", "max-width: 100%; height: auto; display: block; margin: 0 auto;");

  // Add chart title
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("y", -radius - 5)
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Treaty Types Categorized");

  // Setup tooltip for donut segments
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "donut-tooltip")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("display", "none")
    .style("z-index", "999");

  // Chart group for drawing
  const chartGroup = svg.append("g")
    .attr("transform", `translate(0, 15)`);

  // Draw pie arcs
  chartGroup
    .selectAll("path")
    .data(pie(data))
    .join("path")
    .attr("fill", d => color(d.data.name))
    .attr("d", arc)
    .on("mouseover", (event, d) => {
      tooltip
        .style("display", "block")
        .html(`<strong>${d.data.name}</strong><br>${d.data.value.toLocaleString()}`);
    })
    .on("mousemove", event => {
      tooltip
        .style("top", `${event.pageY - 28}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });

  // Draw labels inside donut segments
  chartGroup
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(pie(data))
    .join("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .style("stroke", "white")
    .style("stroke-width", 3)
    .style("paint-order", "stroke")
    .call(text => text.append("tspan")
      .attr("y", "-0.4em")
      .attr("font-weight", "bold")
      .text(d => d.data.name))
    .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
      .attr("x", 0)
      .attr("y", "0.7em")
      .attr("fill-opacity", 0.7)
      .text(d => d.data.value.toLocaleString("en-US")));

  return svg.node();
}