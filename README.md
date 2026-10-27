# HX Nexus – Trader CRM Portal (frontend)

Frontend-only trader portal built with plain HTML, CSS and JavaScript. No framework, no build step, no backend. All data is dummy data held in the browser.

## Run it

Open `index.html` in a browser (double-click works) or serve the folder with any static server.

Demo login: any valid email and a password of 4+ characters, for example `dana.reyes@hxnexus.com` / `nexus-demo-8`.

## Pages

| Route | What it does |
|---|---|
| `#/login`, `#/register` | Sign in and create account, with inline validation, password strength meter and show/hide password |
| `#/accounts` | Summary cards, balance trend chart, searchable / sortable / paginated accounts table, account detail modal |
| `#/fund` | Deposit form with live fee calculation, confirmation modal, deposit history table |
| `#/support` | Support request form, expandable ticket threads, FAQ |

## Features

- Responsive from phone to wide desktop (sidebar becomes a drawer under 860px)
- Light and dark theme (follows the system, switch with an animated circular reveal)
- English, Hindi and Marathi for navigation labels
- Data table component with search, status filter, sorting, pagination and CSV export
- Hand-written SVG charts with hover/touch tooltips (no chart library)
- Accessible: skip link, labelled controls, focus trap in modals, keyboard-operable tables and accordions, reduced-motion support
- Hash router with route guard; redirects use `location.replace` so the Back button stays clean
- User input is escaped before it is rendered, and `localStorage` access never throws

## Structure

```
index.html        page shell
css/style.css     design tokens (:root) + all styles
js/data.js        dummy data, translations, safe localStorage wrapper
js/ui.js          icons, toast, modal, charts, data table
js/auth.js        sign-in and register pages
js/pages.js       accounts, fund and support pages
js/app.js         app shell, theme, language, router
```

## Changing the look

Colours, fonts and radii are CSS variables at the top of `css/style.css` (one block for light, one for dark). Change them there and the whole portal follows.
