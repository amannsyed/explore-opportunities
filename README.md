# UK Visa Sponsor Dashboard 🇬🇧💼

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue.svg)](https://amannsyed.github.io/explore-opportunities/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, interactive dashboard for exploring UK Visa Sponsor data. Built to handle 140,000+ sponsor records with advanced filtering, fuzzy search, shareable URLs, CSV export, and real-time data visualisations — all in a responsive, full-width layout with dark mode support.

**🔗 [Live Demo →](https://amannsyed.github.io/explore-opportunities/)**

## ✨ Features

### 🔍 Search & Filtering
- **Multi-Criteria Filtering** — Filter sponsors by Organisation Name, Town/City, County, Type & Rating, and Visa Route using optimised windowed dropdowns.
- **Fuzzy Search** — Toggle fuzzy matching (powered by Fuse.js) for approximate organisation name searches with configurable threshold.
- **Exact Search** — Standard substring matching for precise lookups.
- **Favorites System** — Star sponsors to bookmark them locally (persisted via localStorage). Filter to show favorites only.

### 📊 Data Visualisation
- **Top 10 Towns** — Horizontal bar chart showing geographic distribution of sponsors.
- **Top 10 Counties** — Horizontal bar chart showing county-level sponsor concentration.
- **Route Distribution** — Donut chart breaking down visa route types (Skilled Worker, Creative Worker, etc.).

### 📋 Data Table
- **Sortable Columns** — Click any column header to sort ascending/descending.
- **Resizable Columns** — Drag column borders to resize for custom viewing.
- **Paginated Navigation** — 15 items per page with a searchable page selector and prev/next controls.

### 🌙 Dark Mode
- Persistent dark/light mode toggle, respects system preference on first visit.
- Saved to localStorage so the choice is remembered across sessions.

### 📤 Export & Sharing
- **Filtered CSV Export** — Download only the currently filtered results as a CSV file.
- **Full CSV Export** — Download the entire dataset (140,000+ records) as a CSV file.
- **Shareable URLs** — All active filters are synced to the URL query string, so any filtered view can be copied and shared as a direct link.
- Uses the File System Access API where available, with a universal blob fallback.

### 🎨 Design & Layout
- **Full-Width Responsive Layout** — No fixed max-width cap; the dashboard fills the entire viewport edge-to-edge.
- **Sticky Header & Filter Bar** — Header and filters remain accessible while scrolling through results.
- **Smooth Transitions** — CSS transitions on theme changes, hover states, and interactive elements.

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | [React 18](https://reactjs.org/) with TypeScript |
| **Build Tool** | [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Search** | [Fuse.js](https://www.fusejs.io/) (fuzzy matching) |
| **Dropdowns** | [react-windowed-select](https://github.com/jacobworrel/react-windowed-select) (virtualised for performance) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Utilities** | `clsx`, `tailwind-merge` |
| **CI/CD** | GitHub Actions (daily data update + GitHub Pages deploy) |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python 3](https://www.python.org/) (only needed for manual data updates)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/amannsyed/explore-opportunities.git
   cd explore-opportunities
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm run preview   # preview the production build locally
   ```

## 📊 Data Source & Automation

The dashboard loads sponsor data from `public/sponsors_list.json` — an array of objects with the following fields:

| Field | Description |
|---|---|
| `Organisation Name` | Name of the licensed sponsor |
| `Town/City` | Town or city of the sponsor |
| `County` | County of the sponsor |
| `Type & Rating` | Sponsor type and rating (e.g. "Worker (A Rating)") |
| `Route` | Visa route (e.g. "Skilled Worker") |

### 🔄 Automated Daily Updates

The sponsor list is kept current via two GitHub Actions workflows:

1. **`update-sponsors.yml`** — Runs daily to:
   - Fetch the latest official UK Government CSV of licensed sponsors.
   - Process, clean, and convert the data to optimised JSON.
   - Commit updated `public/sponsors_list.json` and `public/last_updated.json` if changes are detected.

2. **`deploy.yml`** — Triggers on pushes to `main` to:
   - Build the production bundle with Vite.
   - Deploy to GitHub Pages via `peaceiris/actions-gh-pages`.

### Manual Data Update

```bash
python scripts/fetch_sponsors.py
```

Or replace `public/sponsors_list.json` with a new file matching the same format.

## 📁 Project Structure

```text
explore-opportunities/
├── public/
│   ├── sponsors_list.json         # Sponsor data (auto-updated daily)
│   └── last_updated.json          # Timestamp of last data refresh
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # Main dashboard (table, charts, filters, export)
│   │   └── FastSelect.tsx         # Optimised windowed dropdown component
│   ├── data.ts                    # Sponsor type definition
│   ├── App.tsx                    # Root application component
│   ├── main.tsx                   # React DOM entry point
│   └── index.css                  # Global styles and Tailwind imports
├── scripts/
│   └── fetch_sponsors.py          # Python script for data extraction
├── .github/
│   └── workflows/
│       ├── update-sponsors.yml    # Daily data update workflow
│       └── deploy.yml             # GitHub Pages deployment workflow
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.

## 📝 License

This project is licensed under the MIT License.
