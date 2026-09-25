# ToDo List

This web application is a standard todo list app with a twist: it allows users to create and manage persistent sets of todo lists, eliminating the need to recreate lists for recurring tasks, such as packing for a trip.

## Features

- Create and manage multiple todo lists
- Persistent storage for todo lists
- User-friendly interface
- Editable and deletable tasks
- Recurring tasks management

## Technologies Used

- TypeScript
- JavaScript
- HTML
- CSS
- Firebase

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js 18+ (20 recommended)

### Installation

```sh
git clone https://github.com/adiso06/ToDoList.git
cd ToDoList
npm install
npm run dev
```

The dev server runs at [http://localhost:5173](http://localhost:5173). The Firebase config lives in `src/lib/firebase.ts`; swap in your own project's config to use a different database.

### Deploying

Pushing to `main` builds the app and publishes `dist/` to the `gh-pages` branch via `.github/workflows/deploy.yml`. `npm run deploy` does the same from your machine.

## Usage

Built for lists you run through again and again: groceries, packing, chores.

- **New list**: the button in the header. Double-click a list name (or use its `⋯` menu) to rename it.
- **Items**: type in "Add item" and press Enter (or tap away). Pasting several lines adds one item per line. Click an item's text to edit it; clearing the text deletes it.
- **Staples vs. one-offs**: items stay on the list by default. Tap *Just once* while adding (or pick *Just this time* from an item's `⋯` menu) for things you only need this time; they show a "once" tag.
- **Skip this time**: from an item's `⋯` menu, for things you don't need on this trip. Skipped items are hidden and don't count toward progress.
- **Checked items** drop out of the way into a "3 checked · 1 skipped" row at the bottom of the list; tap it to show them.
- **Reset list** (`⋯` menu, or the button when everything's done) starts the list over: staples are unchecked, skipped items come back, and one-offs you've checked off are removed. Sections can be reset on their own too.
- **Sections**: `⋯` → Add section. Each section has its own menu to rename, reset, or delete it.
- **Reordering**: drag the grip handle to reorder items (within or between sections) and lists.
- Deletes and resets can be undone from the toast at the bottom of the screen.
