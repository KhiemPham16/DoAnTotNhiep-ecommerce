import { create } from 'zustand';
import { toast } from 'sonner';

import { paymentMethodService } from '~/services/paymentMethodService';

export const usePaymentMethodStore = create((set, get) => ({
    paymentMethods: [],
    selectedPaymentMethod: null,
    loading: false,
    saving: false,

    fetchActivePaymentMethods: async () => {
        try {
            set({ loading: true });

            const data = await paymentMethodService.getActivePaymentMethods();

            set({
                paymentMethods: data.data || []
            });

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được phương thức thanh toán');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    fetchPaymentMethods: async () => {
        try {
            set({ loading: true });

            const data = await paymentMethodService.getPaymentMethods();

            set({
                paymentMethods: data.data || []
            });

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được phương thức thanh toán');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    fetchPaymentMethodDetail: async (id) => {
        try {
            set({ loading: true });

            const data = await paymentMethodService.getPaymentMethodById(id);

            set({
                selectedPaymentMethod: data.data || null
            });

            return data.data || null;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được chi tiết phương thức thanh toán');
            return null;
        } finally {
            set({ loading: false });
        }
    },

    createPaymentMethod: async (payload) => {
        try {
            set({ saving: true });

            await paymentMethodService.createPaymentMethod(payload);

            toast.success('Tạo phương thức thanh toán thành công');

            await get().fetchPaymentMethods();

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tạo được phương thức thanh toán');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    updatePaymentMethod: async (id, payload) => {
        try {
            set({ saving: true });

            await paymentMethodService.updatePaymentMethod(id, payload);

            toast.success('Cập nhật phương thức thanh toán thành công');

            await get().fetchPaymentMethods();

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không cập nhật được phương thức thanh toán');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    deletePaymentMethod: async (id) => {
        try {
            await paymentMethodService.deletePaymentMethod(id);

            toast.success('Xóa phương thức thanh toán thành công');

            await get().fetchPaymentMethods();

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không xóa được phương thức thanh toán');
            return false;
        }
    }
}));
