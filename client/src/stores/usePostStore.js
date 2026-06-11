import { create } from 'zustand';
import { toast } from 'sonner';

import { getPostData, getPostId, getPostList, postStatusLabels } from '~/utils/dashboardUtils';
import { postService } from '~/services/postService';

export const usePostStore = create((set, get) => ({
    posts: [],
    selectedPost: null,
    loading: false,
    saving: false,
    updatingId: null,

    clearSelectedPost: () => {
        set({ selectedPost: null });
    },

    fetchPosts: async () => {
        try {
            set({ loading: true });

            const data = await postService.getPosts();

            set({
                posts: getPostList(data)
            });

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được danh sách bài viết');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    fetchPostDetail: async (post) => {
        try {
            set({ selectedPost: post });

            const data = await postService.getPostBySlug(post.slug || getPostId(post));

            set({
                selectedPost: {
                    ...post,
                    ...getPostData(data)
                }
            });

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được chi tiết bài viết');
            return false;
        }
    },

    createPost: async (payload) => {
        try {
            set({ saving: true });

            await postService.createPost(payload);
            toast.success('Tạo bài viết thành công');

            await get().fetchPosts();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tạo được bài viết');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    updatePost: async (postId, payload) => {
        try {
            set({ saving: true });

            await postService.updatePost(postId, payload);
            toast.success('Cập nhật bài viết thành công');

            await get().fetchPosts();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không cập nhật được bài viết');
            return false;
        } finally {
            set({ saving: false });
        }
    },

    deletePost: async (postId) => {
        try {
            await postService.deletePost(postId);
            toast.success('Xóa bài viết thành công');

            await get().fetchPosts();
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không xóa được bài viết');
            return false;
        }
    },

    changePostStatus: async (postId, status) => {
        try {
            set({ updatingId: postId });

            const data = await postService.updatePost(postId, { status });
            const updatedPost = getPostData(data);

            set((state) => ({
                posts: state.posts.map((post) =>
                    getPostId(post) === postId
                        ? {
                              ...post,
                              ...updatedPost,
                              status
                          }
                        : post
                ),
                selectedPost:
                    getPostId(state.selectedPost) === postId
                        ? {
                              ...state.selectedPost,
                              ...updatedPost,
                              status
                          }
                        : state.selectedPost
            }));

            toast.success(`Đã chuyển bài viết sang ${postStatusLabels[status] || status}`);
            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không cập nhật được trạng thái bài viết');
            return false;
        } finally {
            set({ updatingId: null });
        }
    }
}));
