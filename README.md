# World in Context

An independent research platform exploring countries, regions and global affairs through political, economic, historical and policy perspectives.

Website: https://qiqiuu776-collab.github.io/World-regional-intelligence/

The homepage is an interactive historical atlas. It uses real 1:10m Natural Earth country boundaries, grouped into regional blocks and projected with Robinson. The timeline in `_data/exchange_timeline.yml` describes selected episodes and qualitative regional ties; its Connection view moves the real map blocks without drawing routes. The layout values are editorial illustrations, not measured trade data.

## Writing and publishing

Write articles in Markdown with YAML front matter. Jekyll builds each article page, its collection listing, and the search index when the site is published through GitHub Pages.

- Country profiles: _countries/
- Regional studies: _regions/
- Daily briefings: _daily_affairs/
- Historical context: _history/
- Global issues: _global_issues/
- Research and analysis: _research/

Start from [docs/article-template.md](docs/article-template.md). Give each article a title, a one-sentence summary, a last-updated date, tags, and a permalink. Existing country profile URLs are preserved.

For GitHub Pages, use Settings > Pages > Deploy from a branch > main > /(root). GitHub Pages will build the Jekyll site from the repository root.

## Repository structure

- index.html: homepage
- countries/, regions/, daily-affairs/, history/, global-issues/, research/: section indexes and evergreen overview pages
- _countries/, _regions/, _daily_affairs/, _history/, _global_issues/, _research/: Markdown article collections
- _layouts/: shared page layouts
- _includes/: reusable collection listing
- assets/: shared styles and scripts
- _data/exchange_timeline.yml: sourced moments, regional ties and selected periods used by the homepage map
- _includes/regional-map.svg: generated map geometry from Natural Earth country polygons
- scripts/build-regional-map.py: generator for the regional map SVG
- sources/: sourcing and editorial standards

## Editorial principles

1. Separate verified facts from interpretation.
2. Date all time-sensitive information.
3. Link to original sources wherever possible.
4. Identify stakeholders and explain policy or business implications.
5. State uncertainty and competing interpretations fairly.

## Homepage map data

The regional map is built from Natural Earth's 1:10m Admin-0 countries dataset. Natural Earth places its vector data in the public domain; no permission is required. The build script groups country polygons by UN-style subregion into readable regional blocks. The real-position view uses geographic coordinates; connection-view shifts and event-to-event values are qualitative interpretations of the cited historical episodes, not exact distances, route paths or trade volumes.
