import { create } from 'zustand';
import { toast } from 'sonner';

import { dashboardService } from '~/services/dashboardService';

export const useDashboardStore = create((set) => ({
    orders: [],
    products: [],
    users: [],
    loading: false,

    fetchOverview: async () => {
        try {
            set({ loading: true });
            const data = await dashboardService.getOverview();
            set(data);
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được dữ liệu tổng quan');
            return false;
        } finally {
            set({ loading: false });
        }
    }
}));
