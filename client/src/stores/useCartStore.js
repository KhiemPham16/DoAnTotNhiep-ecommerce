import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (product, quantity = 1) => {
                const items = get().items;

                const existed = items.find((item) => item.id === product.id);

                if (existed) {
                    set({
                        items: items.map((item) =>
                            item.id === product.id
                                ? {
                                      ...item,
                                      quantity: item.quantity + quantity
                                  }
                                : item
                        )
                    });
                } else {
                    set({
                        items: [
                            ...items,
                            {
                                ...product,
                                quantity
                            }
                        ]
                    });
                }

                toast.success('Đã thêm vào giỏ hàng');
            },

            removeFromCart: (productId) => {
                set({
                    items: get().items.filter((item) => item.id !== productId)
                });
            },

            updateQuantity: (productId, quantity) => {
                set({
                    items: get().items.map((item) =>
                        item.id === productId
                            ? {
                                  ...item,
                                  quantity
                              }
                            : item
                    )
                });
            },

            clearCart: () => {
                set({ items: [] });
            }
        }),
        {
            name: 'cart-storage'
        }
    )
);
