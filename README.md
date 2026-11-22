# World in Context

An independent research platform exploring countries, regions and global affairs through political, economic, historical and policy perspectives.

Website: https://qiqiuu776-collab.github.io/World-regional-intelligence/

The homepage is an interactive historical atlas. Its timeline records selected episodes in `_data/exchange_timeline.yml`; each entry should link to a reliable source and describe routes as generalized, not to scale.

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
- _data/exchange_timeline.yml: sourced moments and schematic route segments used by the homepage map
- sources/: sourcing and editorial standards

## Editorial principles

1. Separate verified facts from interpretation.
2. Date all time-sensitive information.
3. Link to original sources wherever possible.
4. Identify stakeholders and explain policy or business implications.
5. State uncertainty and competing interpretations fairly.
