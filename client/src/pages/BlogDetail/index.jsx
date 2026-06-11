import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'sonner';

import { formatDate, getImageUrl, getPostContent, getPostCover, getPostData } from '~/utils/dashboardUtils';
import { postService } from '~/services/postService';

import styles from './BlogDetail.module.scss';

const cx = classNames.bind(styles);

export default function BlogDetail() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const response = await postService.getPostBySlug(slug);
                setPost(getPostData(response));
            } catch (error) {
                console.error(error);
                setPost(null);
                toast.error(error?.response?.data?.message || 'Không tải được chi tiết bài viết');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <div className={cx('detailWrapper')}>
                <div className={cx('container')}>
                    <div className={cx('stateBox')}>Đang tải chi tiết bài viết...</div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className={cx('detailWrapper')}>
                <div className={cx('container')}>
                    <div className={cx('stateBox')}>
                        <h1>Không tìm thấy bài viết</h1>
                        <Link to="/blog">Quay lại blog</Link>
                    </div>
                </div>
            </div>
        );
    }

    const categories = post.categories?.map((item) => item.category?.name).filter(Boolean) || [];
    const content = getPostContent(post);
    const coverImage = getPostCover(post);

    return (
        <article className={cx('detailWrapper')}>
            <div className={cx('container')}>
                <div className={cx('breadcrumb')}>
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <Link to="/blog">Blog</Link>
                </div>

                <header className={cx('header')}>
                    <div className={cx('meta')}>
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        {post.author?.fullName && <span>{post.author.fullName}</span>}
                        {post.readMinutes && <span>{post.readMinutes} phút đọc</span>}
                    </div>
                    <h1>{post.title}</h1>
                    {(post.excerpt || post.dek) && <p>{post.excerpt || post.dek}</p>}
                    {categories.length > 0 && (
                        <div className={cx('categories')}>
                            {categories.map((category) => (
                                <span key={category}>{category}</span>
                            ))}
                        </div>
                    )}
                </header>

                {coverImage && (
                    <div className={cx('cover')}>
                        <img src={getImageUrl(coverImage)} alt={post.title} />
                    </div>
                )}

                <div
                    className={cx('content')}
                    dangerouslySetInnerHTML={{ __html: content || '<p>Bài viết chưa có nội dung.</p>' }}
                />

                <div className={cx('footer')}>
                    <Link to="/blog">← Quay lại danh sách bài viết</Link>
                </div>
            </div>
        </article>
    );
}
