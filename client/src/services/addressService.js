import { axiosInstance as api } from '~/lib/axios';

export const addressService = {
    getMyAddress: async () => {
        const res = await api.get('/address/me');
        return res.data;
    },

    upsertMyAddress: async (payload) => {
        const res = await api.put('/address/me', payload);
        return res.data;
    }
};