import { create } from 'zustand';
import { toast } from 'sonner';

import { mediaService } from '~/services/mediaService';

export const useMediaStore = create((set, get) => ({
    media: [],
    selectedMedia: null,
    loading: false,
    saving: false,
    uploading: false,
    deletingId: null,

    clearSelectedMedia: () => set({ selectedMedia: null }),

    fetchMedia: async () => {
        try {
            set({ loading: true });
            const data = await mediaService.getMedia();
            set({ media: data.data || [] });
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được thư viện media');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    fetchMediaDetail: async (id) => {
        try {
            set({ loading: true });
            const data = await mediaService.getMediaById(id);
            set({ selectedMedia: data.data || null });
            return data.data || null;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được chi tiết media');
            return null;
        } finally {
            set({ loading: false });
        }
    },

    uploadMedia: async (payload) => {
        try {
            set({ uploading: true });
            await mediaService.uploadMedia(payload);
            toast.success('Upload media thành công');
            await get().fetchMedia();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không upload được media');
            return false;
        } finally {
            set({ uploading: false });
        }
    },

    updateMedia: async (id, payload) => {
        try {
            set({ saving: true });
            const data = await mediaService.updateMedia(id, payload);
            const updatedMedia = data.data;

            set((state) => ({
                media: state.media.map((item) => (item.id === id ? { ...item, ...updatedMedia } : item)),
                selectedMedia: state.selectedMedia?.id === id ? { ...state.selectedMedia, ...updatedMedia } : state.selectedMedia
            }));

            toast.success('Cập nhật media thành công');
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không cập nhật được media');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    deleteMedia: async (id) => {
        try {
            set({ deletingId: id });
            await mediaService.deleteMedia(id);

            set((state) => ({
                media: state.media.filter((item) => item.id !== id),
                selectedMedia: state.selectedMedia?.id === id ? null : state.selectedMedia
            }));

            toast.success('Xóa media thành công');
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không xóa được media');
            return false;
        } finally {
            set({ deletingId: null });
        }
    }
}));
