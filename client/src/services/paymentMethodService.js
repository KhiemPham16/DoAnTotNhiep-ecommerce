import { axiosInstance as api } from '~/lib/axios';

export const paymentMethodService = {
    getActivePaymentMethods: async () => {
        const res = await api.get('/payment-methods/active');
        return res.data;
    },

    getPaymentMethods: async () => {
        const res = await api.get('/payment-methods');
        return res.data;
    },

    getPaymentMethodById: async (id) => {
        const res = await api.get(`/payment-methods/${id}`);
        return res.data;
    },

    createPaymentMethod: async (payload) => {
        const res = await api.post('/payment-methods', payload);
        return res.data;
    },

    updatePaymentMethod: async (id, payload) => {
        const res = await api.patch(`/payment-methods/${id}`, payload);
        return res.data;
    },

    deletePaymentMethod: async (id) => {
        const res = await api.delete(`/payment-methods/${id}`);
        return res.data;
    }
};
