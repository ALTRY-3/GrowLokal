import { useState, useEffect, useCallback, useRef } from 'react';

// Types for personalization
export interface UserBehavior {
  recentViews: string[];        // Product IDs
  recentSearches: string[];     // Search terms
  interests: string[];          // Categories/craftTypes the user is interested in
  viewedCategories: string[];   // Categories user has browsed
  viewTimestamps: Record<string, number>; // Product ID -> timestamp
}

export interface PersonalizedProduct {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  images: string[];
  thumbnailUrl: string;
  artistName: string;
  artistId: string;
  averageRating: number;
  totalReviews: number;
  isAvailable: boolean;
  isFeatured: boolean;
  craftType?: string;
  barangay?: string;
  recommendationReason?: string | null;
  personalizationScore?: number;
}

interface UsePersonalizationOptions {
  limit?: number;
  category?: string;
  excludeIds?: string[];
}

interface UsePersonalizationReturn {
  products: PersonalizedProduct[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trackProductView: (productId: string, category?: string, craftType?: string) => void;
  trackSearch: (query: string) => void;
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
  clearHistory: () => void;
  behavior: UserBehavior;
}

// Storage keys
const STORAGE_KEYS = {
  recentViews: 'recentProductViews',
  recentSearches: 'recentSearches',
  interests: 'userInterests',
  viewedCategories: 'viewedCategories',
  viewTimestamps: 'productViewTimestamps',
  cachedProducts: 'personalizedProductsCache',
  cacheTimestamp: 'personalizedProductsCacheTime',
};

// Max items to store
const MAX_RECENT_VIEWS = 50;
const MAX_RECENT_SEARCHES = 20;
const MAX_INTERESTS = 15;
const VIEW_EXPIRY_DAYS = 30;
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes cache
const STALE_WHILE_REVALIDATE_MS = 30 * 1000; // Background refresh after 30s
const FETCH_RETRY_DELAY_MS = 2000; // Retry after 2s if fetch fails
const MAX_RETRIES = 2;

// Helper to safely access localStorage
function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// Clean up old view timestamps
function cleanupOldViews(
  recentViews: string[],
  viewTimestamps: Record<string, number>
): { views: string[]; timestamps: Record<string, number> } {
  const cutoff = Date.now() - VIEW_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const validViews = recentViews.filter(id => (viewTimestamps[id] || 0) > cutoff);
  const validTimestamps: Record<string, number> = {};
  
  validViews.forEach(id => {
    if (viewTimestamps[id]) {
      validTimestamps[id] = viewTimestamps[id];
    }
  });
  
  return { views: validViews, timestamps: validTimestamps };
}

// Cache personalized products to localStorage
function cacheProducts(products: PersonalizedProduct[]): void {
  setStorageItem(STORAGE_KEYS.cachedProducts, products);
  setStorageItem(STORAGE_KEYS.cacheTimestamp, Date.now());
}

// Get cached products if still valid
function getCachedProducts(): { products: PersonalizedProduct[] | null; isStale: boolean; age: number } {
  const cacheTime = getStorageItem<number>(STORAGE_KEYS.cacheTimestamp, 0);
  const now = Date.now();
  const age = now - cacheTime;
  
  // Check if cache exists and is not expired
  if (age < CACHE_EXPIRY_MS) {
    const cached = getStorageItem<PersonalizedProduct[]>(STORAGE_KEYS.cachedProducts, []);
    if (cached.length > 0) {
      const isStale = age > STALE_WHILE_REVALIDATE_MS;
      return { products: cached, isStale, age };
    }
  }
  
  return { products: null, isStale: true, age };
}

// Load behavior from localStorage
function loadBehaviorFromStorage(): UserBehavior {
  const recentViews = getStorageItem<string[]>(STORAGE_KEYS.recentViews, []);
  const recentSearches = getStorageItem<string[]>(STORAGE_KEYS.recentSearches, []);
  const interests = getStorageItem<string[]>(STORAGE_KEYS.interests, []);
  const viewedCategories = getStorageItem<string[]>(STORAGE_KEYS.viewedCategories, []);
  const viewTimestamps = getStorageItem<Record<string, number>>(STORAGE_KEYS.viewTimestamps, {});

  // Cleanup old views
  const { views: cleanedViews, timestamps: cleanedTimestamps } = cleanupOldViews(
    recentViews,
    viewTimestamps
  );

  // Save cleaned data back if there was cleanup
  if (cleanedViews.length !== recentViews.length) {
    setStorageItem(STORAGE_KEYS.recentViews, cleanedViews);
    setStorageItem(STORAGE_KEYS.viewTimestamps, cleanedTimestamps);
  }

  return {
    recentViews: cleanedViews,
    recentSearches,
    interests,
    viewedCategories,
    viewTimestamps: cleanedTimestamps,
  };
}

export function usePersonalization(
  options: UsePersonalizationOptions = {}
): UsePersonalizationReturn {
  const { limit = 20, category, excludeIds = [] } = options;

  // Initialize with empty state - load from cache in useEffect to avoid SSR issues
  const [products, setProducts] = useState<PersonalizedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [behavior, setBehavior] = useState<UserBehavior>({
    recentViews: [],
    recentSearches: [],
    interests: [],
    viewedCategories: [],
    viewTimestamps: {},
  });
  
  // Use refs to track fetch state - this is the KEY to preventing infinite loops
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const hasInitializedRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store options in ref to use in fetch without causing re-renders
  const optionsRef = useRef({ limit, category, excludeIds });
  const behaviorRef = useRef(behavior);
  
  // Update refs when values change
  useEffect(() => {
    optionsRef.current = { limit, category, excludeIds };
  }, [limit, category, excludeIds]);
  
  useEffect(() => {
    behaviorRef.current = behavior;
  }, [behavior]);

  // Fetch function - stable reference, uses refs for data
  const fetchPersonalizedProducts = useCallback(async (isBackgroundRefresh = false, retryAttempt = 0) => {
    // CRITICAL: Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('[usePersonalization] Already fetching, skipping');
      return;
    }
    
    // Throttle fetches - minimum 3 seconds between fetches (reduced from 5)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 3000 && !isBackgroundRefresh && retryAttempt === 0) {
      console.log('[usePersonalization] Throttled, too soon since last fetch');
      return;
    }
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    
    try {
      // Only show loading spinner if this is not a background refresh and we have no products
      if (!isBackgroundRefresh && retryAttempt === 0) {
        setLoading(true);
      }
      setError(null);

      const currentBehavior = behaviorRef.current;
      const currentOptions = optionsRef.current;
      
      const params = new URLSearchParams();
      params.set('limit', currentOptions.limit.toString());
      
      if (currentOptions.category) {
        params.set('category', currentOptions.category);
      }
      
      if (currentBehavior.recentViews.length > 0) {
        params.set('recentViews', currentBehavior.recentViews.slice(0, 10).join(','));
      }
      
      if (currentBehavior.recentSearches.length > 0) {
        params.set('recentSearches', currentBehavior.recentSearches.slice(0, 5).join(','));
      }
      
      if (currentBehavior.interests.length > 0) {
        params.set('interests', currentBehavior.interests.join(','));
      }
      
      if (currentOptions.excludeIds.length > 0) {
        params.set('excludeIds', currentOptions.excludeIds.join(','));
      }

      console.log('[usePersonalization] Fetching products...', isBackgroundRefresh ? '(background)' : '', retryAttempt > 0 ? `(retry ${retryAttempt})` : '');
      
      const response = await fetch(`/api/products/personalized?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      console.log('[usePersonalization] Fetch complete, products:', data.data?.length || 0);

      if (!mountedRef.current) return;

      if (data.success && data.data && data.data.length > 0) {
        const fetchedProducts = data.data || [];
        setProducts(fetchedProducts);
        cacheProducts(fetchedProducts);
        retryCountRef.current = 0; // Reset retry count on success
      } else {
        // Fallback: if personalized returns no products, fetch popular products
        console.log('[usePersonalization] No personalized products, fetching popular products as fallback');
        
        try {
          const fallbackResponse = await fetch(`/api/products?limit=${currentOptions.limit}&sortBy=viewCount&sortOrder=desc`, {
            signal: abortControllerRef.current.signal,
          });
          const fallbackData = await fallbackResponse.json();
          
          if (!mountedRef.current) return;
          
          if (fallbackData.success && fallbackData.data && fallbackData.data.length > 0) {
            const fetchedProducts = fallbackData.data;
            setProducts(fetchedProducts);
            cacheProducts(fetchedProducts);
            retryCountRef.current = 0;
          }
        } catch (fallbackErr: any) {
          if (fallbackErr.name !== 'AbortError') {
            console.error('[usePersonalization] Fallback fetch error:', fallbackErr);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[usePersonalization] Fetch aborted');
        isFetchingRef.current = false;
        return;
      }
      console.error('[usePersonalization] Fetch error:', err);
      
      if (mountedRef.current) {
        setError(err.message);
        
        // Retry logic - only if we don't have products and haven't exceeded retries
        if (retryAttempt < MAX_RETRIES && products.length === 0) {
          console.log(`[usePersonalization] Will retry in ${FETCH_RETRY_DELAY_MS}ms (attempt ${retryAttempt + 1}/${MAX_RETRIES})`);
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              isFetchingRef.current = false; // Allow retry
              fetchPersonalizedProducts(false, retryAttempt + 1);
            }
          }, FETCH_RETRY_DELAY_MS);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [products.length]); // Include products.length to check for retry necessity

  // Track if component is mounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clear any pending retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Load behavior and cached products on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load behavior from storage
    const storedBehavior = loadBehaviorFromStorage();
    setBehavior(storedBehavior);
    
    // Check for cached products
    const { products: cachedProducts, isStale, age } = getCachedProducts();
    
    if (cachedProducts && cachedProducts.length > 0) {
      console.log('[usePersonalization] Found cached products:', cachedProducts.length, 'age:', Math.round(age/1000), 's');
      setProducts(cachedProducts);
      setLoading(false);
    }
  }, []);

  // Initial fetch - runs on mount with stale-while-revalidate pattern
  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    const { products: cachedProducts, isStale } = getCachedProducts();
    
    if (cachedProducts && cachedProducts.length > 0) {
      // We have cached products - they were set in the previous effect
      // If cache is stale, refresh in background
      if (isStale) {
        console.log('[usePersonalization] Cache stale, scheduling background refresh');
        const refreshTimeoutId = setTimeout(() => {
          if (mountedRef.current) {
            fetchPersonalizedProducts(true); // Background refresh
          }
        }, 300); // Short delay to avoid blocking render
        
        return () => {
          clearTimeout(refreshTimeoutId);
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        };
      }
      
      return;
    }
    
    // No cached products, fetch immediately
    console.log('[usePersonalization] No cache, starting initial fetch');
    fetchPersonalizedProducts();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchPersonalizedProducts]);

  // Track product view
  const trackProductView = useCallback((
    productId: string,
    productCategory?: string,
    craftType?: string
  ) => {
    setBehavior(prev => {
      const newViews = [productId, ...prev.recentViews.filter(id => id !== productId)]
        .slice(0, MAX_RECENT_VIEWS);
      
      const newTimestamps = {
        ...prev.viewTimestamps,
        [productId]: Date.now(),
      };
      
      let newCategories = prev.viewedCategories;
      if (productCategory && !newCategories.includes(productCategory)) {
        newCategories = [...newCategories, productCategory].slice(-10);
      }
      
      let newInterests = prev.interests;
      if (craftType && !newInterests.includes(craftType)) {
        // Add craftType as interest if viewing related products
        const viewCount = newViews.filter(id => id === productId).length;
        if (viewCount >= 2) {
          newInterests = [...newInterests, craftType].slice(0, MAX_INTERESTS);
        }
      }

      setStorageItem(STORAGE_KEYS.recentViews, newViews);
      setStorageItem(STORAGE_KEYS.viewTimestamps, newTimestamps);
      setStorageItem(STORAGE_KEYS.viewedCategories, newCategories);
      if (newInterests !== prev.interests) {
        setStorageItem(STORAGE_KEYS.interests, newInterests);
      }

      return {
        ...prev,
        recentViews: newViews,
        viewTimestamps: newTimestamps,
        viewedCategories: newCategories,
        interests: newInterests,
      };
    });
  }, []);

  // Track search
  const trackSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery || trimmedQuery.length < 2) return;

    setBehavior(prev => {
      const newSearches = [trimmedQuery, ...prev.recentSearches.filter(s => s !== trimmedQuery)]
        .slice(0, MAX_RECENT_SEARCHES);
      
      setStorageItem(STORAGE_KEYS.recentSearches, newSearches);

      return {
        ...prev,
        recentSearches: newSearches,
      };
    });
  }, []);

  // Add interest
  const addInterest = useCallback((interest: string) => {
    const trimmedInterest = interest.trim();
    if (!trimmedInterest) return;

    setBehavior(prev => {
      if (prev.interests.includes(trimmedInterest)) return prev;
      
      const newInterests = [...prev.interests, trimmedInterest].slice(0, MAX_INTERESTS);
      setStorageItem(STORAGE_KEYS.interests, newInterests);

      return {
        ...prev,
        interests: newInterests,
      };
    });
  }, []);

  // Remove interest
  const removeInterest = useCallback((interest: string) => {
    setBehavior(prev => {
      const newInterests = prev.interests.filter(i => i !== interest);
      setStorageItem(STORAGE_KEYS.interests, newInterests);

      return {
        ...prev,
        interests: newInterests,
      };
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setBehavior({
      recentViews: [],
      recentSearches: [],
      interests: [],
      viewedCategories: [],
      viewTimestamps: {},
    });

    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, []);

  return {
    products,
    loading,
    error,
    refresh: fetchPersonalizedProducts,
    trackProductView,
    trackSearch,
    addInterest,
    removeInterest,
    clearHistory,
    behavior,
  };
}

// Utility hook for tracking a single product view
export function useTrackProductView(
  productId: string | undefined,
  category?: string,
  craftType?: string
) {
  useEffect(() => {
    if (!productId) return;
    
    const timeoutId = setTimeout(() => {
      const recentViews = getStorageItem<string[]>(STORAGE_KEYS.recentViews, []);
      const viewTimestamps = getStorageItem<Record<string, number>>(STORAGE_KEYS.viewTimestamps, {});
      
      const newViews = [productId, ...recentViews.filter(id => id !== productId)]
        .slice(0, MAX_RECENT_VIEWS);
      
      const newTimestamps = {
        ...viewTimestamps,
        [productId]: Date.now(),
      };
      
      setStorageItem(STORAGE_KEYS.recentViews, newViews);
      setStorageItem(STORAGE_KEYS.viewTimestamps, newTimestamps);
      
      if (category) {
        const categories = getStorageItem<string[]>(STORAGE_KEYS.viewedCategories, []);
        if (!categories.includes(category)) {
          setStorageItem(STORAGE_KEYS.viewedCategories, [...categories, category].slice(-10));
        }
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [productId, category, craftType]);
}

export default usePersonalization;
