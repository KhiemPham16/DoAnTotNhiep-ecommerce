import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'sonner';
import {
    FiAward,
    FiBookOpen,
    FiBriefcase,
    FiChevronLeft,
    FiChevronRight,
    FiCoffee,
    FiHeart,
    FiStar,
    FiTrendingUp,
    FiUsers
} from 'react-icons/fi';

import {
    formatDate,
    formatMoney,
    getImageUrl,
    getPostCover,
    getPostList,
    sortPostsByFeaturedAndDate
} from '~/utils/dashboardUtils';
import { categoryService } from '~/services/categoryService';
import { postService } from '~/services/postService';
import { productService } from '~/services/productService';

import styles from './Home.module.scss';

const cx = classNames.bind(styles);

const categoryIcons = [FiBookOpen, FiAward, FiCoffee, FiBriefcase, FiUsers];

const banners = [
    {
        badge: 'BookStory Sale',
        title: 'Tuần lễ sách hay, ưu đãi đến 30%',
        description: 'Khám phá các tựa sách nổi bật, sách mới và những lựa chọn được yêu thích trong tháng.',
        image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1400&auto=format&fit=crop&q=80',
        link: '/category',
        cta: 'Mua ngay'
    },
    {
        badge: 'Bộ sưu tập mới',
        title: 'Sách mới cập nhật mỗi ngày',
        description: 'Dữ liệu sản phẩm được đồng bộ trực tiếp từ hệ thống để bạn luôn thấy đầu sách mới nhất.',
        image: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=1400&auto=format&fit=crop&q=80',
        link: '/category',
        cta: 'Khám phá'
    },
    {
        badge: 'Góc độc giả',
        title: 'Tin tức, review và gợi ý đọc sách',
        description: 'Theo dõi blog BookStory để chọn đúng cuốn sách cho nhu cầu học tập, làm việc và giải trí.',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400&auto=format&fit=crop&q=80',
        link: '/blog',
        cta: 'Đọc blog'
    }
];

const getSalesScore = (product) =>
    Number(
        product.soldCount ||
            product.totalSold ||
            product.sold ||
            product.salesCount ||
            product.orderCount ||
            product.reviewCount ||
            0
    );

function ProductCard({ product, compact = false }) {
    const productPath = `/product/${product.slug}`;

    return (
        <article className={cx('book-card', { compact })}>
            <button className={cx('wishlist-btn')} type="button" aria-label="Yêu thích">
                <FiHeart />
            </button>
            <Link className={cx('book-thumb')} to={productPath}>
                {product.thumbnail ? (
                    <img src={getImageUrl(product.thumbnail)} alt={product.title} />
                ) : (
                    <span className={cx('thumb-placeholder')}>{product.title?.slice(0, 1) || '?'}</span>
                )}
            </Link>
            <div className={cx('book-info')}>
                <p className={cx('book-author')}>{product.author || product.category?.name || 'BookStory'}</p>
                <Link className={cx('book-title')} to={productPath}>
                    {product.title}
                </Link>
                <div className={cx('book-rating')}>
                    {[...Array(5)].map((_, index) => (
                        <FiStar key={index} className={cx('star')} />
                    ))}
                </div>
                <div className={cx('book-price-row')}>
                    <div className={cx('price-box')}>
                        <span className={cx('price')}>{formatMoney(product.price)}</span>
                        <span className={cx('stock')}>{Number(product.stock || 0)} còn lại</span>
                    </div>
                    <Link className={cx('add-cart-btn')} to={productPath}>
                        Xem
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default function Home() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeBanner, setActiveBanner] = useState(0);
    const [selectedBestCategoryId, setSelectedBestCategoryId] = useState('all');

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

    useEffect(() => {
        const timerId = window.setInterval(() => {
            setActiveBanner((current) => (current + 1) % banners.length);
        }, 5000);

        return () => window.clearInterval(timerId);
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

    const featuredCategories = useMemo(() => categories.slice(0, 5), [categories]);

    const featuredProducts = useMemo(() => {
        const featured = products.filter((product) => product.isFeatured);
        return (featured.length > 0 ? featured : products).slice(0, 15);
    }, [products]);

    const bestCategoryTabs = useMemo(() => categories.slice(0, 5), [categories]);

    const bestSellingProducts = useMemo(() => {
        const filteredProducts =
            selectedBestCategoryId === 'all'
                ? products
                : products.filter(
                      (product) =>
                          product.categoryId === selectedBestCategoryId || product.category?.id === selectedBestCategoryId
                  );

        return [...filteredProducts]
            .sort((a, b) => {
                const salesDiff = getSalesScore(b) - getSalesScore(a);

                if (salesDiff !== 0) {
                    return salesDiff;
                }

                if (Number(b.isFeatured) !== Number(a.isFeatured)) {
                    return Number(b.isFeatured) - Number(a.isFeatured);
                }

                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            })
            .slice(0, 10);
    }, [products, selectedBestCategoryId]);

    const newestProducts = useMemo(
        () =>
            [...products]
                .sort(
                    (a, b) =>
                        new Date(b.createdAt || b.updatedAt || 0).getTime() -
                        new Date(a.createdAt || a.updatedAt || 0).getTime()
                )
                .slice(0, 3),
        [products]
    );

    const latestPosts = useMemo(() => sortPostsByFeaturedAndDate(posts).slice(0, 3), [posts]);
    const currentBanner = banners[activeBanner];

    const goToBanner = (direction) => {
        setActiveBanner((current) => {
            if (direction === 'prev') {
                return current === 0 ? banners.length - 1 : current - 1;
            }

            return (current + 1) % banners.length;
        });
    };

    return (
        <div className={cx('home-wrapper')}>
            <section className={cx('hero')}>
                <img src={currentBanner.image} alt={currentBanner.title} />
                <div className={cx('hero-overlay')} />
                <div className={cx('hero-content')}>
                    <span className={cx('hero-badge')}>{currentBanner.badge}</span>
                    <h1>{currentBanner.title}</h1>
                    <p>{currentBanner.description}</p>
                    <Link className={cx('hero-btn')} to={currentBanner.link}>
                        {currentBanner.cta}
                    </Link>
                </div>
                <button className={cx('hero-control', 'prev')} type="button" onClick={() => goToBanner('prev')}>
                    <FiChevronLeft />
                </button>
                <button className={cx('hero-control', 'next')} type="button" onClick={() => goToBanner('next')}>
                    <FiChevronRight />
                </button>
                <div className={cx('hero-dots')}>
                    {banners.map((banner, index) => (
                        <button
                            key={banner.title}
                            className={cx({ active: activeBanner === index })}
                            type="button"
                            onClick={() => setActiveBanner(index)}
                            aria-label={`Chọn banner ${index + 1}`}
                        />
                    ))}
                </div>
            </section>

            <section className={cx('section')}>
                <div className={cx('section-header', 'left')}>
                    <div>
                        <h2>Danh mục sản phẩm</h2>
                    </div>
                    <Link to="/category">Xem tất cả</Link>
                </div>

                {loading ? (
                    <div className={cx('empty')}>Đang tải danh mục...</div>
                ) : featuredCategories.length === 0 ? (
                    <div className={cx('empty')}>Chưa có danh mục đang hoạt động.</div>
                ) : (
                    <div className={cx('category-grid')}>
                        {featuredCategories.map((category, index) => {
                            const Icon = categoryIcons[index % categoryIcons.length];

                            return (
                                <Link
                                    key={category.id}
                                    to={`/category?categoryId=${category.id}`}
                                    className={cx('category-card')}
                                >
                                    <div className={cx('cat-thumb')}>
                                        <Icon />
                                    </div>
                                    <div className={cx('cat-info')}>
                                        <h3>{category.name}</h3>
                                        <p>{productCountByCategory.get(category.id) || 0} sản phẩm</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            <div className={cx('bg-light')}>
                <section className={cx('section')}>
                    <div className={cx('section-header', 'left')}>
                        <div>
                            <h2>Sách nổi bật</h2>
                        </div>
                        <Link to="/category">Xem tất cả</Link>
                    </div>

                    {loading ? (
                        <div className={cx('empty')}>Đang tải sản phẩm...</div>
                    ) : featuredProducts.length === 0 ? (
                        <div className={cx('empty')}>Chưa có sản phẩm đang bán.</div>
                    ) : (
                        <div className={cx('book-grid')}>
                            {featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <section className={cx('section')}>
                <div className={cx('section-header', 'left')}>
                    <div>
                        <h2>Sản phẩm bán chạy</h2>
                        <p>Tìm nhanh theo 5 danh mục tùy chọn.</p>
                    </div>
                    <Link to="/category">Xem tất cả</Link>
                </div>

                <div className={cx('category-tabs')}>
                    <button
                        className={cx({ active: selectedBestCategoryId === 'all' })}
                        type="button"
                        onClick={() => setSelectedBestCategoryId('all')}
                    >
                        <FiTrendingUp />
                        Tất cả
                    </button>
                    {bestCategoryTabs.map((category) => (
                        <button
                            key={category.id}
                            className={cx({ active: selectedBestCategoryId === category.id })}
                            type="button"
                            onClick={() => setSelectedBestCategoryId(category.id)}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className={cx('empty')}>Đang tải sản phẩm bán chạy...</div>
                ) : bestSellingProducts.length === 0 ? (
                    <div className={cx('empty')}>Chưa có sản phẩm phù hợp.</div>
                ) : (
                    <div className={cx('book-grid', 'best-grid')}>
                        {bestSellingProducts.map((product) => (
                            <ProductCard key={product.id} product={product} compact />
                        ))}
                    </div>
                )}
            </section>

            <section className={cx('section', 'new-arrivals-section')}>
                <div className={cx('section-header', 'left')}>
                    <div>
                        <h2>Sách mới về hệ thống</h2>
                    </div>
                    <Link to="/category">Xem tất cả</Link>
                </div>

                {loading ? (
                    <div className={cx('empty')}>Đang tải sách mới...</div>
                ) : newestProducts.length === 0 ? (
                    <div className={cx('empty')}>Chưa có sách mới trong hệ thống.</div>
                ) : (
                    <div className={cx('new-arrivals-layout')}>
                        <Link className={cx('new-feature-card')} to={`/product/${newestProducts[0].slug}`}>
                            <div className={cx('new-feature-image')}>
                                {newestProducts[0].thumbnail ? (
                                    <img src={getImageUrl(newestProducts[0].thumbnail)} alt={newestProducts[0].title} />
                                ) : (
                                    <span>{newestProducts[0].title?.slice(0, 1) || '?'}</span>
                                )}
                            </div>
                            <div className={cx('new-feature-content')}>
                                <span>{newestProducts[0].category?.name || 'Sách mới'}</span>
                                <h3>{newestProducts[0].title}</h3>
                                <p>
                                    {newestProducts[0].description ||
                                        'Một tựa sách mới vừa được cập nhật vào hệ thống BookStory.'}
                                </p>
                                <strong>{formatMoney(newestProducts[0].price)}</strong>
                                <div>Chi tiết sách mới</div>
                            </div>
                        </Link>

                        <div className={cx('new-side-list')}>
                            {newestProducts.slice(1, 3).map((product) => (
                                <Link className={cx('new-side-card')} key={product.id} to={`/product/${product.slug}`}>
                                    <div className={cx('new-side-thumb')}>
                                        {product.thumbnail ? (
                                            <img src={getImageUrl(product.thumbnail)} alt={product.title} />
                                        ) : (
                                            <span>{product.title?.slice(0, 1) || '?'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3>{product.title}</h3>
                                        <p>{product.author || product.category?.name || 'BookStory'}</p>
                                        <strong>{formatMoney(product.price)}</strong>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </section>

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
                <div className={cx('section-header', 'left')}>
                    <div>
                        <h2>Góc độc giả & tin tức</h2>
                        <p>Cập nhật các bài viết đã xuất bản từ hệ thống blog.</p>
                    </div>
                    <Link to="/blog">Xem tất cả</Link>
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
