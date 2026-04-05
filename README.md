# UK Visa Sponsor Dashboard

A high-performance, interactive dashboard for exploring and filtering UK Visa Sponsor data. The application loads sponsor data from a local JSON file and provides advanced filtering and visualization capabilities.

## Features

- **Real-time Filtering**: Filter sponsors by Organisation Name, Town/City, County, Type & Rating, and Route.
- **High Performance**: Uses `react-windowed-select` to handle thousands of filter options smoothly.
- **Data Visualization**:
  - **Top 10 Towns/Cities**: Bar chart showing the distribution of sponsors across different locations.
  - **Route Distribution**: Pie chart showing the breakdown of different visa routes.
- **Interactive Data Table**:
  - Sortable columns.
  - Resizable columns.
  - Pagination for easy navigation.
- **Automated Data Cleaning**: Automatically handles "NULL" values and trims whitespace from the source data.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide React.
- **Backend**: Node.js, Express (dev server).
- **Components**: `react-select` and `react-windowed-select` for advanced dropdowns.
- **Animations**: `motion` (Framer Motion) for smooth UI transitions.

## Getting Started

### Prerequisites

- Node.js installed.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Data Source

The application loads sponsor data from `public/sponsors_list.json`. The JSON file should be an array of objects with the following fields:
- `Organisation Name`
- `Town/City`
- `County`
- `Type & Rating`
- `Route`

To update the data, replace `public/sponsors_list.json` with a new file in the same format.

## License

MIT
