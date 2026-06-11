import { create } from 'zustand';
import { toast } from 'sonner';

import { userService } from '~/services/userService';

export const useUserStore = create((set, get) => ({
    users: [],
    loading: false,
    saving: false,

    fetchUsers: async () => {
        try {
            set({ loading: true });
            const data = await userService.getUsers();
            set({ users: data.data || [] });
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được danh sách người dùng');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    createUser: async (payload, successMessage = 'Thêm người dùng thành công') => {
        try {
            set({ saving: true });
            await userService.createUser(payload);
            toast.success(successMessage);
            await get().fetchUsers();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không lưu được người dùng');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    updateUser: async (id, payload, successMessage = 'Cập nhật người dùng thành công') => {
        try {
            set({ saving: true });
            await userService.updateUser(id, payload);
            toast.success(successMessage);
            await get().fetchUsers();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không lưu được người dùng');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    deleteUser: async (id, successMessage = 'Xóa người dùng thành công') => {
        try {
            await userService.deleteUser(id);
            toast.success(successMessage);
            await get().fetchUsers();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không xóa được người dùng');
            return false;
        }
    }
}));
