import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';

export function useWishlist() {
  const { data: session, status } = useSession();
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Use ref to prevent race conditions during updates
  const isUpdatingRef = useRef(false);
  const currentWishlistRef = useRef<Set<string>>(new Set());

  // Update ref when wishlist changes
  useEffect(() => {
    currentWishlistRef.current = wishlist;
  }, [wishlist]);

  // Load wishlist on mount - only from localStorage to prevent API loops
  useEffect(() => {
    if (status === 'loading') return;
    if (initialized) return;
    
    // Always load from localStorage only - no API calls
    loadWishlistFromLocalStorage();
  }, [status, initialized]); // Removed session?.user?.id dependency

  // Load wishlist from API for authenticated users
  const loadWishlistFromAPI = async () => {
    if (isUpdatingRef.current) return; // Don't reload during updates
    
    try {
      setLoading(true);
      const response = await fetch('/api/user/wishlist');
      const data = await response.json();
      
      if (data.success) {
        const wishlistIds = data.data.map((product: any) => 
          typeof product === 'string' ? product : product._id
        );
        const newWishlist = new Set(wishlistIds);
        
        setWishlist(newWishlist);
        currentWishlistRef.current = newWishlist;
        
        // Also update localStorage for offline access
        localStorage.setItem('wishlist', JSON.stringify(wishlistIds));
      }
    } catch (error) {
      console.error('Error loading wishlist from API:', error);
      // Fallback to localStorage
      loadWishlistFromLocalStorage();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Load wishlist from localStorage for non-authenticated users
  const loadWishlistFromLocalStorage = () => {
    if (isUpdatingRef.current) return; // Don't reload during updates
    
    try {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        const wishlistIds = JSON.parse(saved);
        const newWishlist = new Set(wishlistIds);
        setWishlist(newWishlist);
        currentWishlistRef.current = newWishlist;
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
    } finally {
      setInitialized(true);
    }
  };

  // Toggle product in wishlist
  const toggleWishlist = useCallback(async (productId: string) => {
    if (!productId || isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    try {
      const isCurrentlyInWishlist = currentWishlistRef.current.has(productId);
      
      // Optimistically update UI immediately
      const newWishlist = new Set(currentWishlistRef.current);
      if (isCurrentlyInWishlist) {
        newWishlist.delete(productId);
      } else {
        newWishlist.add(productId);
      }
      
      // Update state and ref immediately
      setWishlist(newWishlist);
      currentWishlistRef.current = newWishlist;
      
      // Update localStorage immediately
      localStorage.setItem('wishlist', JSON.stringify(Array.from(newWishlist)));

      // If user is authenticated, sync with API in background
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/wishlist', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId }),
          });

          const data = await response.json();
          
          if (!data.success) {
            // Revert optimistic update if API call failed
            const revertedWishlist = new Set(currentWishlistRef.current);
            if (isCurrentlyInWishlist) {
              revertedWishlist.add(productId);
            } else {
              revertedWishlist.delete(productId);
            }
            
            setWishlist(revertedWishlist);
            currentWishlistRef.current = revertedWishlist;
            localStorage.setItem('wishlist', JSON.stringify(Array.from(revertedWishlist)));
            
            console.error('Failed to sync wishlist with server:', data.message);
          }
        } catch (error) {
          console.error('Error syncing wishlist:', error);
          
          // Revert optimistic update on error
          const revertedWishlist = new Set(currentWishlistRef.current);
          if (isCurrentlyInWishlist) {
            revertedWishlist.add(productId);
          } else {
            revertedWishlist.delete(productId);
          }
          
          setWishlist(revertedWishlist);
          currentWishlistRef.current = revertedWishlist;
          localStorage.setItem('wishlist', JSON.stringify(Array.from(revertedWishlist)));
        }
      }
    } finally {
      isUpdatingRef.current = false;
    }
  }, [session?.user?.id]);

  // Check if product is in wishlist - use ref for most current state
  const isInWishlist = useCallback((productId: string) => {
    return currentWishlistRef.current.has(productId);
  }, []);

  // Get wishlist size
  const wishlistSize = wishlist.size;

  // Sync localStorage wishlist to server when user logs in
  const syncLocalStorageToServer = useCallback(async () => {
    if (!session?.user?.id || isUpdatingRef.current) return;

    try {
      const saved = localStorage.getItem('wishlist');
      if (!saved) return;

      const localWishlist = JSON.parse(saved);
      if (!Array.isArray(localWishlist) || localWishlist.length === 0) return;

      // Add each item from localStorage to server
      for (const productId of localWishlist) {
        try {
          await fetch('/api/user/wishlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              productId, 
              action: 'add' 
            }),
          });
        } catch (error) {
          console.error('Error syncing product to server:', productId, error);
        }
      }

      // Reload wishlist from server after sync
      setInitialized(false); // Allow reload
      await loadWishlistFromAPI();
    } catch (error) {
      console.error('Error syncing localStorage to server:', error);
    }
  }, [session?.user?.id]);

  const refresh = useCallback(async () => {
    if (session?.user?.id) {
      await loadWishlistFromAPI();
    } else {
      loadWishlistFromLocalStorage();
    }
    setInitialized(true);
  }, [session?.user?.id]);

  // Memoize the wishlist array to prevent infinite re-renders
  const wishlistArray = useMemo(() => Array.from(wishlist), [wishlist]);

  return {
    wishlist: wishlistArray,
    isInWishlist,
    toggleWishlist,
    wishlistSize,
    loading,
    syncLocalStorageToServer,
    refresh,
  };
}