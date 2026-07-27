import React, { useState, useMemo, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import FastSelect from './FastSelect';
import { Sponsor } from '../data';
import { 
  Search, Filter, MapPin, Building2, Briefcase, Star, Route as RouteIcon, 
  Calendar, ArrowUpDown, Database, Loader2, Download, FileDown, RotateCcw, Sparkles,
  Moon, Sun, Share2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function Dashboard() {
  // Features: Dark mode, Favorites, URL sync
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sponsorFavorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [selectedOrganisations, setSelectedOrganisations] = useState<readonly {value: string, label: string}[]>([]);
  const [selectedTownCities, setSelectedTownCities] = useState<readonly {value: string, label: string}[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<readonly {value: string, label: string}[]>([]);
  const [selectedTypeRatings, setSelectedTypeRatings] = useState<readonly {value: string, label: string}[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<readonly {value: string, label: string}[]>([]);
  
  const [orgSearch, setOrgSearch] = useState('');
  const [appliedOrgSearch, setAppliedOrgSearch] = useState('');
  const [fuzzySearch, setFuzzySearch] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Sponsor; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('...');
  const [urlSynced, setUrlSynced] = useState(false);

  // Column resizing state
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    fav: 50,
    org: 400,
    loc: 250,
    route: 300
  });
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  useEffect(() => {
    if (!resizingCol) return;
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      setColWidths(prev => ({ ...prev, [resizingCol]: Math.max(50, startWidth + delta) }));
    };
    const handleMouseUp = () => setResizingCol(null);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, startX, startWidth]);

  const handleResizeStart = (e: React.MouseEvent, col: string) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingCol(col);
    setStartX(e.clientX);
    setStartWidth(colWidths[col] || 200);
  };

  const requestSort = (key: keyof Sponsor) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const statusRes = await fetch(`./last_updated.json?t=${Date.now()}`).catch(() => null);
        let cacheBuster = '';
        
        if (statusRes && statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.date && statusData.date !== 'Unknown') {
            cacheBuster = `?v=${statusData.date}`;
            const date = new Date(statusData.date);
            if (!isNaN(date.getTime())) {
              const formatted = date.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              });
              setLastUpdated(formatted);
            }
          }
        }

        const sponsorsRes = await fetch(`./sponsors_list.json${cacheBuster}`);
        if (!sponsorsRes.ok) throw new Error('Failed to load sponsors data');

        const rawData: any[] = await sponsorsRes.json();
        const data: Sponsor[] = rawData.map((row, index) => {
          const clean = (val: string | undefined | null) => {
            if (!val) return '';
            return val.trim().toUpperCase() === 'NULL' ? '' : val.trim();
          };
          return {
            id: String(index + 1),
            organisationName: clean(row['Organisation Name']) || 'Unknown',
            townCity: clean(row['Town/City']),
            county: clean(row['County']),
            typeRating: clean(row['Type & Rating']),
            route: clean(row['Route']),
          };
        });
        setSponsors(data);
        setIsDataLoaded(true);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  // URL Sync - Initial Load
  useEffect(() => {
    if (!isDataLoaded) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setOrgSearch(q);
      setAppliedOrgSearch(q);
    }
    
    const parseMulti = (key: string) => {
      const val = params.get(key);
      return val ? val.split(',').map(v => ({ value: v, label: v })) : [];
    };
    
    const towns = parseMulti('towns');
    if (towns.length > 0) setSelectedTownCities(towns);
    
    const counties = parseMulti('counties');
    if (counties.length > 0) setSelectedCounties(counties);
    
    const routes = parseMulti('routes');
    if (routes.length > 0) setSelectedRoutes(routes);

    const ratings = parseMulti('ratings');
    if (ratings.length > 0) setSelectedTypeRatings(ratings);

    if (params.get('favs') === 'true') setShowFavoritesOnly(true);

    setUrlSynced(true);
  }, [isDataLoaded]);

  // URL Sync - Update URL
  useEffect(() => {
    if (!urlSynced) return;
    const params = new URLSearchParams();
    if (appliedOrgSearch) params.set('q', appliedOrgSearch);
    if (selectedTownCities.length > 0) params.set('towns', selectedTownCities.map(t => t.value).join(','));
    if (selectedCounties.length > 0) params.set('counties', selectedCounties.map(t => t.value).join(','));
    if (selectedRoutes.length > 0) params.set('routes', selectedRoutes.map(t => t.value).join(','));
    if (selectedTypeRatings.length > 0) params.set('ratings', selectedTypeRatings.map(t => t.value).join(','));
    if (showFavoritesOnly) params.set('favs', 'true');
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [appliedOrgSearch, selectedTownCities, selectedCounties, selectedRoutes, selectedTypeRatings, showFavoritesOnly, urlSynced]);

  const clearFilters = () => {
    setSelectedOrganisations([]);
    setSelectedTownCities([]);
    setSelectedCounties([]);
    setSelectedTypeRatings([]);
    setSelectedRoutes([]);
    setOrgSearch('');
    setAppliedOrgSearch('');
    setFuzzySearch(false);
    setShowFavoritesOnly(false);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setAppliedOrgSearch(orgSearch);
    setCurrentPage(1);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(id)) newFavs.delete(id);
      else newFavs.add(id);
      localStorage.setItem('sponsorFavorites', JSON.stringify(Array.from(newFavs)));
      return newFavs;
    });
  };

  const exportCSV = (data: Sponsor[], filenamePrefix: string) => {
    const headers = ['Organisation Name', 'Location', 'County', 'Route', 'Rating'];
    const csvRows = data.map(s => [
      `"${s.organisationName.replace(/"/g, '""')}"`,
      `"${s.townCity.replace(/"/g, '""')}"`,
      `"${s.county.replace(/"/g, '""')}"`,
      `"${s.route.replace(/"/g, '""')}"`,
      `"${s.typeRating.replace(/"/g, '""')}"`
    ].join(','));
    const csv = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

    // Try using the File System Access API (modern Chrome)
    if ('showSaveFilePicker' in window) {
      (async () => {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'CSV Files',
              accept: { 'text/csv': ['.csv'] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err: any) {
          // User cancelled the save dialog
          if (err.name !== 'AbortError') {
            console.error('Save failed:', err);
          }
        }
      })();
      return;
    }

    // Fallback for older browsers
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 10000);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Shareable link copied to clipboard!');
  };

  // Generate options for multi-selects
  const townCityOptions = useMemo(() => Array.from(new Set(sponsors.map(s => s.townCity).filter(Boolean))).map(u => ({ value: u, label: u })), [sponsors]);
  const countyOptions = useMemo(() => Array.from(new Set(sponsors.map(s => s.county).filter(Boolean))).map(u => ({ value: u, label: u })), [sponsors]);
  const typeRatingOptions = useMemo(() => Array.from(new Set(sponsors.map(s => s.typeRating).filter(Boolean))).map(u => ({ value: u, label: u })), [sponsors]);
  const routeOptions = useMemo(() => Array.from(new Set(sponsors.map(s => s.route).filter(Boolean))).map(u => ({ value: u, label: u })), [sponsors]);

  const fuse = useMemo(() => new Fuse(sponsors, {
    keys: ['organisationName'],
    threshold: 0.25,
    distance: 100,
    ignoreLocation: true,
    includeScore: true,
  }), [sponsors]);

  const filteredData = useMemo(() => {
    let filtered = sponsors;

    if (showFavoritesOnly) {
      filtered = filtered.filter(s => favorites.has(s.id));
    }

    if (appliedOrgSearch) {
      if (fuzzySearch) {
        const fuseResults = fuse.search(appliedOrgSearch);
        const matchedIds = new Set(fuseResults.map(r => r.item.id));
        filtered = filtered.filter(s => matchedIds.has(s.id));
      } else {
        const lowerSearch = appliedOrgSearch.toLowerCase();
        filtered = filtered.filter(s => s.organisationName.toLowerCase().includes(lowerSearch));
      }
    }

    if (selectedTownCities.length > 0) {
      const selectedValues = selectedTownCities.map(o => o.value.toLowerCase());
      filtered = filtered.filter(s => selectedValues.some(v => s.townCity.toLowerCase().includes(v)));
    }
    if (selectedCounties.length > 0) {
      const selectedValues = selectedCounties.map(o => o.value.toLowerCase());
      filtered = filtered.filter(s => selectedValues.some(v => s.county.toLowerCase().includes(v)));
    }
    if (selectedTypeRatings.length > 0) {
      const selectedValues = selectedTypeRatings.map(o => o.value.toLowerCase());
      filtered = filtered.filter(s => selectedValues.some(v => s.typeRating.toLowerCase().includes(v)));
    }
    if (selectedRoutes.length > 0) {
      const selectedValues = selectedRoutes.map(o => o.value.toLowerCase());
      filtered = filtered.filter(s => selectedValues.some(v => s.route.toLowerCase().includes(v)));
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [sponsors, showFavoritesOnly, favorites, appliedOrgSearch, fuzzySearch, fuse, selectedTownCities, selectedCounties, selectedTypeRatings, selectedRoutes, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalResults = filteredData.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  const townData = useMemo(() => {
    const counts: Record<string, number> = {};
    const originalNames: Record<string, string> = {};
    filteredData.forEach(s => {
      if (s.townCity) {
        const lower = s.townCity.trim().toLowerCase();
        counts[lower] = (counts[lower] || 0) + 1;
        if (!originalNames[lower]) originalNames[lower] = s.townCity.trim();
      }
    });
    return Object.entries(counts).map(([lower, value]) => ({ name: originalNames[lower], value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredData]);

  const routeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(s => {
      if (s.route) counts[s.route] = (counts[s.route] || 0) + 1;
    });
    const sorted = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    
    if (sorted.length > 5) {
      const top5 = sorted.slice(0, 5);
      const otherCount = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
      return [...top5, { name: 'Other', value: otherCount }];
    }
    return sorted;
  }, [filteredData]);

  const countyChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    const originalNames: Record<string, string> = {};
    filteredData.forEach(s => {
      if (s.county) {
        const lower = s.county.trim().toLowerCase();
        counts[lower] = (counts[lower] || 0) + 1;
        if (!originalNames[lower]) originalNames[lower] = s.county.trim();
      }
    });
    return Object.entries(counts).map(([lower, value]) => ({ name: originalNames[lower], value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredData]);

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full text-center">
          <div className="bg-blue-50 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            {error ? <Database className="h-8 w-8 text-red-600 dark:text-red-400" /> : <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {error ? 'Connection Error' : 'Loading Data'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
            {error ? error : 'Fetching the Sponsorlist UK data...'}
          </p>
          {error && (
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                UK Skilled Worker Sponsors
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/50">
                  {totalResults.toLocaleString()} Sponsors
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <Calendar className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                  Last Updated: {lastUpdated}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-all border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button 
              onClick={copyShareLink}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share URL
            </button>
            <button 
              onClick={() => exportCSV(filteredData, 'sponsors_filtered')}
              className="px-3 py-1.5 text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-all flex items-center gap-1.5 border border-green-200 dark:border-green-800/50 shadow-sm active:scale-95"
              title="Export currently filtered results as CSV"
            >
              <FileDown className="h-3.5 w-3.5" />
              Filtered CSV
            </button>
            <button 
              onClick={() => exportCSV(sponsors, 'sponsors_full')}
              className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-all flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/50 shadow-sm active:scale-95"
              title="Export entire dataset as CSV"
            >
              <Download className="h-3.5 w-3.5" />
              Full CSV
            </button>
            <button 
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800/50 shadow-sm active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Prominent Filter Bar */}
        <div className="bg-blue-50/50 dark:bg-slate-800/50 border-t border-blue-100 dark:border-slate-800 shadow-inner transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 dark:bg-blue-500 p-1 rounded">
                  <Filter className="h-3 w-3 text-white" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">Filter & Search</span>
              </div>
              <button
                onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold transition-all shadow-sm ${
                  showFavoritesOnly 
                    ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${showFavoritesOnly ? 'fill-amber-500 text-amber-500' : 'text-slate-400 dark:text-slate-500'}`} />
                {showFavoritesOnly ? 'Showing Favorites' : 'Show Favorites Only'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end">
              <div className="relative lg:col-span-2">
                <div className="flex items-center justify-between mb-1 ml-1">
                  <label className="block text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase">Organisation</label>
                  <button
                    type="button"
                    onClick={() => setFuzzySearch(prev => !prev)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                      fuzzySearch
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700 shadow-sm shadow-violet-200/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-500 dark:hover:text-slate-300'
                    }`}
                  >
                    <Sparkles className={`h-2.5 w-2.5 transition-colors duration-200 ${fuzzySearch ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>Fuzzy</span>
                    <span className={`inline-block w-5 h-3 rounded-full relative transition-colors duration-200 ${
                      fuzzySearch ? 'bg-violet-500 dark:bg-violet-400' : 'bg-slate-300 dark:bg-slate-600'
                    }`}>
                      <span className={`absolute top-0.5 h-2 w-2 rounded-full bg-white shadow transition-all duration-200 ${
                        fuzzySearch ? 'left-2.5' : 'left-0.5'
                      }`} />
                    </span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                    {fuzzySearch
                      ? <Sparkles className="h-3.5 w-3.5 text-violet-400 dark:text-violet-500" />
                      : <Building2 className="h-3.5 w-3.5 text-blue-400 dark:text-blue-500" />}
                  </div>
                  <input
                    type="text"
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    placeholder={fuzzySearch ? 'Fuzzy search name...' : 'Search name...'}
                    className={`block w-full h-[38px] pl-8 pr-3 border rounded-md text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all shadow-sm ${
                      fuzzySearch
                        ? 'border-violet-200 dark:border-violet-800 focus:ring-violet-500 focus:border-violet-500'
                        : 'border-blue-200 dark:border-blue-800 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase mb-1 ml-1">Route</label>
                <FastSelect
                  isMulti
                  isSearchable
                  options={routeOptions}
                  value={selectedRoutes}
                  onChange={(newValue: any) => { setSelectedRoutes(newValue); setCurrentPage(1); }}
                  placeholder="Select route..."
                  className="text-xs"
                  classNamePrefix="select"
                  styles={{
                    control: (base: any) => ({ ...base, minHeight: '38px', height: '38px' }),
                    valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
                    input: (base: any) => ({ ...base, margin: '0', padding: '0' }),
                    indicatorsContainer: (base: any) => ({ ...base, height: '38px' }),
                  }}
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase mb-1 ml-1">Town/City</label>
                <FastSelect
                  isMulti
                  isSearchable
                  options={townCityOptions}
                  value={selectedTownCities}
                  onChange={(newValue: any) => { setSelectedTownCities(newValue); setCurrentPage(1); }}
                  placeholder="Select town..."
                  className="text-xs"
                  classNamePrefix="select"
                  styles={{
                    control: (base: any) => ({ ...base, minHeight: '38px', height: '38px' }),
                    valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
                    input: (base: any) => ({ ...base, margin: '0', padding: '0' }),
                    indicatorsContainer: (base: any) => ({ ...base, height: '38px' }),
                  }}
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase mb-1 ml-1">County</label>
                <FastSelect
                  isMulti
                  isSearchable
                  options={countyOptions}
                  value={selectedCounties}
                  onChange={(newValue: any) => { setSelectedCounties(newValue); setCurrentPage(1); }}
                  placeholder="Select county..."
                  className="text-xs"
                  classNamePrefix="select"
                  styles={{
                    control: (base: any) => ({ ...base, minHeight: '38px', height: '38px' }),
                    valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
                    input: (base: any) => ({ ...base, margin: '0', padding: '0' }),
                    indicatorsContainer: (base: any) => ({ ...base, height: '38px' }),
                  }}
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase mb-1 ml-1">Rating</label>
                <FastSelect
                  isMulti
                  isSearchable
                  options={typeRatingOptions}
                  value={selectedTypeRatings}
                  onChange={(newValue: any) => { setSelectedTypeRatings(newValue); setCurrentPage(1); }}
                  placeholder="Select rating..."
                  className="text-xs"
                  classNamePrefix="select"
                  styles={{
                    control: (base: any) => ({ ...base, minHeight: '38px', height: '38px' }),
                    valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
                    input: (base: any) => ({ ...base, margin: '0', padding: '0' }),
                    indicatorsContainer: (base: any) => ({ ...base, height: '38px' }),
                  }}
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-[10px] font-bold text-transparent uppercase mb-1 ml-1">Action</label>
                <button
                  onClick={applyFilters}
                  className="w-full h-[38px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-bold px-4 rounded-md transition-all shadow-md flex items-center justify-center gap-2 border border-blue-600 dark:border-blue-500 active:scale-95"
                >
                  <Search className="h-3.5 w-3.5" />
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Table Area */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors duration-300">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 table-fixed">
                  <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 transition-colors duration-300">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 text-center text-xs font-bold text-slate-500 dark:text-slate-400 w-12 border-r border-slate-200 dark:border-slate-800">
                        <Star className="h-3.5 w-3.5 mx-auto" />
                      </th>
                      <th 
                        scope="col" 
                        style={{ width: colWidths.org, minWidth: colWidths.org }}
                        className="relative px-4 py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 select-none border-r border-slate-200 dark:border-slate-800 transition-colors"
                      >
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => requestSort('organisationName')}>
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            Organisation
                          </span>
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                        <div onMouseDown={(e) => handleResizeStart(e, 'org')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent z-10" />
                      </th>
                      <th 
                        scope="col" 
                        style={{ width: colWidths.loc, minWidth: colWidths.loc }}
                        className="relative px-4 py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 select-none border-r border-slate-200 dark:border-slate-800 transition-colors"
                      >
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => requestSort('townCity')}>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            Location
                          </span>
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                        <div onMouseDown={(e) => handleResizeStart(e, 'loc')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent z-10" />
                      </th>
                      <th 
                        scope="col" 
                        style={{ width: colWidths.route, minWidth: colWidths.route }}
                        className="relative px-4 py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 select-none transition-colors"
                      >
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => requestSort('route')}>
                          <span className="flex items-center gap-1.5">
                            <RouteIcon className="h-3.5 w-3.5" />
                            Route & Type
                          </span>
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                        <div onMouseDown={(e) => handleResizeStart(e, 'route')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent z-10" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 transition-colors duration-300">
                    {paginatedData.length > 0 ? (
                      paginatedData.map((sponsor) => {
                        const isFav = favorites.has(sponsor.id);
                        return (
                          <tr key={sponsor.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-4 py-2.5 border-r border-slate-50 dark:border-slate-800 text-center">
                              <button 
                                onClick={(e) => toggleFavorite(e, sponsor.id)}
                                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none"
                              >
                                <Star className={`h-4 w-4 ${isFav ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-amber-300 dark:group-hover:text-amber-500'}`} />
                              </button>
                            </td>
                            <td className="px-4 py-2.5 border-r border-slate-50 dark:border-slate-800">
                              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{sponsor.organisationName}</div>
                              <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tight mt-0.5">{sponsor.typeRating}</div>
                            </td>
                            <td className="px-4 py-2.5 border-r border-slate-50 dark:border-slate-800">
                              <div className="text-sm text-slate-700 dark:text-slate-300">{sponsor.townCity}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{sponsor.county}</div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{sponsor.route}</div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-20 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                            <Search className="h-8 w-8 opacity-20" />
                            <p className="text-sm font-medium">No sponsors found matching your active filters.</p>
                            <button onClick={clearFilters} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Clear all filters</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Compact Pagination Footer */}
              <div className="px-4 py-2.5 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 transition-colors duration-300">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Showing <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, totalResults)}</span> of <span className="text-slate-900 dark:text-white">{totalResults.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                  >
                    Prev
                  </button>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 shadow-sm min-w-[110px]">
                    <FastSelect
                      value={{ value: String(currentPage), label: `Page ${currentPage}` }}
                      onChange={(newValue: any) => setCurrentPage(Number(newValue.value))}
                      options={Array.from({ length: totalPages || 1 }, (_, i) => ({
                        value: String(i + 1),
                        label: `Page ${i + 1}`
                      }))}
                      maxOptions={totalPages || 1}
                      isSearchable={false}
                      menuPlacement="top"
                      maxMenuHeight={160}
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '24px',
                          height: '24px',
                          border: 'none',
                          boxShadow: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                        }),
                        valueContainer: (base) => ({ ...base, padding: '0 4px' }),
                        singleValue: (base) => ({
                          ...base,
                          fontSize: '11px',
                          fontWeight: '700',
                          color: isDarkMode ? '#e2e8f0' : '#334155',
                        }),
                        indicatorsContainer: (base) => ({ ...base, height: '24px' }),
                        dropdownIndicator: (base) => ({ ...base, padding: '2px', color: '#94a3b8' }),
                        indicatorSeparator: () => ({ display: 'none' }),
                        menu: (base) => ({ ...base, fontSize: '11px', width: '100px', backgroundColor: isDarkMode ? '#1e293b' : 'white' }),
                        option: (base, state) => ({
                          ...base,
                          padding: '4px 8px',
                          backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? (isDarkMode ? '#334155' : '#eff6ff') : (isDarkMode ? '#1e293b' : 'white'),
                          color: state.isSelected ? 'white' : (isDarkMode ? '#e2e8f0' : '#334155'),
                          cursor: 'pointer',
                        }),
                      }}
                    />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-700 pl-1.5 ml-0.5 whitespace-nowrap pr-1">
                      of {totalPages || 1}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Charts */}
          <aside className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 h-[260px] flex flex-col shadow-sm transition-colors duration-300">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Top 10 Towns
              </h3>
              {townData.length > 0 ? (
                <div className="flex-1 min-h-0 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={townData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9, fill: isDarkMode ? '#94a3b8' : '#64748b'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{fill: isDarkMode ? '#1e293b' : '#f8fafc'}}
                        contentStyle={{borderRadius: '6px', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, fontSize: '10px', backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#000000'}}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 2, 2, 0]} barSize={12}>
                        {townData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs italic">No data available</div>
              )}
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 h-[260px] flex flex-col shadow-sm transition-colors duration-300">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Top Counties
              </h3>
              {countyChartData.length > 0 ? (
                <div className="flex-1 min-h-0 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={countyChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9, fill: isDarkMode ? '#94a3b8' : '#64748b'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{fill: isDarkMode ? '#1e293b' : '#f8fafc'}}
                        contentStyle={{borderRadius: '6px', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, fontSize: '10px', backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#000000'}}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 2, 2, 0]} barSize={12}>
                        {countyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs italic">No data available</div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 h-[350px] flex flex-col shadow-sm transition-colors duration-300">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <RouteIcon className="h-3 w-3" /> Route Distribution
              </h3>
              {routeData.length > 0 ? (
                <div className="flex-1 min-h-0 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={routeData}
                        cx="50%"
                        cy="40%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        stroke={isDarkMode ? '#0f172a' : '#ffffff'}
                        strokeWidth={2}
                      >
                        {routeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{borderRadius: '6px', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, fontSize: '10px', backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#000000'}}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        iconType="circle" 
                        wrapperStyle={{fontSize: '9px', paddingTop: '8px', color: isDarkMode ? '#e2e8f0' : '#000000'}} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs italic">No data available</div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
