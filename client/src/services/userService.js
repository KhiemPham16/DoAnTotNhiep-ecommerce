import { axiosInstance as api } from '~/lib/axios';

export const userService = {
    getUsers: async () => {
        const res = await api.get('/users');
        return res.data;
    },

    createUser: async (payload) => {
        const res = await api.post('/users', payload);
        return res.data;
    },

    updateUser: async (id, payload) => {
        const res = await api.patch(`/users/${id}`, payload);
        return res.data;
    },

    deleteUser: async (id) => {
        const res = await api.delete(`/users/${id}`);
        return res.data;
    },

    updateMe: async (payload) => {
        const res = await api.patch('/users/me', payload);
        return res.data;
    },

    updateMyAvatar: async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);

        const res = await api.patch('/users/me/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return res.data;
    }
};
