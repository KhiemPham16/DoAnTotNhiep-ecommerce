import { create } from 'zustand';
import { toast } from 'sonner';

import { categoryService } from '~/services/categoryService';
import { productService } from '~/services/productService';

export const useProductStore = create((set, get) => ({
    products: [],
    categories: [],
    loading: false,
    saving: false,

    fetchProducts: async (params) => {
        try {
            set({ loading: true });
            const data = await productService.getProducts(params);
            set({ products: data.data || [] });
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được danh sách sản phẩm');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    fetchCategories: async () => {
        try {
            const data = await categoryService.getCategories();
            set({ categories: data.data || [] });
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được danh mục');
            return false;
        }
    },

    createProduct: async (payload, params) => {
        try {
            set({ saving: true });
            await productService.createProduct(payload);
            toast.success('Tạo sản phẩm thành công');
            await get().fetchProducts(params);
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
            await get().fetchProducts(params);
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
            await get().fetchProducts(params);
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không xóa được sản phẩm');
            return false;
        }
    }
}));
