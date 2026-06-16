# UK Visa Sponsor Dashboard 🇬🇧💼

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, interactive dashboard for exploring and filtering UK Visa Sponsor data. This application loads sponsor data directly from a local JSON file, offering advanced filtering, responsive visualizations, and a streamlined user experience to help users find visa sponsorship opportunities with ease.

## ✨ Features

- **Real-Time Advanced Filtering**: Instantly search and filter sponsors by multiple criteria including Organisation Name, Town/City, County, Type & Rating, and Visa Route.
- **High-Performance Architecture**: Built to handle thousands of data points smoothly using `react-windowed-select` for optimized drop-down rendering without performance degradation.
- **Interactive Data Visualization**:
  - **Top 10 Towns/Cities**: A dynamic bar chart illustrating the geographic distribution of sponsors.
  - **Route Distribution**: A comprehensive pie chart detailing the breakdown of various visa routes.
- **Robust Data Table**:
  - Fully sortable and resizable columns for tailored data viewing.
  - Built-in pagination for effortless navigation through large datasets.
- **Automated Data Processing**: Intelligently cleans source data on the fly, seamlessly handling missing ("NULL") values and trimming excessive whitespace.
- **Smooth Animations**: Powered by Framer Motion (`motion`) for a polished and engaging user experience.

## 🛠️ Tech Stack

- **Frontend Framework**: [React 18](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Utilities**: `clsx`, `tailwind-merge`, `fuse.js`

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your system.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repository-url>
   cd explore-opportunities
   ```

2. **Install the dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   To create a production-ready build, run:
   ```bash
   npm run build
   ```
   To preview the production build locally:
   ```bash
   npm run preview
   ```

## 📊 Data Source & Automation

The application loads sponsor data from `public/sponsors_list.json`. The JSON file is expected to be an array of objects containing the following fields:
- `Organisation Name`
- `Town/City`
- `County`
- `Type & Rating`
- `Route`

### 🔄 Automated Daily Updates
The sponsor data is kept up-to-date automatically. We use a GitHub Actions workflow (`.github/workflows/update-sponsors.yml`) paired with a Python extraction script (`scripts/fetch_sponsors.py`) that runs daily. 
- It fetches the latest official UK Government CSV file of licensed sponsors.
- It processes, cleans, and converts the CSV data into an optimized JSON format.
- If there are updates, it automatically commits the new data (`public/sponsors_list.json` and `public/last_updated.json`) and triggers a new deployment of the dashboard.

### Manual Data Update
To manually update the data source, you can run the extraction script locally:
```bash
python scripts/fetch_sponsors.py
```
Alternatively, you can replace the `public/sponsors_list.json` file with a newer version matching the identical format.
## 📝 License

This project is licensed under the MIT License.
