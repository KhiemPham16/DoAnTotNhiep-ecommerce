import { axiosInstance as api } from '~/lib/axios';

export const reviewService = {
    getProductReviews: async (productId, params) => {
        const res = await api.get(`/reviews/products/${productId}`, { params });
        return res.data;
    },

    canReviewProduct: async (productId) => {
        const res = await api.get(`/reviews/products/${productId}/can-review`);
        return res.data;
    },

    createReview: async (payload) => {
        const res = await api.post('/reviews', payload);
        return res.data;
    },

    updateReview: async (id, payload) => {
        const res = await api.patch(`/reviews/${id}`, payload);
        return res.data;
    }
};
