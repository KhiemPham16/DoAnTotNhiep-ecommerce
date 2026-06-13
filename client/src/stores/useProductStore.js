import { create } from 'zustand';
import { toast } from 'sonner';

import { productService } from '~/services/productService';

const activeProductParams = {
    isActive: 'true',
    limit: 100
};

export const useProductStore = create((set, get) => ({
    products: [],
    activeProducts: [],

    loading: false,
    loadingActiveProducts: false,
    saving: false,

    fetchProducts: async (params, { force = false } = {}) => {
        const { products, loading } = get();

        if (!force && products.length > 0 && !params) {
            return true;
        }

        if (loading) return true;

        try {
            set({ loading: true });

            const data = await productService.getProducts(params);

            set({
                products: data.data || []
            });

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được danh sách sản phẩm');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    fetchActiveProducts: async ({ force = false } = {}) => {
        const { activeProducts, loadingActiveProducts } = get();

        if (!force && activeProducts.length > 0) {
            return activeProducts;
        }

        if (loadingActiveProducts) {
            return activeProducts;
        }

        try {
            set({ loadingActiveProducts: true });

            const data = await productService.getProducts(activeProductParams);
            const products = data.data || [];

            set({
                activeProducts: products
            });

            return products;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được danh sách sản phẩm');
            return [];
        } finally {
            set({ loadingActiveProducts: false });
        }
    },

    createProduct: async (payload, params) => {
        try {
            set({ saving: true });

            await productService.createProduct(payload);

            toast.success('Tạo sản phẩm thành công');

            await Promise.all([
                get().fetchProducts(params, { force: true }),
                get().fetchActiveProducts({ force: true })
            ]);

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không lưu được sản phẩm');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    updateProduct: async (id, payload, params) => {
        try {
            set({ saving: true });

            await productService.updateProduct(id, payload);

            toast.success('Cập nhật sản phẩm thành công');

            await Promise.all([
                get().fetchProducts(params, { force: true }),
                get().fetchActiveProducts({ force: true })
            ]);

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không lưu được sản phẩm');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    deleteProduct: async (id, params) => {
        try {
            await productService.deleteProduct(id);

            toast.success('Xóa sản phẩm thành công');

            await Promise.all([
                get().fetchProducts(params, { force: true }),
                get().fetchActiveProducts({ force: true })
            ]);

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không xóa được sản phẩm');
            return false;
        }
    },

    clearActiveProducts: () => {
        set({ activeProducts: [] });
    }
}));
