import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';

import {
    formatDate,
    getImageUrl,
    getPostContent,
    getPostCover,
    getPostId,
    normalizePostStatus,
    postStatusLabels
} from '~/utils/dashboardUtils';
import useDebounce from '~/hooks/useDebounce';
import { usePostStore } from '~/stores/usePostStore';

import PostForm from './PostForm';
import styles from './DashboardBlogs.module.scss';

const cx = classNames.bind(styles);

const postStatuses = ['DRAFT', 'PUBLISHED'];

const initialFormData = {
    title: '',
    dek: '',
    excerpt: '',
    bodyHtml: '',
    coverImageUrl: '',
    readMinutes: '3',
    featured: false,
    status: 'DRAFT'
};

export default function Blogs() {
    const {
        posts,
        selectedPost,
        loading,
        saving,
        updatingId,
        fetchPosts,
        fetchPostDetail,
        createPost,
        updatePost,
        deletePost,
        changePostStatus,
        clearSelectedPost
    } = usePostStore();
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const debouncedKeyword = useDebounce(keyword, 500);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const filteredPosts = useMemo(() => {
        const search = debouncedKeyword.trim().toLowerCase();

        return posts.filter((post) => {
            const status = normalizePostStatus(post.status);
            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            const matchesKeyword =
                !search ||
                [post.title, post.excerpt, post.summary, post.slug, post.author?.fullName]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(search));

            return matchesStatus && matchesKeyword;
        });
    }, [posts, debouncedKeyword, statusFilter]);

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const openCreateModal = () => {
        setEditingPost(null);
        setFormData(initialFormData);
        setIsOpenModal(true);
    };

    const openEditModal = (post) => {
        setEditingPost(post);
        setFormData({
            title: post.title || '',
            dek: post.dek || '',
            excerpt: post.excerpt || post.summary || '',
            bodyHtml: post.bodyHtml || post.content || post.body || '',
            coverImageUrl: post.coverImageUrl || post.thumbnail || post.coverImage || post.image || '',
            readMinutes: post.readMinutes ? String(post.readMinutes) : '3',
            featured: Boolean(post.featured),
            status: normalizePostStatus(post.status)
        });
        setIsOpenModal(true);
    };

    const closeModal = () => {
        setIsOpenModal(false);
        setEditingPost(null);
        setFormData(initialFormData);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            title: formData.title.trim(),
            dek: formData.dek.trim(),
            excerpt: formData.excerpt.trim(),
            bodyHtml: formData.bodyHtml.trim(),
            coverImageUrl: formData.coverImageUrl.trim() || undefined,
            readMinutes: Number(formData.readMinutes || 3),
            featured: formData.featured,
            status: formData.status
        };

        const success = editingPost ? await updatePost(getPostId(editingPost), payload) : await createPost(payload);

        if (success) {
            closeModal();
        }
    };

    const handleDelete = async (post) => {
        if (!window.confirm(`Xóa bài viết "${post.title}"?`)) {
            return;
        }

        await deletePost(getPostId(post));
    };

    const handleStatusChange = async (post, status) => {
        if (normalizePostStatus(post.status) === status) {
            return;
        }

        await changePostStatus(getPostId(post), status);
    };

    const openDetailModal = async (post) => {
        await fetchPostDetail(post);
    };

    const closeDetailModal = () => {
        clearSelectedPost();
    };

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <div>
                    <div className={cx('title')}>Quản lý bài viết</div>
                    <div className={cx('subtitle')}>
                        Tạo, cập nhật, xem chi tiết, xóa và chuyển trạng thái draft/public cho bài viết.
                    </div>
                </div>

                <button className={cx('primaryBtn')} type="button" onClick={openCreateModal}>
                    Tạo bài viết
                </button>
            </div>

            <div className={cx('toolbar')}>
                <input
                    className={cx('input')}
                    type="search"
                    placeholder="Tìm theo tiêu đề, mô tả, slug"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                />
                <select
                    className={cx('select')}
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">Tất cả trạng thái</option>
                    {postStatuses.map((status) => (
                        <option key={status} value={status}>
                            {postStatusLabels[status]}
                        </option>
                    ))}
                </select>
            </div>

            <div className={cx('summary')}>
                <div>
                    <strong>{filteredPosts.length}</strong>
                    <span>Bài viết hiển thị</span>
                </div>
                <div>
                    <strong>{posts.filter((post) => normalizePostStatus(post.status) === 'DRAFT').length}</strong>
                    <span>Draft</span>
                </div>
                <div>
                    <strong>{posts.filter((post) => normalizePostStatus(post.status) === 'PUBLISHED').length}</strong>
                    <span>Public</span>
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('tableWrap')}>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Bài viết</th>
                                <th>Trạng thái</th>
                                <th>Tạo lúc</th>
                                <th>Cập nhật</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="5">
                                        Đang tải danh sách bài viết...
                                    </td>
                                </tr>
                            ) : filteredPosts.length === 0 ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="5">
                                        Không có bài viết phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredPosts.map((post) => {
                                    const postId = getPostId(post);
                                    const status = normalizePostStatus(post.status);
                                    const thumbnail = getPostCover(post);

                                    return (
                                        <tr key={postId}>
                                            <td>
                                                <div className={cx('postCell')}>
                                                    <div className={cx('thumb')}>
                                                        {thumbnail ? (
                                                            <img src={getImageUrl(thumbnail)} alt={post.title} />
                                                        ) : (
                                                            <span>{post.title?.slice(0, 1) || '?'}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <strong>{post.title}</strong>
                                                        <span>{post.excerpt || post.summary || post.slug || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <select
                                                    className={cx('statusSelect', status.toLowerCase())}
                                                    value={status}
                                                    disabled={updatingId === postId}
                                                    onChange={(event) => handleStatusChange(post, event.target.value)}
                                                >
                                                    {postStatuses.map((item) => (
                                                        <option key={item} value={item}>
                                                            {postStatusLabels[item]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>{formatDate(post.createdAt)}</td>
                                            <td>{formatDate(post.updatedAt)}</td>
                                            <td>
                                                <div className={cx('rowActions')}>
                                                    <button type="button" onClick={() => openDetailModal(post)}>
                                                        Chi tiết
                                                    </button>
                                                    <button type="button" onClick={() => openEditModal(post)}>
                                                        Sửa
                                                    </button>
                                                    <button
                                                        className={cx('danger')}
                                                        type="button"
                                                        onClick={() => handleDelete(post)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isOpenModal && (
                <div className={cx('modalOverlay')}>
                    <div className={cx('modalContent')}>
                        <div className={cx('modalHeader')}>
                            <h2>{editingPost ? 'Cập nhật bài viết' : 'Tạo bài viết mới'}</h2>
                            <button type="button" onClick={closeModal} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <PostForm
                            formData={formData}
                            saving={saving}
                            onChange={handleInputChange}
                            onClose={closeModal}
                            onSubmit={handleSubmit}
                        />
                    </div>
                </div>
            )}

            {selectedPost && (
                <div className={cx('modalOverlay')}>
                    <div className={cx('detailModal')}>
                        <div className={cx('modalHeader')}>
                            <div>
                                <h2>{selectedPost.title}</h2>
                                <span>{formatDate(selectedPost.updatedAt || selectedPost.createdAt)}</span>
                            </div>
                            <button type="button" onClick={closeDetailModal} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <div className={cx('detailBody')}>
                            {getPostCover(selectedPost) && (
                                <img
                                    className={cx('cover')}
                                    src={getImageUrl(getPostCover(selectedPost))}
                                    alt={selectedPost.title}
                                />
                            )}

                            <div className={cx('detailMeta')}>
                                <span className={cx('badge', normalizePostStatus(selectedPost.status).toLowerCase())}>
                                    {postStatusLabels[normalizePostStatus(selectedPost.status)]}
                                </span>
                                {selectedPost.slug && <span>{selectedPost.slug}</span>}
                            </div>

                            {(selectedPost.excerpt || selectedPost.summary) && (
                                <p className={cx('excerpt')}>{selectedPost.excerpt || selectedPost.summary}</p>
                            )}

                            <div
                                className={cx('content')}
                                dangerouslySetInnerHTML={{
                                    __html: getPostContent(selectedPost) || '<p>Bài viết chưa có nội dung.</p>'
                                }}
                            />

                            <div className={cx('modalActions')}>
                                <select
                                    className={cx(
                                        'statusSelect',
                                        normalizePostStatus(selectedPost.status).toLowerCase()
                                    )}
                                    value={normalizePostStatus(selectedPost.status)}
                                    disabled={updatingId === getPostId(selectedPost)}
                                    onChange={(event) => handleStatusChange(selectedPost, event.target.value)}
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="PUBLISHED">Public</option>
                                </select>
                                <button type="button" onClick={() => openEditModal(selectedPost)}>
                                    Sửa bài viết
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
