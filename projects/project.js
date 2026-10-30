import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const title = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedYear = null;

const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

function searchFiltered() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function visibleProjects() {
  let result = searchFiltered();
  if (selectedYear !== null) {
    result = result.filter((p) => p.year === selectedYear);
  }
  return result;
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(projectsGiven, (v) => v.length, (d) => d.year);
  let data = rolledData
    .map(([year, count]) => ({ value: count, label: year }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (selectedYear !== null && !data.some((d) => d.label === selectedYear)) {
    selectedYear = null;
  }

  let arcData = d3.pie().value((d) => d.value)(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  const toggle = (label) => {
    selectedYear = selectedYear === label ? null : label;
    update();
  };

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(data[i].label))
      .attr('class', data[i].label === selectedYear ? 'selected' : null)
      .on('click', () => toggle(data[i].label));
  });

  data.forEach((d) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', `legend-item${d.label === selectedYear ? ' selected' : ''}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => toggle(d.label));
  });
}

function update() {
  renderPieChart(searchFiltered());
  const shown = visibleProjects();
  renderProjects(shown, projectsContainer, 'h2');
  title.textContent = `${shown.length} Projects`;
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  update();
});

update();