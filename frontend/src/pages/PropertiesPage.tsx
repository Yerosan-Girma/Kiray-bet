import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { houseService } from '../services/house.service';
import PropertyCard from '../components/property/PropertyCard';
import type { HouseFilters } from '../types';

const PROPERTY_TYPES = ['apartment', 'house', 'condo', 'studio', 'villa', 'townhouse'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'views', label: 'Most Viewed' },
];

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = { current: 0 };
  const debounce = useCallback((v: T) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setDebounced(v), delay);
  }, [delay]);
  // Simple immediate debounce via controlled state
  return debounced;
}

export default function PropertiesPage() {
  const [filters, setFilters] = useState<HouseFilters>({ sort: 'newest', page: 1, limit: 12 });
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const queryFilters = { ...filters, search: search || undefined, page };

  const { data, isLoading } = useQuery({
    queryKey: ['houses', queryFilters],
    queryFn: () => houseService.getHouses(queryFilters),
    staleTime: 30_000,
  });

  const houses = data?.data || [];
  const pagination = data?.pagination;

  const updateFilter = (key: keyof HouseFilters, value: any) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ sort: 'newest', page: 1, limit: 12 });
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = !!(filters.minPrice || filters.maxPrice || filters.bedrooms ||
    filters.bathrooms || filters.propertyType || filters.city || search);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground" style={{ fontFamily: 'Urbanist, sans-serif' }}>
            All Properties
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination ? `${pagination.total.toLocaleString()} properties found` : 'Loading...'}
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, location..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 bg-background text-sm"
            />
          </div>

          <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}
            className="px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-amber-500 bg-background text-sm font-medium text-foreground">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-colors ${
              showFilters || hasActiveFilters ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-border text-foreground'
            }`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters {hasActiveFilters && <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">!</span>}
          </button>

          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 rounded-2xl border-2 border-border bg-background grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">City</label>
              <input type="text" placeholder="e.g. Nairobi"
                value={filters.city || ''}
                onChange={(e) => updateFilter('city', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Property Type</label>
              <select value={filters.propertyType || ''}
                onChange={(e) => updateFilter('propertyType', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-amber-500 bg-background">
                <option value="">Any Type</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Min Price (ETB)</label>
              <input type="number" placeholder="0"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Max Price (ETB)</label>
              <input type="number" placeholder="Any"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Bedrooms</label>
              <select value={filters.bedrooms || ''}
                onChange={(e) => updateFilter('bedrooms', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-amber-500 bg-background">
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Bathrooms</label>
              <select value={filters.bathrooms || ''}
                onChange={(e) => updateFilter('bathrooms', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-amber-500 bg-background">
                <option value="">Any</option>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!filters.isPremium}
                  onChange={(e) => updateFilter('isPremium', e.target.checked || undefined)}
                  className="w-4 h-4 rounded text-amber-500" />
                <span className="text-sm font-medium text-foreground">Premium only</span>
              </label>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-muted animate-pulse h-80" />
            ))}
          </div>
        ) : houses.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-foreground text-lg mb-2">No properties found</h3>
            <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters</p>
            <button onClick={clearFilters}
              className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #E8B84B, #C9922A)' }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {houses.map((h: any, i: number) => (
                <PropertyCard key={h._id} house={h} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-xl border-2 border-border text-sm font-medium disabled:opacity-40 hover:border-amber-500 transition-colors">
                  Previous
                </button>
                {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                      p === page
                        ? 'text-[#070C17]'
                        : 'border-2 border-border text-foreground hover:border-amber-500'
                    }`}
                    style={p === page ? { background: 'linear-gradient(135deg, #E8B84B, #C9922A)' } : {}}>
                    {p}
                  </button>
                ))}
                <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl border-2 border-border text-sm font-medium disabled:opacity-40 hover:border-amber-500 transition-colors">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
