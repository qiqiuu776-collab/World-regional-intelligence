document.addEventListener("DOMContentLoaded", function () {
  const atlas = document.querySelector("[data-atlas]");
  if (atlas) initializeAtlas(atlas);

  const form = document.querySelector("[data-search]");
  if (form) initializeSearch(form);
});

function initializeAtlas(atlas) {
  const dataNode = atlas.querySelector("[data-atlas-events]");
  const range = atlas.querySelector("[data-time-range]");
  const routeLayer = atlas.querySelector("[data-route-layer]");
  const placeLayer = atlas.querySelector("[data-place-layer]");
  const events = dataNode ? JSON.parse(dataNode.textContent) : [];
  if (!range || !routeLayer || !placeLayer || !events.length) return;

  const nodes = {
    mesopotamia: [45, 30],
    indus: [67, 25],
    eastAsia: [108, 34],
    centralAsia: [75, 40],
    westAsia: [45, 35],
    mediterranean: [15, 38],
    eastAfrica: [39, -4],
    arabia: [52, 25],
    india: [78, 20],
    southeastAsia: [110, 5],
    kilwa: [39, -4],
    china: [115, 25],
    europe: [0, 50],
    westAfrica: [-5, 5],
    northAmerica: [-75, 40],
    caribbean: [-75, 15],
    philippines: [121, 14],
    mexico: [-100, 20],
    us: [-74, 40],
    eastAsiaCoast: [135, 36],
    africa: [0, 8]
  };

  const dateOutput = atlas.querySelector("[data-time-output]");
  const eventDate = atlas.querySelector("[data-event-date]");
  const eventTitle = atlas.querySelector("[data-event-title]");
  const eventCopy = atlas.querySelector("[data-event-copy]");
  const eventRoutes = atlas.querySelector("[data-event-routes]");
  const eventSource = atlas.querySelector("[data-event-source]");
  const mapPeriod = atlas.querySelector("#map-period");
  const jumpList = atlas.querySelector("[data-timeline-jumps]");

  function formatYear(year) {
    if (year < 0) return Math.abs(year).toLocaleString("en-US") + " BCE";
    if (year === 0) return "c. 1 BCE / 1 CE";
    return year.toLocaleString("en-US") + " CE";
  }

  function project(point) {
    const [longitude, latitude] = point;
    return {
      x: ((longitude + 180) / 360) * 1000,
      y: ((82 - latitude) / 164) * 500
    };
  }

  function pathFor(fromPoint, toPoint, kind) {
    const start = project(fromPoint);
    const end = project(toPoint);
    let adjustedEnd = { ...end };
    const delta = end.x - start.x;
    const crossesSeam = Math.abs(delta) > 500;
    if (crossesSeam) adjustedEnd.x += delta > 0 ? -1000 : 1000;

    const lift = Math.min(58, Math.max(16, Math.abs(adjustedEnd.x - start.x) * 0.12));
    const control = {
      x: (start.x + adjustedEnd.x) / 2,
      y: Math.min(start.y, adjustedEnd.y) - lift
    };
    let paths = [];

    if (crossesSeam) {
      const edgeX = adjustedEnd.x > 1000 ? 1000 : 0;
      let low = 0;
      let high = 1;
      for (let index = 0; index < 28; index += 1) {
        const mid = (low + high) / 2;
        const x = (1 - mid) ** 2 * start.x + 2 * (1 - mid) * mid * control.x + mid ** 2 * adjustedEnd.x;
        if ((adjustedEnd.x > 1000 && x < edgeX) || (adjustedEnd.x < 0 && x > edgeX)) low = mid;
        else high = mid;
      }
      const t = (low + high) / 2;
      const split = {
        x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * adjustedEnd.x,
        y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * adjustedEnd.y
      };
      const firstControl = { x: (1 - t) * start.x + t * control.x, y: (1 - t) * start.y + t * control.y };
      const secondControl = { x: (1 - t) * control.x + t * adjustedEnd.x, y: (1 - t) * control.y + t * adjustedEnd.y };
      const shift = adjustedEnd.x > 1000 ? -1000 : 1000;
      paths = [
        `M${start.x},${start.y} Q${firstControl.x},${firstControl.y} ${split.x},${split.y}`,
        `M${split.x + shift},${split.y} Q${secondControl.x + shift},${secondControl.y} ${end.x},${end.y}`
      ];
    } else {
      paths = [`M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`];
    }

    return paths.map(function (pathData) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("class", "route route-" + kind);
      return path;
    });
  }

  function renderMap(event) {
    routeLayer.replaceChildren();
    placeLayer.replaceChildren();
    const drawn = new Set();
    event.routes.forEach(function (route) {
      let from = route.from;
      let to = route.to;
      if (typeof from === "string") from = nodes[from];
      if (typeof to === "string") to = nodes[to];
      if (!from || !to) return;
      pathFor(from, to, route.kind || "exchange").forEach(path => routeLayer.append(path));
      [from, to].forEach(function (point) {
        const projected = project(point);
        const key = Math.round(projected.x) + ":" + Math.round(projected.y);
        if (drawn.has(key)) return;
        drawn.add(key);
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", projected.x);
        dot.setAttribute("cy", projected.y);
        dot.setAttribute("r", "4");
        dot.setAttribute("class", "route-dot route-dot-" + (route.kind || "exchange"));
        placeLayer.append(dot);
      });
    });
  }

  function renderEvent(event) {
    eventDate.textContent = event.date;
    eventTitle.textContent = event.title;
    eventCopy.textContent = event.copy;
    eventRoutes.textContent = event.routes_label;
    eventSource.href = event.source_url;
    eventSource.textContent = "";
    const primary = document.createElement("span");
    primary.textContent = event.source_title + " ↗";
    eventSource.append(primary);
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
    renderMap(event);
    jumpList.querySelectorAll("button").forEach(function (button) {
      button.setAttribute("aria-current", Number(button.dataset.year) === event.year ? "true" : "false");
    });
  }

  function updateFromYear(year) {
    const selected = events.filter(event => event.year <= year).at(-1);
    dateOutput.textContent = formatYear(year);
    if (selected) renderEvent(selected);
    else {
      const before = {
        date: "Before c. 2600 BCE",
        period: "Before the mapped episodes",
        title: "Exchange predates this timeline",
        copy: "Human movement, contact and exchange long predate the first episode in this selected record. The map starts where a cited long-distance trading network becomes visible here; it does not mark the beginning of connection.",
        routes_label: "Earlier histories are not plotted in this edition",
        source_title: "The timeline scope and method",
        source_url: "#map-method",
        routes: []
      };
      renderEvent(before);
    }
  }

  events.forEach(function (event) {
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

  range.addEventListener("input", function () {
    updateFromYear(Number(range.value));
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
