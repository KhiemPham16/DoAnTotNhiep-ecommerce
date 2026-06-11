import { create } from 'zustand';
import { toast } from 'sonner';

import { addressService } from '~/services/addressService';

export const useAddressStore = create((set) => ({
    address: null,
    loading: false,
    saving: false,

    fetchMyAddress: async () => {
        try {
            set({ loading: true });

            const data = await addressService.getMyAddress();

            set({
                address: data.data || null
            });

            return data.data || null;
        } catch (error) {
            console.error(error);
            return null;
        } finally {
            set({ loading: false });
        }
    },

    upsertMyAddress: async (payload) => {
        try {
            set({ saving: true });

            const data = await addressService.upsertMyAddress(payload);

            set({
                address: data.data || null
            });

            toast.success('Lưu địa chỉ thành công');

            return data.data || null;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không lưu được địa chỉ');
            return null;
        } finally {
            set({ saving: false });
        }
    }
}));
