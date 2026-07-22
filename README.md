# Two Wheels, One Way

A private, repository-backed travel documentary for our vacations, roads and memories.

## Current foundation

- Next.js App Router
- TypeScript
- Responsive cinematic design
- Local JSON trip content
- Reusable trip data model
- Search-engine blocking metadata
- Render deployment blueprint

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run typecheck
npm run build
npm run start
```

## Trip content

The first trip placeholder is stored in:

```text
content/trips.json
```

The application currently reads this file directly, so the repository remains the source of truth. Future versions will add individual folders for itineraries, budgets, journal entries, bookings, packing lists and media metadata.

## Render

The repository includes `render.yaml`. In Render, create a new Blueprint and connect this repository. Render will build and deploy the `main` branch automatically.

## Privacy warning

The GitHub repository is currently public. Change it to private before adding personal travel information, bookings, documents or photographs.

The current interface also does not include authentication yet. Do not upload sensitive information until the private-login layer is implemented.

## Planned next modules

1. Private authentication
2. Trip detail pages
3. Daily itinerary and roadbook
4. Budget planner and expense log
5. Map and saved places
6. Packing and preparation checklists
7. Journal and photo gallery
8. Booking/document index
9. PWA and offline trip access
