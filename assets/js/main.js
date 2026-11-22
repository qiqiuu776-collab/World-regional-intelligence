document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("[data-search]");
  if (!form) return;

  const input = form.querySelector("input");
  const results = document.querySelector("[data-results]");
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
});
