# jQuery Pokédex (ISTE-340 Project 2)

**Live URL:** _add your hosted URL here (e.g. GitHub Pages)_

A Pokédex built with jQuery that consumes the free **PokéAPI** JSON web service (https://pokeapi.co). No API key needed. To run locally, open `index.html` (or run `python3 -m http.server` in this folder).

## Core data (loaded at start via AJAX)
- `/pokemon?limit=1025` – every Pokémon (grid, search)
- `/type` – the type filter chips

## On-demand data (loaded when the user asks)
- `/type/{name}` – when a type chip is clicked (cached after the first call)
- `/pokemon/{id}` + `/pokemon-species/{id}` – when a card is clicked (two parallel requests with `$.when`) → stats, types, abilities, description

## Plug-ins (3 third-party + 1 of my own)
1. **jQuery Lazy** – card images load only when they scroll into view, with a fade-in.
2. **Magnific Popup** – animated details modal.
3. **Toastr** – notifications (favorites added/removed, network errors).
4. **`$.fn.statBars` (my own plug-in, `js/plugins.js`)** – animated stat bars in the modal.

## Above and beyond
- Live search + type filter + "Favorites" filter, all combined.
- Favorites saved in `localStorage`.
- "Load more" paging with staggered fade-in animations.
- Own custom jQuery plug-in, parallel AJAX with `$.when`, response caching, error handling.
- Responsive dark UI with type-colored badges.

## Files
`index.html`, `css/style.css`, `js/app.js` (main logic, commented), `js/plugins.js` (custom plug-in)
