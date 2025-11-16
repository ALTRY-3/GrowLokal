import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cart Item Interface
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  artistName: string;
  maxStock: number;
}

// Cart Store Interface
interface CartStore {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  selectedItems: Set<string>;
  
  // Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  clearLocalCart: () => void;
  calculateTotals: () => void;
  mergeCart: () => Promise<void>;
  
  // Selection actions
  toggleSelectItem: (productId: string) => void;
  selectAllItems: (selected: boolean) => void;
  clearSelection: () => void;
  getSelectedItems: () => CartItem[];
  getSelectedSubtotal: () => number;
  getSelectedCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,
      isLoading: false,
      error: null,
      selectedItems: new Set<string>(),

      // Calculate subtotal and item count
      calculateTotals: () => {
        const { items } = get();
        const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const itemCount = items.reduce((total, item) => total + item.quantity, 0);
        set({ subtotal, itemCount });
      },

      // Fetch cart from API
      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/cart');
          const data = await response.json();

          if (data.success) {
            set({
              items: data.data.items || [],
              subtotal: data.data.subtotal || 0,
              isLoading: false,
            });
            get().calculateTotals();
          } else {
            throw new Error(data.message || 'Failed to fetch cart');
          }
        } catch (error: any) {
          console.error('Error fetching cart:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // Add item to cart
      addItem: async (productId: string, quantity: number = 1) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity }),
          });

          const data = await response.json();

          if (data.success) {
            set({
              items: data.data.items || [],
              subtotal: data.data.subtotal || 0,
              isLoading: false,
            });
            get().calculateTotals();
            
            // Success notification could be added here
            return Promise.resolve();
          } else {
            throw new Error(data.message || 'Failed to add item to cart');
          }
        } catch (error: any) {
          console.error('Error adding to cart:', error);
          set({ error: error.message, isLoading: false });
          return Promise.reject(error);
        }
      },

      // Update item quantity
      updateQuantity: async (productId: string, quantity: number) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity }),
          });

          const data = await response.json();

          if (data.success) {
            set({
              items: data.data.items || [],
              subtotal: data.data.subtotal || 0,
              isLoading: false,
            });
            get().calculateTotals();
          } else {
            throw new Error(data.message || 'Failed to update cart');
          }
        } catch (error: any) {
          console.error('Error updating cart:', error);
          set({ error: error.message, isLoading: false });
          // Revert to previous state by refetching
          get().fetchCart();
        }
      },

      // Remove item from cart
      removeItem: async (productId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/cart/remove/${productId}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (data.success) {
            set({
              items: data.data.items || [],
              subtotal: data.data.subtotal || 0,
              isLoading: false,
            });
            get().calculateTotals();
          } else {
            throw new Error(data.message || 'Failed to remove item');
          }
        } catch (error: any) {
          console.error('Error removing item:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      // Clear entire cart (local state only, doesn't touch database)
      clearLocalCart: () => {
        set({
          items: [],
          subtotal: 0,
          itemCount: 0,
          isLoading: false,
          error: null,
        });
      },

      // Clear entire cart (including database)
      clearCart: async () => {
        // Clear cart immediately in UI (don't wait for API)
        set({
          items: [],
          subtotal: 0,
          itemCount: 0,
          isLoading: false,
          error: null,
        });
        
        try {
          const response = await fetch('/api/cart', {
            method: 'DELETE',
          });

          const data = await response.json();

          if (!data.success) {
            console.warn('Cart clear API failed:', data.message);
          }
        } catch (error: any) {
          console.error('Error clearing cart:', error);
          // Don't revert the UI state even if API fails
        }
      },

      // Merge guest cart with user cart after login
      mergeCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/cart/merge', {
            method: 'POST',
          });

          const data = await response.json();

          if (data.success) {
            set({
              items: data.data.items || [],
              subtotal: data.data.subtotal || 0,
              isLoading: false,
            });
            get().calculateTotals();
          } else {
            // If merge fails, just fetch the user's cart
            await get().fetchCart();
          }
        } catch (error: any) {
          console.error('Error merging cart:', error);
          // Fallback to fetching cart
          await get().fetchCart();
        }
      },

      // Selection management
      toggleSelectItem: (productId: string) => {
        set((state) => {
          const newSelectedItems = new Set(state.selectedItems);
          if (newSelectedItems.has(productId)) {
            newSelectedItems.delete(productId);
          } else {
            newSelectedItems.add(productId);
          }
          return { selectedItems: newSelectedItems };
        });
      },

      selectAllItems: (selected: boolean) => {
        set((state) => ({
          selectedItems: selected ? new Set(state.items.map(item => item.productId)) : new Set<string>()
        }));
      },

      clearSelection: () => {
        set({ selectedItems: new Set<string>() });
      },

      getSelectedItems: () => {
        const { items, selectedItems } = get();
        return items.filter(item => selectedItems.has(item.productId));
      },

      getSelectedSubtotal: () => {
        const selectedItems = get().getSelectedItems();
        return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getSelectedCount: () => {
        return get().selectedItems.size;
      },
    }),
    {
      name: 'cart-storage', // localStorage key
      partialize: (state) => ({
        // Only persist items and subtotal, not selectedItems
        items: state.items,
        subtotal: state.subtotal,
        itemCount: state.itemCount,
      }),
    }
  )
);
