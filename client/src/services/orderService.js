import { axiosInstance as api } from '~/lib/axios';

export const orderService = {
    createOrder: async (payload) => {
        const res = await api.post('/orders', payload);
        return res.data;
    },

    getMyOrders: async () => {
        const res = await api.get('/orders/my-orders');
        return res.data;
    },

    getMyOrderById: async (id) => {
        const res = await api.get(`/orders/my-orders/${id}`);
        return res.data;
    },

    createSepayCheckout: async (orderId) => {
        const response = await api.post(`/payment/sepay/orders/${orderId}/checkout`);
        return response.data;
    },

    cancelMyOrder: async (id) => {
        const res = await api.patch(`/orders/my-orders/${id}/cancel`);
        return res.data;
    },

    getOrders: async () => {
        const res = await api.get('/orders');
        return res.data;
    },

    updateOrderStatus: async (id, status) => {
        const res = await api.patch(`/orders/${id}/status`, { status });
        return res.data;
    },

    updatePaymentStatus: async (id, paymentStatus) => {
        const res = await api.patch(`/orders/${id}/payment-status`, {
            paymentStatus
        });

        return res.data;
    }
};
