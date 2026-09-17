# 501 Collective Trip Planner

A calendar + budget + itinerary + team planner for 501 Collective trips. One dashboard per trip: a month-grid calendar with live weather, a budget that deducts as you log expenses (in any currency), a per-city list of activity options, and a team roster.

## Stack

React + TypeScript + Vite + Tailwind CSS v4. State lives in the browser (localStorage via Zustand) — no backend, no accounts to manage.

## Local dev

```bash
npm install
npm run dev
```

## Data & privacy

Everything (trips, expenses, team, receipts metadata) is stored only in your browser's localStorage — nothing is sent to a server except:

- [Open-Meteo](https://open-meteo.com) for weather forecasts and city geocoding (no key required)
- [open.er-api.com](https://www.exchangerate-api.com/) for currency conversion rates (no key required)
- Your own Dropbox account, if you connect it, for receipt photo uploads (via Dropbox's OAuth PKCE flow — no server secret involved)

## Deployment

Deployed as a static site (Vite build output in `dist/`). Any static host works (Vercel, Netlify, GitHub Pages).
