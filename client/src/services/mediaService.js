import { axiosInstance as api } from '~/lib/axios';

export const mediaService = {
    getMedia: async () => {
        const response = await api.get('/media');
        return response.data;
    },

    getMediaById: async (id) => {
        const response = await api.get(`/media/${id}`);
        return response.data;
    },

    uploadMedia: async ({ file, alt, folder }) => {
        const formData = new FormData();
        if (folder) {
            formData.append('folder', folder);
        }

        if (alt) {
            formData.append('alt', alt);
        }

        formData.append('file', file);

        const response = await api.post('/media/upload', formData);
        return response.data;
    },

    updateMedia: async (id, payload) => {
        const response = await api.patch(`/media/${id}`, payload);
        return response.data;
    },

    deleteMedia: async (id) => {
        const response = await api.delete(`/media/${id}`);
        return response.data;
    }
};
