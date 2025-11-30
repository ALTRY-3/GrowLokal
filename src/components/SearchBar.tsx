"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaSearch, FaTimes, FaSpinner, FaHistory, FaTag, FaUser, FaStore, FaLightbulb, FaFire, FaStar, FaHeart } from "react-icons/fa";
import { useSearch, SearchSuggestion } from "@/lib/useSearch";
import styles from "./SearchBar.module.css";

// Default placeholder suggestions for new users
const DEFAULT_PLACEHOLDERS = [
  "Try 'handwoven basket'",
  "Search for 'pottery'",
  "Discover 'embroidered bags'",
  "Find 'wooden crafts'",
  "Explore 'local jewelry'",
  "Look for 'woven textiles'",
];

interface SearchBarProps {
  onSearch?: (query: string, results: any[]) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({
  onSearch,
  onSuggestionSelect,
  onClear,
  placeholder = "Search for products, artisans, or categories...",
  className = "",
  showSuggestions = true,
  autoFocus = false,
}: SearchBarProps) {
  const {
    query,
    suggestions,
    results,
    isLoadingSuggestions,
    isSearching,
    setQuery,
    clearSearch,
    didYouMean,
    search,
    searchTime,
    totalResults,
  } = useSearch({
    debounceMs: 200, // Faster response
    minQueryLength: 1, // Start suggesting earlier
    suggestionsLimit: 10,
    autoSearch: true,
  });

  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState(placeholder);
  const [placeholderSuggestions, setPlaceholderSuggestions] = useState<string[]>([]);
  const [isTypingPlaceholder, setIsTypingPlaceholder] = useState(false);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const placeholderIndexRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch personalized placeholder suggestions
  useEffect(() => {
    const fetchPlaceholderSuggestions = async () => {
      try {
        // Get personalization data
        const recentViews = JSON.parse(localStorage.getItem("recentProductViews") || "[]").slice(0, 5);
        const recentSearchTerms = JSON.parse(localStorage.getItem("recentSearches") || "[]").slice(0, 5);
        const interests = JSON.parse(localStorage.getItem("userInterests") || "[]").slice(0, 5);

        const params = new URLSearchParams();
        if (recentViews.length > 0) params.append("recentViews", recentViews.join(","));
        if (recentSearchTerms.length > 0) params.append("recentSearches", recentSearchTerms.join(","));
        if (interests.length > 0) params.append("interests", interests.join(","));
        params.append("limit", "8");
        params.append("forPlaceholder", "true");

        const response = await fetch(`/api/search/suggestions?${params.toString()}`);
        const data = await response.json();

        if (data.success && data.data.suggestions?.length > 0) {
          // Extract product names and create placeholder suggestions
          const productNames = data.data.suggestions
            .filter((s: SearchSuggestion) => s.type === "product" || s.type === "trending" || s.type === "personalized")
            .map((s: SearchSuggestion) => s.text)
            .slice(0, 6);

          if (productNames.length > 0) {
            const placeholders = productNames.map((name: string) => `Try "${name}"`);
            // Mix with some category/craft type suggestions
            const otherSuggestions = data.data.suggestions
              .filter((s: SearchSuggestion) => s.type === "category" || s.type === "craftType")
              .map((s: SearchSuggestion) => `Explore ${s.text}`)
              .slice(0, 2);
            
            setPlaceholderSuggestions([...placeholders, ...otherSuggestions]);
          } else {
            setPlaceholderSuggestions(DEFAULT_PLACEHOLDERS);
          }
        } else {
          setPlaceholderSuggestions(DEFAULT_PLACEHOLDERS);
        }
      } catch (e) {
        console.error("Error fetching placeholder suggestions:", e);
        setPlaceholderSuggestions(DEFAULT_PLACEHOLDERS);
      }
    };

    fetchPlaceholderSuggestions();
    
    // Refresh placeholders periodically (every 5 minutes)
    const refreshInterval = setInterval(fetchPlaceholderSuggestions, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Typewriter effect for placeholder
  useEffect(() => {
    if (placeholderSuggestions.length === 0 || isFocused || query.length > 0) {
      setDisplayedPlaceholder(placeholder);
      return;
    }

    let currentIndex = placeholderIndexRef.current;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const currentText = placeholderSuggestions[currentIndex];
    
    const typeEffect = () => {
      if (!currentText) return;

      if (!isDeleting) {
        // Typing
        setDisplayedPlaceholder(currentText.slice(0, charIndex + 1));
        charIndex++;

        if (charIndex === currentText.length) {
          // Pause at full text
          timeoutId = setTimeout(() => {
            isDeleting = true;
            typeEffect();
          }, 2500);
          return;
        }
        timeoutId = setTimeout(typeEffect, 80);
      } else {
        // Deleting
        setDisplayedPlaceholder(currentText.slice(0, charIndex));
        charIndex--;

        if (charIndex === 0) {
          // Move to next suggestion
          isDeleting = false;
          currentIndex = (currentIndex + 1) % placeholderSuggestions.length;
          placeholderIndexRef.current = currentIndex;
          timeoutId = setTimeout(typeEffect, 500);
          return;
        }
        timeoutId = setTimeout(typeEffect, 40);
      }
    };

    timeoutId = setTimeout(typeEffect, 1000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [placeholderSuggestions, isFocused, query, placeholder]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error("Error loading recent searches:", e);
      }
    }
  }, []);

  // Fetch personalized suggestions when focused with empty query
  useEffect(() => {
    if (isFocused && query.length === 0 && !hasFetchedInitial) {
      setHasFetchedInitial(true);
      // Trigger a fetch for personalized suggestions
      setQuery("");
    }
  }, [isFocused, query, hasFetchedInitial, setQuery]);

  // Track product views for personalization
  const trackProductView = useCallback((productId: string) => {
    try {
      const views = JSON.parse(localStorage.getItem("recentProductViews") || "[]");
      const updated = [productId, ...views.filter((id: string) => id !== productId)].slice(0, 10);
      localStorage.setItem("recentProductViews", JSON.stringify(updated));
    } catch (e) {
      console.error("Error tracking product view:", e);
    }
  }, []);

  // Save search to recent
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setRecentSearches((prev) => {
      const updated = [searchQuery, ...prev.filter((s) => s !== searchQuery)].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    saveRecentSearch(suggestion.text);
    setIsFocused(false);
    
    // Track product view for personalization
    if (suggestion.productId) {
      trackProductView(suggestion.productId);
    }
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  // Handle recent search click
  const handleRecentClick = (searchText: string) => {
    setQuery(searchText);
    setIsFocused(false);
    search();
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      search();
      setIsFocused(false);
      
      if (onSearch) {
        onSearch(query, results);
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = suggestions.length > 0 ? suggestions : recentSearches.map((s) => ({ text: s } as SearchSuggestion));
    const itemCount = items.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : itemCount - 1));
        break;
      case "Enter":
        if (selectedIndex >= 0 && selectedIndex < itemCount) {
          e.preventDefault();
          const selected = items[selectedIndex];
          handleSuggestionClick(selected);
        }
        break;
      case "Escape":
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Use ref for onSearch to avoid dependency issues
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Notify parent of search results - only when results actually change
  const prevResultsRef = useRef<typeof results>([]);
  useEffect(() => {
    // Only call if results actually changed (by comparing IDs)
    const prevIds = prevResultsRef.current.map(r => r._id).join(',');
    const currIds = results.map(r => r._id).join(',');
    
    if (onSearchRef.current && results.length > 0 && prevIds !== currIds) {
      prevResultsRef.current = results;
      onSearchRef.current(query, results);
    }
  }, [results, query]);

  // Get icon for suggestion type
  const getSuggestionIcon = (type: SearchSuggestion["type"], reason?: string) => {
    switch (type) {
      case "product":
        return <FaStore className={styles.suggestionIcon} />;
      case "trending":
        return <FaFire className={`${styles.suggestionIcon} ${styles.trendingIcon}`} />;
      case "personalized":
        return <FaHeart className={`${styles.suggestionIcon} ${styles.personalizedIcon}`} />;
      case "category":
        return <FaTag className={styles.suggestionIcon} />;
      case "artist":
        return <FaUser className={styles.suggestionIcon} />;
      case "craftType":
        return <FaLightbulb className={styles.suggestionIcon} />;
      default:
        return <FaSearch className={styles.suggestionIcon} />;
    }
  };

  // Show dropdown when focused and has content to show
  const showDropdown = isFocused && showSuggestions && (
    suggestions.length > 0 || 
    (query.length === 0 && recentSearches.length > 0) ||
    didYouMean ||
    isLoadingSuggestions
  );

  // Group suggestions by type for better organization
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const group = suggestion.type === "trending" || suggestion.type === "personalized" 
      ? "forYou" 
      : suggestion.type === "product" 
        ? "products" 
        : "explore";
    if (!acc[group]) acc[group] = [];
    acc[group].push(suggestion);
    return acc;
  }, {} as Record<string, SearchSuggestion[]>);

  return (
    <div className={`${styles.searchContainer} ${className}`}>
      <form onSubmit={handleSubmit} className={styles.searchForm}>
        <div className={`${styles.searchInputWrapper} ${isFocused ? styles.focused : ""}`}>
          <FaSearch className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={displayedPlaceholder || placeholder}
            className={`${styles.searchInput} ${!isFocused && query.length === 0 ? styles.animatedPlaceholder : ""}`}
            autoFocus={autoFocus}
            autoComplete="off"
          />
          {isLoadingSuggestions || isSearching ? (
            <FaSpinner className={`${styles.clearIcon} ${styles.spinning}`} />
          ) : query.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                clearSearch();
                if (onClear) {
                  onClear();
                }
                inputRef.current?.focus();
              }}
              className={styles.clearButton}
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          ) : null}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div ref={suggestionsRef} className={styles.suggestionsDropdown}>
          {/* Did you mean suggestion */}
          {didYouMean && (
            <div className={styles.didYouMean}>
              <span>Did you mean: </span>
              <button
                onClick={() => {
                  setQuery(didYouMean);
                  search();
                }}
                className={styles.didYouMeanLink}
              >
                {didYouMean}
              </button>
            </div>
          )}

          {/* Recent searches (when no query and no suggestions) */}
          {query.length === 0 && recentSearches.length > 0 && suggestions.length === 0 && (
            <div className={styles.recentSection}>
              <div className={styles.recentHeader}>
                <span><FaHistory style={{ marginRight: "6px" }} />Recent Searches</span>
                <button onClick={clearRecentSearches} className={styles.clearRecent}>
                  Clear
                </button>
              </div>
              {recentSearches.map((recentQuery, index) => (
                <div
                  key={recentQuery}
                  className={`${styles.suggestionItem} ${selectedIndex === index ? styles.selected : ""}`}
                  onClick={() => handleRecentClick(recentQuery)}
                >
                  <FaHistory className={styles.suggestionIcon} />
                  <span className={styles.suggestionText}>{recentQuery}</span>
                </div>
              ))}
            </div>
          )}

          {/* For You Section - Trending & Personalized */}
          {groupedSuggestions.forYou && groupedSuggestions.forYou.length > 0 && (
            <div className={styles.suggestionsSection}>
              <div className={styles.sectionHeader}>
                <FaFire className={styles.sectionIcon} />
                <span>For You</span>
              </div>
              {groupedSuggestions.forYou.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${suggestion.text}`}
                  className={`${styles.suggestionItem} ${selectedIndex === index ? styles.selected : ""}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.thumbnailUrl ? (
                    <img
                      src={suggestion.thumbnailUrl}
                      alt=""
                      className={styles.suggestionThumbnail}
                    />
                  ) : (
                    getSuggestionIcon(suggestion.type, suggestion.reason)
                  )}
                  <div className={styles.suggestionContent}>
                    <span className={styles.suggestionText}>{suggestion.text}</span>
                    <span className={styles.suggestionMeta}>
                      {suggestion.price && (
                        <span className={styles.price}>₱{suggestion.price.toFixed(2)}</span>
                      )}
                      {suggestion.rating && suggestion.rating > 0 && (
                        <span className={styles.rating}>
                          <FaStar className={styles.starIcon} />
                          {suggestion.rating.toFixed(1)}
                        </span>
                      )}
                      {suggestion.reason && (
                        <span className={styles.reason}>{suggestion.reason}</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Products Section */}
          {groupedSuggestions.products && groupedSuggestions.products.length > 0 && (
            <div className={styles.suggestionsSection}>
              {query.length > 0 && (
                <div className={styles.sectionHeader}>
                  <FaStore className={styles.sectionIcon} />
                  <span>Products</span>
                </div>
              )}
              {groupedSuggestions.products.map((suggestion, index) => {
                const actualIndex = (groupedSuggestions.forYou?.length || 0) + index;
                return (
                  <div
                    key={`${suggestion.type}-${suggestion.text}`}
                    className={`${styles.suggestionItem} ${selectedIndex === actualIndex ? styles.selected : ""}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.thumbnailUrl ? (
                      <img
                        src={suggestion.thumbnailUrl}
                        alt=""
                        className={styles.suggestionThumbnail}
                      />
                    ) : (
                      getSuggestionIcon(suggestion.type)
                    )}
                    <div className={styles.suggestionContent}>
                      <span className={styles.suggestionText}>{suggestion.text}</span>
                      <span className={styles.suggestionMeta}>
                        {suggestion.price && (
                          <span className={styles.price}>₱{suggestion.price.toFixed(2)}</span>
                        )}
                        {suggestion.rating && suggestion.rating > 0 && (
                          <span className={styles.rating}>
                            <FaStar className={styles.starIcon} />
                            {suggestion.rating.toFixed(1)}
                          </span>
                        )}
                        {suggestion.reason && (
                          <span className={styles.reason}>{suggestion.reason}</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Explore Section - Categories, Artists, etc */}
          {groupedSuggestions.explore && groupedSuggestions.explore.length > 0 && (
            <div className={styles.suggestionsSection}>
              <div className={styles.sectionHeader}>
                <FaLightbulb className={styles.sectionIcon} />
                <span>Explore</span>
              </div>
              {groupedSuggestions.explore.map((suggestion, index) => {
                const actualIndex = (groupedSuggestions.forYou?.length || 0) + (groupedSuggestions.products?.length || 0) + index;
                return (
                  <div
                    key={`${suggestion.type}-${suggestion.text}`}
                    className={`${styles.suggestionItem} ${selectedIndex === actualIndex ? styles.selected : ""}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <div className={styles.suggestionContent}>
                      <span className={styles.suggestionText}>{suggestion.text}</span>
                      <span className={styles.suggestionMeta}>
                        {suggestion.count && suggestion.count > 1 && (
                          <span className={styles.count}>{suggestion.count} items</span>
                        )}
                        <span className={styles.type}>{suggestion.type}</span>
                        {suggestion.reason && (
                          <span className={styles.reason}>{suggestion.reason}</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading state */}
          {isLoadingSuggestions && suggestions.length === 0 && (
            <div className={styles.loadingSection}>
              <FaSpinner className={styles.spinning} />
              <span>Finding suggestions...</span>
            </div>
          )}

          {/* Search stats */}
          {totalResults > 0 && searchTime > 0 && (
            <div className={styles.searchStats}>
              Found {totalResults} results in {searchTime}ms
            </div>
          )}
        </div>
      )}
    </div>
  );
}
