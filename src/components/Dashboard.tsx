import React, { useState, useMemo, useEffect, useRef } from 'react';
import FastSelect from './FastSelect';
import { Sponsor } from '../data';
import { Search, Filter, MapPin, Building2, Briefcase, Star, Route as RouteIcon, Calendar, ArrowUpDown, Database, Loader2, Download, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function Dashboard() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [selectedOrganisations, setSelectedOrganisations] = useState<readonly {value: string, label: string}[]>([]);
  const [selectedTownCities, setSelectedTownCities] = useState<readonly {value: string, label: string}[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<readonly {value: string, label: string}[]>([]);
  const [selectedTypeRatings, setSelectedTypeRatings] = useState<readonly {value: string, label: string}[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<readonly {value: string, label: string}[]>([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [appliedOrgSearch, setAppliedOrgSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Sponsor; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCharts, setShowCharts] = useState(false);
  const itemsPerPage = 10;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Column resizing state
  const [colWidths, setColWidths] = useState<Record<string, number>>({
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
        const response = await fetch('./sponsors_list.json');
        if (!response.ok) {
          throw new Error('Failed to load sponsors data');
        }
        const rawData: any[] = await response.json();
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

  const clearFilters = () => {
    setSelectedOrganisations([]);
    setSelectedTownCities([]);
    setSelectedCounties([]);
    setSelectedTypeRatings([]);
    setSelectedRoutes([]);
    setOrgSearch('');
    setAppliedOrgSearch('');
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setAppliedOrgSearch(orgSearch);
    setCurrentPage(1);
  };

  // Generate options for multi-selects
  const orgOptions = useMemo(() => {
    const unique = Array.from(new Set(sponsors.map(s => s.organisationName).filter(Boolean)));
    return unique.map(u => ({ value: u, label: u }));
  }, [sponsors]);

  const townCityOptions = useMemo(() => {
    const unique = Array.from(new Set(sponsors.map(s => s.townCity).filter(Boolean)));
    return unique.map(u => ({ value: u, label: u }));
  }, [sponsors]);

  const countyOptions = useMemo(() => {
    const unique = Array.from(new Set(sponsors.map(s => s.county).filter(Boolean)));
    return unique.map(u => ({ value: u, label: u }));
  }, [sponsors]);

  const typeRatingOptions = useMemo(() => {
    const unique = Array.from(new Set(sponsors.map(s => s.typeRating).filter(Boolean)));
    return unique.map(u => ({ value: u, label: u }));
  }, [sponsors]);

  const routeOptions = useMemo(() => {
    const unique = Array.from(new Set(sponsors.map(s => s.route).filter(Boolean)));
    return unique.map(u => ({ value: u, label: u }));
  }, [sponsors]);

  // Client-side filtering and sorting
  const filteredData = useMemo(() => {
    let filtered = sponsors;

    if (appliedOrgSearch) {
      const lowerSearch = appliedOrgSearch.toLowerCase();
      filtered = filtered.filter(s => 
        s.organisationName.toLowerCase().includes(lowerSearch)
      );
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
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [sponsors, appliedOrgSearch, selectedTownCities, selectedCounties, selectedTypeRatings, selectedRoutes, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalResults = filteredData.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  // Chart Data Preparation
  const townData = useMemo(() => {
    const counts: Record<string, number> = {};
    const originalNames: Record<string, string> = {};
    filteredData.forEach(s => {
      if (s.townCity) {
        const lower = s.townCity.trim().toLowerCase();
        counts[lower] = (counts[lower] || 0) + 1;
        if (!originalNames[lower]) {
          originalNames[lower] = s.townCity.trim();
        }
      }
    });
    return Object.entries(counts).map(([lower, value]) => ({ name: originalNames[lower], value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredData]);

  const routeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(s => {
      if (s.route) {
        counts[s.route] = (counts[s.route] || 0) + 1;
      }
    });
    const sorted = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    
    if (sorted.length > 5) {
      const top5 = sorted.slice(0, 5);
      const otherCount = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
      return [...top5, { name: 'Other', value: otherCount }];
    }
    return sorted;
  }, [filteredData]);

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            {error ? <Database className="h-8 w-8 text-red-600" /> : <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {error ? 'Connection Error' : 'Loading Data'}
          </h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                UK Skilled Worker Sponsors
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  {totalResults.toLocaleString()} Sponsors
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <Calendar className="h-3 w-3 text-blue-500" />
                  Last Updated: April 4, 2026
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-all flex items-center gap-1.5 border border-blue-200 shadow-sm active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Prominent Filter Bar */}
        <div className="bg-blue-50/50 border-t border-blue-100 shadow-inner">
          <div className="max-w-[1600px] mx-auto px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-600 p-1 rounded">
                <Filter className="h-3 w-3 text-white" />
              </div>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Filter & Search</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-start">
              <div className="relative">
                <label className="block text-[10px] font-bold text-blue-600/70 uppercase mb-1 ml-1">Organisation</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none z-10">
                    <Building2 className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    placeholder="Search name..."
                    className="block w-full pl-8 pr-3 py-[7px] border border-blue-200 rounded-md text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-blue-600/70 uppercase mb-1 ml-1">Route</label>
                <FastSelect
                  isMulti
                  isSearchable
                  options={routeOptions}
                  value={selectedRoutes}
                  onChange={(newValue: any) => { setSelectedRoutes(newValue); setCurrentPage(1); }}
                  placeholder="Select route..."
                  className="text-xs"
                  classNamePrefix="select"
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-blue-600/70 uppercase mb-1 ml-1">Town/City</label>
                <FastSelect
                  isMulti
                  isSearchable
                  options={townCityOptions}
                  value={selectedTownCities}
                  onChange={(newValue: any) => { setSelectedTownCities(newValue); setCurrentPage(1); }}
                  placeholder="Select town..."
                  className="text-xs"
                  classNamePrefix="select"
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-blue-600/70 uppercase mb-1 ml-1">County</label>
                <FastSelect
                  isMulti
                  isSearchable
                  options={countyOptions}
                  value={selectedCounties}
                  onChange={(newValue: any) => { setSelectedCounties(newValue); setCurrentPage(1); }}
                  placeholder="Select county..."
                  className="text-xs"
                  classNamePrefix="select"
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-bold text-blue-600/70 uppercase mb-1 ml-1">Rating</label>
                <FastSelect
                  isMulti
                  isSearchable
                  options={typeRatingOptions}
                  value={selectedTypeRatings}
                  onChange={(newValue: any) => { setSelectedTypeRatings(newValue); setCurrentPage(1); }}
                  placeholder="Select rating..."
                  className="text-xs"
                  classNamePrefix="select"
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-[10px] font-bold text-transparent uppercase mb-1 ml-1">Action</label>
                <button
                  onClick={applyFilters}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-[7px] px-4 rounded-md transition-all shadow-md flex items-center justify-center gap-2 border border-blue-600 active:scale-95"
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          {/* Main Table Area */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-slate-200 table-fixed">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th 
                        scope="col" 
                        style={{ width: colWidths.org, minWidth: colWidths.org }}
                        className="relative px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-100 select-none border-r border-slate-200"
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
                        className="relative px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-100 select-none border-r border-slate-200"
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
                        className="relative px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-100 select-none"
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
                  <tbody className="bg-white divide-y divide-slate-100">
                    {paginatedData.length > 0 ? (
                      paginatedData.map((sponsor) => (
                        <tr key={sponsor.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-4 py-2.5 border-r border-slate-50">
                            <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{sponsor.organisationName}</div>
                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">{sponsor.typeRating}</div>
                          </td>
                          <td className="px-4 py-2.5 border-r border-slate-50">
                            <div className="text-sm text-slate-700">{sponsor.townCity}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{sponsor.county}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="text-sm text-slate-600 font-medium">{sponsor.route}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-20 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Search className="h-8 w-8 opacity-20" />
                            <p className="text-sm font-medium">No sponsors found matching your active filters.</p>
                            <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">Clear all filters</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Compact Pagination Footer */}
              <div className="px-4 py-2.5 flex items-center justify-between border-t border-slate-200 bg-slate-50/80">
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Showing <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, totalResults)}</span> of <span className="text-slate-900">{totalResults.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 border border-slate-300 bg-white rounded text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                  >
                    Prev
                  </button>
                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-1 py-0.5 shadow-sm min-w-[110px]">
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
                      maxMenuHeight={160} // Approximately 5 items (32px each)
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
                        valueContainer: (base) => ({
                          ...base,
                          padding: '0 4px',
                        }),
                        singleValue: (base) => ({
                          ...base,
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#334155',
                        }),
                        indicatorsContainer: (base) => ({
                          ...base,
                          height: '24px',
                        }),
                        dropdownIndicator: (base) => ({
                          ...base,
                          padding: '2px',
                          color: '#94a3b8',
                        }),
                        indicatorSeparator: () => ({
                          display: 'none',
                        }),
                        menu: (base) => ({
                          ...base,
                          fontSize: '11px',
                          width: '100px',
                        }),
                        option: (base, state) => ({
                          ...base,
                          padding: '4px 8px',
                          backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
                          color: state.isSelected ? 'white' : '#334155',
                          cursor: 'pointer',
                        }),
                      }}
                    />
                    <span className="text-[10px] font-bold text-slate-400 border-l border-slate-200 pl-1.5 ml-0.5 whitespace-nowrap pr-1">
                      of {totalPages || 1}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-2.5 py-1 border border-slate-300 bg-white rounded text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Charts */}
          <aside className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 h-[350px] flex flex-col shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Top 10 Towns
              </h3>
              {townData.length > 0 ? (
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={townData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '10px'}}
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
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">No data available</div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 h-[350px] flex flex-col shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <RouteIcon className="h-3 w-3" /> Route Distribution
              </h3>
              {routeData.length > 0 ? (
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={routeData}
                        cx="50%"
                        cy="45%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {routeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '10px'}}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        iconType="circle" 
                        wrapperStyle={{fontSize: '9px', paddingTop: '10px'}} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">No data available</div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
