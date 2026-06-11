import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'sonner';
import { FaSearch } from 'react-icons/fa';

import { formatDate, getImageUrl, getPostId, getPostList } from '~/utils/dashboardUtils';
import useDebounce from '~/hooks/useDebounce';
import { postService } from '~/services/postService';

import styles from './Blog.module.scss';

const cx = classNames.bind(styles);

export default function Blog() {
    const [posts, setPosts] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const debouncedKeyword = useDebounce(keyword, 500);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const response = await postService.getPublicPosts();
                setPosts(
                    getPostList(response).sort(
                        (a, b) =>
                            new Date(b.publishedAt || b.createdAt || 0).getTime() -
                            new Date(a.publishedAt || a.createdAt || 0).getTime()
                    )
                );
            } catch (error) {
                console.error(error);
                toast.error(error?.response?.data?.message || 'Không tải được danh sách bài viết');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const filteredPosts = useMemo(() => {
        const search = debouncedKeyword.trim().toLowerCase();

        if (!search) {
            return posts;
        }

        return posts.filter((post) =>
            [post.title, post.excerpt, post.dek, post.slug, post.author?.fullName]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(search))
        );
    }, [debouncedKeyword, posts]);

    return (
        <div className={cx('blog-wrapper')}>
            <div className={cx('container')}>
                <div className={cx('blogHero')}>
                    <div className={cx('blog-header')}>
                        <span>Tin tức BookStory</span>
                        <h1>Bài viết mới nhất</h1>
                        <p>Cập nhật tin tức, review sách và những kiến thức hữu ích từ hệ thống blog.</p>
                    </div>

                    <div className={cx('toolbar')}>
                        <FaSearch className={cx('searchIcon')} />
                        <input
                            type="search"
                            placeholder="Tìm bài viết theo tiêu đề, mô tả, tác giả"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className={cx('empty')}>Đang tải danh sách bài viết...</div>
                ) : filteredPosts.length === 0 ? (
                    <div className={cx('empty')}>Chưa có bài viết phù hợp.</div>
                ) : (
                    <div className={cx('blog-grid')}>
                        {filteredPosts.map((post) => {
                            const postId = getPostId(post);
                            const category = post.categories?.[0]?.category?.name || 'BookStory';

                            return (
                                <article key={postId} className={cx('blog-card')}>
                                    <Link className={cx('thumb')} to={`/blog/${post.slug}`}>
                                        {post.coverImageUrl ? (
                                            <img src={getImageUrl(post.coverImageUrl)} alt={post.title} />
                                        ) : (
                                            <span className={cx('thumb-placeholder')}>
                                                {post.title?.slice(0, 1) || '?'}
                                            </span>
                                        )}
                                        <span className={cx('category-tag')}>{category}</span>
                                    </Link>
                                    <div className={cx('info')}>
                                        <span className={cx('date')}>
                                            {formatDate(post.publishedAt || post.createdAt)}
                                        </span>
                                        <Link className={cx('title')} to={`/blog/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                        <p className={cx('desc')}>
                                            {post.excerpt || post.dek || 'Bài viết từ BookStory.'}
                                        </p>
                                        <Link to={`/blog/${post.slug}`} className={cx('btn-readmore')}>
                                            Đọc thêm &rarr;
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
