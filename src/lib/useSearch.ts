"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Types
export interface SearchSuggestion {
  type: "product" | "category" | "craftType" | "artist" | "keyword" | "trending" | "personalized";
  text: string;
  count?: number;
  productId?: string;
  thumbnailUrl?: string;
  price?: number;
  reason?: string; // Why this suggestion is shown
  rating?: number;
  reviewCount?: number;
}

export interface SearchResult {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  artistName: string;
  images: string[];
  thumbnailUrl: string;
  averageRating: number;
  totalReviews: number;
  craftType?: string;
  barangay?: string;
  stock: number;
  isAvailable: boolean;
  relevanceScore: number;
  matchType: "exact" | "partial" | "fuzzy" | "synonym";
  highlights?: {
    name?: string;
    description?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  suggestions: string[];
  totalResults: number;
  page: number;
  totalPages: number;
  searchTime: number;
  query: string;
  didYouMean?: string;
  categories: { name: string; count: number }[];
}

export interface SearchFilters {
  category?: string;
  craftType?: string;
  minPrice?: number;
  maxPrice?: number;
  barangay?: string;
}

export interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  suggestionsLimit?: number;
  resultsLimit?: number;
  autoSearch?: boolean;
}

const DEFAULT_OPTIONS: UseSearchOptions = {
  debounceMs: 300,
  minQueryLength: 2,
  suggestionsLimit: 10,
  resultsLimit: 20,
  autoSearch: true,
};

export function useSearch(options: UseSearchOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [page, setPage] = useState(1);

  // Refs for debouncing
  const suggestionsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get personalization data from localStorage
  const getPersonalizationParams = useCallback(() => {
    const params = new URLSearchParams();
    
    try {
      // Recent product views
      const recentViews = localStorage.getItem("recentProductViews");
      if (recentViews) {
        const views = JSON.parse(recentViews).slice(0, 5);
        if (views.length > 0) {
          params.append("recentViews", views.join(","));
        }
      }
      
      // Recent searches
      const recentSearches = localStorage.getItem("recentSearches");
      if (recentSearches) {
        const searches = JSON.parse(recentSearches).slice(0, 5);
        if (searches.length > 0) {
          params.append("recentSearches", searches.join(","));
        }
      }
      
      // User interests (categories they've browsed)
      const interests = localStorage.getItem("userInterests");
      if (interests) {
        const interestList = JSON.parse(interests).slice(0, 5);
        if (interestList.length > 0) {
          params.append("interests", interestList.join(","));
        }
      }
    } catch (e) {
      console.error("Error reading personalization data:", e);
    }
    
    return params.toString();
  }, []);

  // Fetch suggestions (works with or without query)
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    setIsLoadingSuggestions(true);
    setError(null);

    try {
      const personalizationParams = getPersonalizationParams();
      const baseParams = `limit=${opts.suggestionsLimit}`;
      const queryParam = searchQuery.length >= opts.minQueryLength! 
        ? `q=${encodeURIComponent(searchQuery)}&` 
        : "";
      
      const url = `/api/search/suggestions?${queryParam}${baseParams}${personalizationParams ? `&${personalizationParams}` : ""}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setSuggestions(data.data.suggestions || []);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [opts.minQueryLength, opts.suggestionsLimit, getPersonalizationParams]);

  // Perform search
  const search = useCallback(async (
    searchQuery: string,
    searchFilters: SearchFilters = filters,
    searchPage: number = 1,
    searchSortBy: string = sortBy
  ) => {
    if (searchQuery.length < opts.minQueryLength!) {
      setResults([]);
      setSearchResponse(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: opts.resultsLimit!.toString(),
        page: searchPage.toString(),
        sortBy: searchSortBy,
      });

      if (searchFilters.category) params.append("category", searchFilters.category);
      if (searchFilters.craftType) params.append("craftType", searchFilters.craftType);
      if (searchFilters.minPrice !== undefined) params.append("minPrice", searchFilters.minPrice.toString());
      if (searchFilters.maxPrice !== undefined) params.append("maxPrice", searchFilters.maxPrice.toString());
      if (searchFilters.barangay) params.append("barangay", searchFilters.barangay);

      const response = await fetch(`/api/search?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });
      const data = await response.json();

      if (data.success) {
        setResults(data.data.results || []);
        setSearchResponse(data.data);
        setPage(searchPage);
      } else {
        setError(data.message || "Search failed");
        setResults([]);
        setSearchResponse(null);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was cancelled, ignore
        return;
      }
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
      setResults([]);
      setSearchResponse(null);
    } finally {
      setIsSearching(false);
    }
  }, [filters, sortBy, opts.minQueryLength, opts.resultsLimit]);

  // Handle query change with debouncing
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);

    // Clear previous timers
    if (suggestionsTimerRef.current) {
      clearTimeout(suggestionsTimerRef.current);
    }
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (newQuery.length < opts.minQueryLength!) {
      setSuggestions([]);
      if (newQuery.length === 0) {
        setResults([]);
        setSearchResponse(null);
      }
      return;
    }

    // Debounce suggestions
    suggestionsTimerRef.current = setTimeout(() => {
      fetchSuggestions(newQuery);
    }, opts.debounceMs! / 2);

    // Debounce search (if auto-search enabled)
    if (opts.autoSearch) {
      searchTimerRef.current = setTimeout(() => {
        search(newQuery);
      }, opts.debounceMs!);
    }
  }, [fetchSuggestions, search, opts.minQueryLength, opts.debounceMs, opts.autoSearch]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (query.length >= opts.minQueryLength!) {
      search(query, newFilters, 1, sortBy);
    }
  }, [query, search, sortBy, opts.minQueryLength]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
    if (query.length >= opts.minQueryLength!) {
      search(query, filters, 1, newSortBy);
    }
  }, [query, filters, search, opts.minQueryLength]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    if (query.length >= opts.minQueryLength!) {
      search(query, filters, newPage, sortBy);
    }
  }, [query, filters, sortBy, search, opts.minQueryLength]);

  // Manual search trigger
  const triggerSearch = useCallback(() => {
    if (query.length >= opts.minQueryLength!) {
      search(query, filters, 1, sortBy);
    }
  }, [query, filters, sortBy, search, opts.minQueryLength]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setResults([]);
    setSearchResponse(null);
    setError(null);
    setPage(1);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (suggestionsTimerRef.current) {
        clearTimeout(suggestionsTimerRef.current);
      }
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    query,
    suggestions,
    results,
    isLoadingSuggestions,
    isSearching,
    error,
    searchResponse,
    filters,
    sortBy,
    page,

    // Actions
    setQuery: handleQueryChange,
    setFilters: handleFilterChange,
    setSortBy: handleSortChange,
    setPage: handlePageChange,
    search: triggerSearch,
    clearSearch,

    // Computed
    hasResults: results.length > 0,
    hasSuggestions: suggestions.length > 0,
    totalResults: searchResponse?.totalResults || 0,
    totalPages: searchResponse?.totalPages || 0,
    searchTime: searchResponse?.searchTime || 0,
    didYouMean: searchResponse?.didYouMean,
    categoryDistribution: searchResponse?.categories || [],
  };
}

export default useSearch;
