import { axiosInstance as api } from '~/lib/axios';

export const couponService = {
    getCoupons: async () => {
        const response = await api.get('/coupons');
        return response.data;
    },

    getCouponById: async (id) => {
        const response = await api.get(`/coupons/${id}`);
        return response.data;
    },

    createCoupon: async (payload) => {
        const response = await api.post('/coupons', payload);
        return response.data;
    },

    updateCoupon: async (id, payload) => {
        const response = await api.patch(`/coupons/${id}`, payload);
        return response.data;
    },

    deleteCoupon: async (id) => {
        const response = await api.delete(`/coupons/${id}`);
        return response.data;
    },

    validateCoupon: async (payload) => {
        const response = await api.post('/coupons/validate', payload);
        return response.data;
    }
};
