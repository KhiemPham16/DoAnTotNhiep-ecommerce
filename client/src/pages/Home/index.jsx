import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'sonner';
import { FaRegHeart, FaStar } from 'react-icons/fa';

import { formatDate, formatMoney, getImageUrl, getPostCover, getPostList, sortPostsByFeaturedAndDate } from '~/utils/dashboardUtils';
import { categoryService } from '~/services/categoryService';
import { postService } from '~/services/postService';
import { productService } from '~/services/productService';

import styles from './Home.module.scss';

const cx = classNames.bind(styles);

export default function Home() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoading(true);

                const [categoryResponse, productResponse, postResponse] = await Promise.all([
                    categoryService.getCategories(),
                    productService.getProducts({
                        isActive: 'true',
                        limit: 100
                    }),
                    postService.getPublicPosts()
                ]);

                setCategories((categoryResponse.data || []).filter((category) => category.isActive));
                setProducts(productResponse.data || []);
                setPosts(sortPostsByFeaturedAndDate(getPostList(postResponse)));
            } catch (error) {
                console.error(error);
                toast.error(error?.response?.data?.message || 'Không tải được dữ liệu trang chủ');
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    const productCountByCategory = useMemo(() => {
        const countMap = new Map();

        products.forEach((product) => {
            const categoryId = product.categoryId || product.category?.id;

            if (categoryId) {
                countMap.set(categoryId, (countMap.get(categoryId) || 0) + 1);
            }
        });

        return countMap;
    }, [products]);

    const featuredProducts = useMemo(() => {
        const featured = products.filter((product) => product.isFeatured);
        return (featured.length > 0 ? featured : products).slice(0, 8);
    }, [products]);

    const latestPosts = useMemo(() => sortPostsByFeaturedAndDate(posts).slice(0, 3), [posts]);

    return (
        <div className={cx('home-wrapper')}>
            <section className={cx('hero')}>
                <div className={cx('hero-content')}>
                    <span className={cx('hero-badge')}>Chào mừng đến với BookStory</span>
                    <h1 className={cx('hero-title')}>Khám phá thế giới qua những trang sách tinh hoa</h1>
                    <p className={cx('hero-desc')}>
                        Tìm kiếm và sở hữu những tựa sách đang có trong hệ thống với dữ liệu sản phẩm được cập nhật trực
                        tiếp.
                    </p>
                    <Link className={cx('hero-btn')} to="/category">
                        Mua ngay
                    </Link>
                </div>
                <div className={cx('hero-image-area')}>
                    <div className={cx('hero-image-wrapper')}>
                        <img
                            src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80"
                            alt="Hero Books"
                        />
                    </div>
                </div>
            </section>

            <section className={cx('section')}>
                <div className={cx('section-header')}>
                    <h2>Danh mục sách nổi bật</h2>
                    <p>Tìm kiếm sách dễ dàng theo từng chủ đề đang hoạt động trong hệ thống</p>
                </div>

                {loading ? (
                    <div className={cx('empty')}>Đang tải danh mục...</div>
                ) : categories.length === 0 ? (
                    <div className={cx('empty')}>Chưa có danh mục đang hoạt động.</div>
                ) : (
                    <div className={cx('category-grid')}>
                        {categories.slice(0, 6).map((category) => (
                            <Link
                                key={category.id}
                                to={`/category?categoryId=${category.id}`}
                                className={cx('category-card')}
                            >
                                <div className={cx('cat-thumb')}>
                                    <span>{category.name?.slice(0, 1) || '?'}</span>
                                </div>
                                <div className={cx('cat-info')}>
                                    <h3>{category.name}</h3>
                                    <p>{productCountByCategory.get(category.id) || 0} sản phẩm</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <div className={cx('bg-light')}>
                <section className={cx('section')}>
                    <div className={cx('section-header')}>
                        <h2>Sách nổi bật</h2>
                        <p>Những sản phẩm mới nhất và nổi bật đang được bán trên hệ thống</p>
                    </div>

                    {loading ? (
                        <div className={cx('empty')}>Đang tải sản phẩm...</div>
                    ) : featuredProducts.length === 0 ? (
                        <div className={cx('empty')}>Chưa có sản phẩm đang bán.</div>
                    ) : (
                        <div className={cx('book-grid')}>
                            {featuredProducts.map((product) => (
                                <div key={product.id} className={cx('book-card')}>
                                    <button className={cx('wishlist-btn')} type="button" aria-label="Wishlist">
                                        <FaRegHeart />
                                    </button>
                                    <Link className={cx('book-thumb')} to={`/product/${product.id}`}>
                                        {product.thumbnail ? (
                                            <img src={getImageUrl(product.thumbnail)} alt={product.title} />
                                        ) : (
                                            <span className={cx('thumb-placeholder')}>
                                                {product.title?.slice(0, 1) || '?'}
                                            </span>
                                        )}
                                    </Link>
                                    <div className={cx('book-info')}>
                                        <p className={cx('book-author')}>
                                            {product.author || product.category?.name || 'BookStory'}
                                        </p>
                                        <Link className={cx('book-title')} to={`/product/${product.id}`}>
                                            {product.title}
                                        </Link>
                                        <div className={cx('book-rating')}>
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar key={i} className={cx('star')} />
                                            ))}
                                        </div>
                                        <div className={cx('book-price-row')}>
                                            <div className={cx('price-box')}>
                                                <span className={cx('price')}>{formatMoney(product.price)}</span>
                                                <span className={cx('stock')}>
                                                    {Number(product.stock || 0)} còn lại
                                                </span>
                                            </div>
                                            <Link className={cx('add-cart-btn')} to={`/product/${product.id}`}>
                                                Xem chi tiết
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <section className={cx('promo-section')}>
                <div className={cx('promo-content')}>
                    <div className={cx('promo-badge')}>BookStory</div>
                    <h2>Khám phá kho sách đang có sẵn</h2>
                    <p>
                        Danh mục và sản phẩm được đồng bộ trực tiếp từ hệ thống quản trị để bạn luôn thấy dữ liệu mới
                        nhất.
                    </p>
                    <Link className={cx('promo-btn')} to="/category">
                        Khám phá ngay
                    </Link>
                </div>
            </section>

            <section className={cx('section')}>
                <div className={cx('section-header')}>
                    <h2>Góc độc giả & tin tức</h2>
                    <p>Cập nhật các bài viết đã xuất bản từ hệ thống blog</p>
                </div>

                {loading ? (
                    <div className={cx('empty')}>Đang tải bài viết...</div>
                ) : latestPosts.length === 0 ? (
                    <div className={cx('empty')}>Chưa có bài viết đã xuất bản.</div>
                ) : (
                    <div className={cx('blog-grid')}>
                        {latestPosts.map((post) => (
                            <article key={post.id} className={cx('blog-card')}>
                                <div className={cx('blog-thumb')}>
                                    {getPostCover(post) ? (
                                        <img src={getImageUrl(getPostCover(post))} alt={post.title} />
                                    ) : (
                                        <span className={cx('thumb-placeholder')}>
                                            {post.title?.slice(0, 1) || '?'}
                                        </span>
                                    )}
                                </div>
                                <div className={cx('blog-info')}>
                                    <span className={cx('blog-date')}>
                                        {formatDate(post.publishedAt || post.createdAt)}
                                    </span>
                                    <h3>{post.title}</h3>
                                    <p>{post.excerpt || post.dek || 'Bài viết từ BookStory.'}</p>
                                    <Link to={`/blog/${post.slug}`} className={cx('blog-link')}>
                                        Đọc tiếp
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
