document.addEventListener("DOMContentLoaded", function () {
  const atlas = document.querySelector("[data-atlas]");
  if (atlas) initializeAtlas(atlas);

  const form = document.querySelector("[data-search]");
  if (form) initializeSearch(form);
});

function initializeAtlas(atlas) {
  const dataNode = atlas.querySelector("[data-atlas-events]");
  const range = atlas.querySelector("[data-time-range]");
  const svg = atlas.querySelector(".world-map");
  const events = dataNode ? JSON.parse(dataNode.textContent) : [];
  if (!range || !svg || !events.length) return;

  const regions = Array.from(svg.querySelectorAll("[data-region]"));
  const regionById = new Map(regions.map(region => [region.dataset.region, region]));
  const centers = new Map(regions.map(region => [region.dataset.region, {
    x: Number(region.dataset.cx),
    y: Number(region.dataset.cy)
  }]));
  const center = { x: 600, y: 310 };

  const dateOutput = atlas.querySelector("[data-time-output]");
  const eventDate = atlas.querySelector("[data-event-date]");
  const eventTitle = atlas.querySelector("[data-event-title]");
  const eventCopy = atlas.querySelector("[data-event-copy]");
  const eventRegions = atlas.querySelector("[data-event-routes]");
  const eventLayoutNote = atlas.querySelector("[data-event-layout-note]");
  const eventSource = atlas.querySelector("[data-event-source]");
  const mapPeriod = atlas.querySelector("#map-period");
  const jumpList = atlas.querySelector("[data-timeline-jumps]");
  const modeButtons = Array.from(atlas.querySelectorAll("[data-map-mode]"));
  const instructions = atlas.querySelector("[data-connection-instructions]");
  let mapMode = "geographic";

  function formatYear(year) {
    if (year < 0) return Math.abs(year).toLocaleString("en-US") + " BCE";
    if (year === 0) return "c. 1 BCE / 1 CE";
    return year.toLocaleString("en-US") + " CE";
  }

  function clampVector(vector, maximum) {
    const length = Math.hypot(vector.x, vector.y);
    if (length <= maximum || length === 0) return vector;
    return { x: vector.x * maximum / length, y: vector.y * maximum / length };
  }

  function setMapLayout(event) {
    document.body.dataset.mapMode = mapMode;
    if (instructions) {
      instructions.textContent = mapMode === "connection"
        ? "Qualitative view: connected blocks move closer; documented frictions widen the gap. No route lines are drawn."
        : "Real position: each region stays at its true geographic coordinates.";
    }

    modeButtons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.mapMode === mapMode));
    });

    if (mapMode === "geographic") {
      regions.forEach(region => {
        region.style.transform = "translate(0px, 0px)";
        region.classList.remove("is-connected", "is-diverging", "is-mixed");
      });
      return;
    }

    const integration = Math.max(0, Math.min(1, Number(event.integration) || 0));
    const compression = integration * 0.2;
    const offsets = new Map(regions.map(region => [region.dataset.region, { x: 0, y: 0 }]));
    regions.forEach(region => region.classList.remove("is-connected", "is-diverging", "is-mixed"));

    function addPair(pair, direction) {
      if (!Array.isArray(pair) || pair.length < 3) return;
      const [firstId, secondId, strengthValue] = pair;
      const first = centers.get(firstId);
      const second = centers.get(secondId);
      const firstOffset = offsets.get(firstId);
      const secondOffset = offsets.get(secondId);
      if (!first || !second || !firstOffset || !secondOffset) return;

      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const length = Math.hypot(dx, dy) || 1;
      const strength = Math.max(0, Math.min(1, Number(strengthValue) || 0));
      regionById.get(firstId).classList.add(direction > 0 ? "is-connected" : "is-diverging");
      regionById.get(secondId).classList.add(direction > 0 ? "is-connected" : "is-diverging");
      const travel = Math.min(88, length * strength * 0.2) * direction;
      const x = dx / length * travel;
      const y = dy / length * travel;
      firstOffset.x += x;
      firstOffset.y += y;
      secondOffset.x -= x;
      secondOffset.y -= y;
    }

    (event.links || []).forEach(pair => addPair(pair, 1));
    (event.tensions || []).forEach(pair => addPair(pair, -1));
    regions.forEach(region => {
      if (region.classList.contains("is-connected") && region.classList.contains("is-diverging")) {
        region.classList.add("is-mixed");
      }
    });

    regions.forEach(region => {
      const original = centers.get(region.dataset.region);
      const offset = clampVector(offsets.get(region.dataset.region), 105);
      const baseX = (original.x - center.x) * compression;
      const baseY = (original.y - center.y) * compression;
      const x = baseX + offset.x;
      const y = baseY + offset.y;
      region.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px)";
    });
  }

  function renderEvent(event) {
    if (!event) return;
    eventDate.textContent = event.date;
    eventTitle.textContent = event.title;
    eventCopy.textContent = event.copy;
    eventRegions.textContent = event.regions_label;
    eventLayoutNote.textContent = event.layout_note;
    eventSource.href = event.source_url;
    eventSource.textContent = event.source_title + " ↗";
    eventSource.setAttribute("aria-label", "Open source: " + event.source_title);

    const oldSecondary = atlas.querySelector("[data-secondary-source]");
    if (oldSecondary) oldSecondary.remove();
    if (event.secondary_source_url) {
      const secondary = document.createElement("a");
      secondary.className = "secondary-source";
      secondary.dataset.secondarySource = "";
      secondary.href = event.secondary_source_url;
      secondary.target = "_blank";
      secondary.rel = "noopener";
      secondary.textContent = event.secondary_source_title + " ↗";
      eventSource.insertAdjacentElement("afterend", secondary);
    }

    if (mapPeriod) mapPeriod.textContent = event.period;
    setMapLayout(event);
    jumpList.querySelectorAll("button").forEach(button => {
      button.setAttribute("aria-current", String(Number(button.dataset.year) === event.year));
    });
  }

  function updateFromYear(year) {
    const selected = events.filter(event => event.year <= year).at(-1);
    dateOutput.textContent = formatYear(year);
    if (selected) renderEvent(selected);
    else {
      const first = events[0];
      renderEvent({
        ...first,
        date: "Before c. 2600 BCE",
        period: "Before the mapped episodes",
        title: "Exchange predates this timeline",
        copy: "Human movement and exchange long predate the first episode in this selected record. This map begins where a cited long-distance network becomes visible here; it does not mark the beginning of connection.",
        regions_label: "Earlier histories are not plotted in this edition",
        layout_note: "No regional blocks are drawn together before the first selected, documented episode.",
        integration: 0,
        links: [],
        tensions: [],
        source_title: "The timeline scope and method",
        source_url: "#map-method"
      });
      jumpList.querySelectorAll("button").forEach(button => button.setAttribute("aria-current", "false"));
    }
  }

  events.forEach(event => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.year = event.year;
    button.textContent = event.date;
    button.addEventListener("click", function () {
      range.value = event.year;
      updateFromYear(event.year);
    });
    jumpList.append(button);
  });

  modeButtons.forEach(button => {
    button.addEventListener("click", function () {
      mapMode = button.dataset.mapMode;
      const year = Number(range.value);
      const selected = events.filter(event => event.year <= year).at(-1) || events[0];
      setMapLayout(selected);
    });
  });

  range.addEventListener("input", function () {
    updateFromYear(Number(range.value));
  });

  regions.forEach(region => {
    region.addEventListener("mouseenter", () => region.classList.add("is-highlighted"));
    region.addEventListener("mouseleave", () => region.classList.remove("is-highlighted"));
    region.addEventListener("focus", () => region.classList.add("is-highlighted"));
    region.addEventListener("blur", () => region.classList.remove("is-highlighted"));
  });

  updateFromYear(Number(range.value));
}

function initializeSearch(form) {
  const input = form.querySelector("input");
  const results = document.querySelector("[data-results]");
  if (!input || !results) return;
  let pages = null;

  fetch(new URL("search.json", document.baseURI))
    .then(function (response) {
      if (!response.ok) throw new Error("Search index could not be loaded");
      return response.json();
    })
    .then(function (items) {
      pages = items;
    })
    .catch(function () {
      pages = [];
      results.textContent = "Search is temporarily unavailable.";
    });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (pages === null) {
      results.textContent = "Search index is loading. Please try again in a moment.";
      return;
    }
    const query = input.value.toLocaleLowerCase().trim();
    const found = pages.filter(function (page) {
      return [page.title, page.summary, page.tags].join(" ").toLocaleLowerCase().includes(query);
    });

    results.replaceChildren();
    if (!found.length) {
      results.textContent = "No matching pages yet. Try a country or region.";
      return;
    }

    found.forEach(function (page) {
      const link = document.createElement("a");
      const title = document.createElement("strong");
      title.textContent = page.title;
      link.href = page.url;
      link.append(title, document.createTextNode(" · " + (page.summary || "")));
      results.append(link);
    });
  });
}
