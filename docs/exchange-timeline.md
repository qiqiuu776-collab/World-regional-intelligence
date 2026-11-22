# Homepage exchange timeline

The interactive map reads its dated entries from `_data/exchange_timeline.yml`. Add one entry per documented historical moment.

Each entry uses:

- `year`: a signed year for the slider (`-2600` means 2600 BCE; positive years are CE).
- `date`, `period`, `title`, and `copy`: short reader-facing labels and context.
- `routes_label`: the broad places or corridors represented.
- `source_title` and `source_url`: a direct, reliable source for the entry.
- `secondary_source_title` and `secondary_source_url`: an optional corroborating source.
- `routes`: broad line segments. Each `from` and `to` is `[longitude, latitude]`; `kind` is `exchange`, `coercion`, or `friction`.

Keep entries in chronological order. Use `exchange` for a sourced connection, `coercion` when conquest or forced movement is central to that route, and `friction` for a restricted or rerouted connection. The map is schematic: do not treat line length, width, or continuity as measured trade, and do not imply that one dated route remained active unchanged until the next entry. The homepage states these limits beside the timeline.

For current trade patterns, prefer dated reports from organizations such as UN Trade and Development and the WTO. Update recent entries when new comparable data are published, and describe fragmentation as selective and uneven when the evidence supports that distinction.
