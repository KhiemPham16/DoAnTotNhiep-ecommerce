import { axiosInstance } from '~/lib/axios';

export const aiAdvisorService = {
    async advise(message) {
        const res = await axiosInstance.post('/ai-advisor/book', {
            message
        });

        return res.data;
    }
};