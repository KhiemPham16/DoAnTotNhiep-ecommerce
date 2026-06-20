import { create } from 'zustand';
import { toast } from 'sonner';

import { categoryService } from '~/services/categoryService';

export const useCategoryStore = create((set, get) => ({
    categories: [],
    loading: false,
    saving: false,

    fetchCategories: async () => {
        try {
            set({ loading: true });
            const data = await categoryService.getCategories();
            set({ categories: data.data || [] });
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được danh sách danh mục');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    createCategory: async (payload) => {
        try {
            set({ saving: true });
            await categoryService.createCategory(payload);
            toast.success('Thêm danh mục thành công');
            await get().fetchCategories();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không lưu được danh mục');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    updateCategory: async (id, payload) => {
        try {
            set({ saving: true });
            await categoryService.updateCategory(id, payload);
            toast.success('Cập nhật danh mục thành công');
            await get().fetchCategories();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không lưu được danh mục');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    deleteCategory: async (id) => {
        try {
            await categoryService.deleteCategory(id);
            toast.success('Xóa danh mục thành công');
            await get().fetchCategories();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không xóa được danh mục');
            return false;
        }
    },

    toggleCategoryStatus: async (category) => {
        try {
            await categoryService.updateCategory(category.id, { isActive: !category.isActive });
            toast.success(category.isActive ? 'Đã tắt danh mục' : 'Đã bật danh mục');
            await get().fetchCategories();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không cập nhật được trạng thái');
            return false;
        }
    }
}));
