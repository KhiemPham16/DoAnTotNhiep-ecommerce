import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';

import { getImageUrl, getPostCover, getPostId, normalizePostStatus, postStatusLabels } from '~/utils/dashboardUtils';
import { usePostStore } from '~/stores/usePostStore';

import PostForm from './PostForm';
import styles from './DashboardBlogs.module.scss';

const cx = classNames.bind(styles);

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

const getEditorPath = (post, preview = false) => {
    const status = normalizePostStatus(post.status) === 'PUBLISHED' ? 'public' : 'draft';
    return `/dashboard/blogs/${status}/edit/${getPostId(post)}${preview ? '?preview' : ''}`;
};

export default function BlogEditor() {
    const navigate = useNavigate();
    const { postStatus, postId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { selectedPost, loading, saving, fetchAdminPost, updatePost, clearSelectedPost } = usePostStore();
    const [formData, setFormData] = useState(initialFormData);
    const isPreview = searchParams.has('preview');

    useEffect(() => {
        fetchAdminPost(postId);

        return () => {
            clearSelectedPost();
        };
    }, [postId, fetchAdminPost, clearSelectedPost]);

    useEffect(() => {
        if (!selectedPost || getPostId(selectedPost) !== postId) {
            return;
        }

        const actualPostStatus = normalizePostStatus(selectedPost.status) === 'PUBLISHED' ? 'public' : 'draft';

        if (postStatus !== actualPostStatus) {
            navigate(getEditorPath(selectedPost, isPreview), { replace: true });
            return;
        }

        setFormData({
            title: selectedPost.title || '',
            dek: selectedPost.dek || '',
            excerpt: selectedPost.excerpt || selectedPost.summary || '',
            bodyHtml: selectedPost.bodyHtml || selectedPost.content || selectedPost.body || '',
            coverImageUrl:
                selectedPost.coverImageUrl ||
                selectedPost.thumbnail ||
                selectedPost.coverImage ||
                selectedPost.image ||
                '',
            readMinutes: selectedPost.readMinutes ? String(selectedPost.readMinutes) : '3',
            featured: Boolean(selectedPost.featured),
            status: normalizePostStatus(selectedPost.status)
        });
    }, [selectedPost, postId, postStatus, isPreview, navigate]);

    const previewPost = useMemo(
        () => ({
            ...selectedPost,
            ...formData
        }),
        [selectedPost, formData]
    );

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            title: formData.title.trim(),
            dek: formData.dek.trim() || null,
            excerpt: formData.excerpt.trim() || null,
            bodyHtml: formData.bodyHtml.trim() || null,
            coverImageUrl: formData.coverImageUrl.trim() || null,
            readMinutes: Number(formData.readMinutes || 1),
            featured: formData.featured,
            status: formData.status
        };

        const updatedPost = await updatePost(postId, payload);

        if (updatedPost) {
            navigate(getEditorPath(updatedPost, isPreview), { replace: true });
        }
    };

    const handleClose = () => {
        navigate('/dashboard/blogs');
    };

    const togglePreview = () => {
        if (isPreview) {
            setSearchParams({});
            return;
        }

        setSearchParams({ preview: '' });
    };

    if (loading && !selectedPost) {
        return <div className={cx('empty')}>Đang tải bài viết...</div>;
    }

    return (
        <div className={cx('editorPage')}>
            <div className={cx('editorHeader')}>
                <div>
                    <button type="button" className={cx('textBtn')} onClick={handleClose}>
                        Quay lại
                    </button>
                    <h1>{formData.title || 'Chưa có tiêu đề'}</h1>
                    <div className={cx('detailMeta')}>
                        <span className={cx('badge', formData.status.toLowerCase())}>
                            {postStatusLabels[formData.status]}
                        </span>
                        {selectedPost?.slug && <span>{selectedPost.slug}</span>}
                    </div>
                </div>
                <div className={cx('editorActions')}>
                    <button type="button" onClick={togglePreview}>
                        {isPreview ? 'Tắt preview' : 'Preview'}
                    </button>
                    {selectedPost?.slug && formData.status === 'PUBLISHED' && (
                        <button type="button" onClick={() => window.open(`/blog/${selectedPost.slug}`, '_blank')}>
                            Xem bài public
                        </button>
                    )}
                </div>
            </div>

            <div className={cx('editorLayout', { previewMode: isPreview })}>
                <div className={cx('editorForm')}>
                    <PostForm
                        formData={formData}
                        saving={saving}
                        onChange={handleInputChange}
                        onClose={handleClose}
                        onSubmit={handleSubmit}
                    />
                </div>

                {isPreview && (
                    <article className={cx('previewPane')}>
                        {getPostCover(previewPost) && (
                            <img
                                className={cx('cover')}
                                src={getImageUrl(getPostCover(previewPost))}
                                alt={previewPost.title}
                            />
                        )}
                        <h2>{previewPost.title || 'Chưa có tiêu đề'}</h2>
                        {previewPost.dek && <p className={cx('previewDek')}>{previewPost.dek}</p>}
                        {previewPost.excerpt && <p className={cx('excerpt')}>{previewPost.excerpt}</p>}
                        <div
                            className={cx('content')}
                            dangerouslySetInnerHTML={{
                                __html: previewPost.bodyHtml || '<p>Bài viết chưa có nội dung.</p>'
                            }}
                        />
                    </article>
                )}
            </div>
        </div>
    );
}
