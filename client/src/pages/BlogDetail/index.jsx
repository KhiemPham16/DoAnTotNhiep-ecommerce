import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'sonner';
import { FaCalendarAlt, FaClock, FaEye, FaUser } from 'react-icons/fa';

import { formatDate, getImageUrl, getPostContent, getPostCover, getPostData } from '~/utils/dashboardUtils';
import { postService } from '~/services/postService';

import styles from './BlogDetail.module.scss';

const cx = classNames.bind(styles);
const formatViews = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

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
                    <span>/</span>
                    <span>{post.title}</span>
                </div>

                <header className={cx('header')}>
                    <h1>{post.title}</h1>
                    <div className={cx('meta')}>
                        {post.author?.fullName && (
                            <span>
                                <FaUser />
                                {post.author.fullName}
                            </span>
                        )}
                        <span>
                            <FaCalendarAlt />
                            {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                        <span>
                            <FaEye />
                            {formatViews(post.viewCount)} lượt xem
                        </span>
                        {post.readMinutes && (
                            <span>
                                <FaClock />
                                {post.readMinutes} phút đọc
                            </span>
                        )}
                    </div>
                    {(post.excerpt || post.dek) && <p className={cx('lead')}>{post.excerpt || post.dek}</p>}
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

                <div className={cx('contentWrap')}>
                    <div
                        className={cx('content')}
                        dangerouslySetInnerHTML={{ __html: content || '<p>Bài viết chưa có nội dung.</p>' }}
                    />
                </div>

                <div className={cx('footer')}>
                    <Link to="/blog">← Quay lại danh sách bài viết</Link>
                </div>
            </div>
        </article>
    );
}
