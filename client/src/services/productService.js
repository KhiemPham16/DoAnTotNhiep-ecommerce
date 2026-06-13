import { axiosInstance as api } from '~/lib/axios';

export const productService = {
    getProducts: async (params) => {
        const res = await api.get('/products', { params });
        return res.data;
    },

    getProductBySlug: async (slug) => {
        const res = await api.get(`/products/${slug}`);
        return res.data;
    },

    createProduct: async (payload) => {
        const res = await api.post('/products', payload);
        return res.data;
    },

    updateProduct: async (id, payload) => {
        const res = await api.patch(`/products/id/${id}`, payload);
        return res.data;
    },

    deleteProduct: async (id) => {
        const res = await api.delete(`/products/id/${id}`);
        return res.data;
    }
};
