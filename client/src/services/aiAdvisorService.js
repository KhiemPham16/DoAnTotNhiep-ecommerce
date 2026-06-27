import { axiosInstance } from '~/lib/axios';

export const aiAdvisorService = {
    async advise({ message, history = [] }) {
        const res = await axiosInstance.post('/ai-advisor/book', {
            message,
            history
        });

        return res.data;
    }
};
