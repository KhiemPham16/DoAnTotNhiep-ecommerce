import { axiosInstance as api } from '~/lib/axios';

export const categoryService = {
    getCategories: async () => {
        const res = await api.get('/categories');
        return res.data;
    },

    createCategory: async (payload) => {
        const res = await api.post('/categories', payload);
        return res.data;
    },

    updateCategory: async (id, payload) => {
        const res = await api.patch(`/categories/${id}`, payload);
        return res.data;
    },

    deleteCategory: async (id) => {
        const res = await api.delete(`/categories/${id}`);
        return res.data;
    }
};
