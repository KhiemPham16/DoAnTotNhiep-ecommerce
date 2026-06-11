import { axiosInstance as api } from '~/lib/axios';

export const postService = {
    getPublicPosts: async () => {
        const res = await api.get('/posts');
        return res.data;
    },

    getPosts: async () => {
        const res = await api.get('/posts/admin');
        return res.data;
    },

    getPostBySlug: async (slug) => {
        const res = await api.get(`/posts/${slug}`);
        return res.data;
    },

    createPost: async (payload) => {
        const res = await api.post('/posts', payload);
        return res.data;
    },

    updatePost: async (id, payload) => {
        const res = await api.patch(`/posts/${id}`, payload);
        return res.data;
    },

    deletePost: async (id) => {
        const res = await api.delete(`/posts/${id}`);
        return res.data;
    }
};
