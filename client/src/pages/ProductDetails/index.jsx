import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'sonner';
import { FaCartPlus, FaCheckCircle, FaRegStar, FaShoppingBag, FaStar, FaUserCircle } from 'react-icons/fa';

import { formatDate, formatMoney, getImageUrl } from '~/utils/dashboardUtils';
import { productService } from '~/services/productService';
import { reviewService } from '~/services/reviewService';
import { useAuthStore } from '~/stores/useAuthStore';
import { useCartStore } from '~/stores/useCartStore';

import styles from './ProductDetails.module.scss';

const cx = classNames.bind(styles);

const getReviews = (response) => response?.data?.reviews || [];
const getPagination = (response) => response?.data?.pagination || null;

function RatingStars({ value = 0, interactive = false, onChange }) {
    return (
        <div className={cx('stars', { interactive })}>
            {[1, 2, 3, 4, 5].map((star) => {
                const Icon = star <= Number(value || 0) ? FaStar : FaRegStar;

                if (!interactive) {
                    return <Icon key={star} />;
                }

                return (
                    <button key={star} type="button" onClick={() => onChange(star)} aria-label={`${star} sao`}>
                        <Icon />
                    </button>
                );
            })}
        </div>
    );
}

export default function ProductDetails() {
    const navigate = useNavigate();
    const { slug } = useParams();
    const { accessToken, user } = useAuthStore();
    const { addToCart } = useCartStore();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewPagination, setReviewPagination] = useState(null);
    const [reviewPermission, setReviewPermission] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editReviewForm, setEditReviewForm] = useState({ rating: 5, comment: '' });
    const [updatingReview, setUpdatingReview] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [relatedLoading, setRelatedLoading] = useState(false);

    const currentUserId = user?.id || user?._id;

    const averageRating = useMemo(() => {
        const productRating = Number(product?.averageRating || 0);

        if (productRating > 0) return productRating;
        if (!reviews.length) return 0;

        return reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length;
    }, [product?.averageRating, reviews]);

    const reviewCount = Number(product?.reviewCount || reviewPagination?.total || reviews.length || 0);

    const fetchProduct = useCallback(async () => {
        try {
            setLoading(true);
            setQuantity(1);
            const response = await productService.getProductBySlug(slug);
            setProduct(response.data || null);
        } catch (error) {
            console.error(error);
            setProduct(null);
            toast.error(error?.response?.data?.message || 'Không tải được chi tiết sản phẩm');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    const fetchReviews = useCallback(async () => {
        if (!product?.id) return;

        try {
            setReviewsLoading(true);
            const response = await reviewService.getProductReviews(product.id, {
                page: 1,
                limit: 20
            });

            setReviews(getReviews(response));
            setReviewPagination(getPagination(response));
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được đánh giá sản phẩm');
        } finally {
            setReviewsLoading(false);
        }
    }, [product?.id]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    useEffect(() => {
        const fetchReviewPermission = async () => {
            if (!accessToken || !product?.id) {
                setReviewPermission(null);
                return;
            }

            try {
                const response = await reviewService.canReviewProduct(product.id);
                setReviewPermission(response.data || null);
            } catch (error) {
                console.error(error);
                setReviewPermission(null);
            }
        };

        fetchReviewPermission();
    }, [accessToken, product?.id]);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            const categoryId = product?.category?.id || product?.categoryId;

            if (!categoryId) {
                setRelatedProducts([]);
                return;
            }

            try {
                setRelatedLoading(true);
                const response = await productService.getProducts({
                    categoryId,
                    isActive: 'true',
                    limit: 8
                });

                setRelatedProducts((response.data || []).filter((item) => item.id !== product.id).slice(0, 4));
            } catch (error) {
                console.error(error);
                setRelatedProducts([]);
            } finally {
                setRelatedLoading(false);
            }
        };

        fetchRelatedProducts();
    }, [product]);

    const handleQuantityChange = (type) => {
        if (type === 'dec') {
            setQuantity((prev) => Math.max(1, prev - 1));
            return;
        }

        setQuantity((prev) => Math.min(Number(product?.stock || 1), prev + 1));
    };

    const buildCartProduct = (targetProduct) => ({
        id: targetProduct.id,
        title: targetProduct.title,
        price: targetProduct.price,
        thumbnail: targetProduct.thumbnail,
        stock: targetProduct.stock,
        category: targetProduct.category,
        author: targetProduct.author,
        publisher: targetProduct.publisher,
        isbn: targetProduct.isbn,
        tagline: targetProduct.tagline
    });

    const handleAddToCart = (targetProduct = product, amount = quantity) => {
        if (!targetProduct) return;

        if (Number(targetProduct.stock || 0) <= 0) {
            toast.error('Sản phẩm đã hết hàng');
            return;
        }

        addToCart(buildCartProduct(targetProduct), amount);
    };

    const handleBuyNow = (targetProduct = product, amount = quantity) => {
        if (!targetProduct) return;

        if (Number(targetProduct.stock || 0) <= 0) {
            toast.error('Sản phẩm đã hết hàng');
            return;
        }

        addToCart(buildCartProduct(targetProduct), amount);
        navigate('/cart');
    };

    const handleSubmitReview = async (event) => {
        event.preventDefault();

        if (!reviewPermission?.canReview || !reviewPermission?.orderId) {
            toast.error('Bạn chỉ có thể đánh giá sản phẩm đã mua và đơn hàng đã hoàn thành');
            return;
        }

        try {
            setSubmittingReview(true);
            await reviewService.createReview({
                productId: product.id,
                orderId: reviewPermission.orderId,
                rating: Number(reviewForm.rating),
                comment: reviewForm.comment.trim()
            });

            toast.success('Đánh giá sản phẩm thành công');
            setReviewForm({ rating: 5, comment: '' });
            setReviewPermission((prev) => (prev ? { ...prev, canReview: false } : prev));
            await Promise.all([fetchReviews(), fetchProduct()]);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không gửi được đánh giá');
        } finally {
            setSubmittingReview(false);
        }
    };

    const startEditReview = (review) => {
        setEditingReviewId(review.id);
        setEditReviewForm({
            rating: Number(review.rating || 5),
            comment: review.comment || ''
        });
    };

    const cancelEditReview = () => {
        setEditingReviewId(null);
        setEditReviewForm({ rating: 5, comment: '' });
    };

    const handleUpdateReview = async (event) => {
        event.preventDefault();

        if (!editingReviewId) return;

        try {
            setUpdatingReview(true);
            await reviewService.updateReview(editingReviewId, {
                rating: Number(editReviewForm.rating),
                comment: editReviewForm.comment.trim()
            });

            toast.success('Cập nhật đánh giá thành công');
            cancelEditReview();
            await Promise.all([fetchReviews(), fetchProduct()]);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không cập nhật được đánh giá');
        } finally {
            setUpdatingReview(false);
        }
    };

    if (loading) {
        return (
            <div className={cx('detail-wrapper')}>
                <div className={cx('container')}>
                    <div className={cx('stateBox')}>Đang tải chi tiết sản phẩm...</div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className={cx('detail-wrapper')}>
                <div className={cx('container')}>
                    <div className={cx('stateBox')}>
                        <h2>Không tìm thấy sản phẩm</h2>
                        <Link to="/category">Quay lại danh mục</Link>
                    </div>
                </div>
            </div>
        );
    }

    const inStock = Number(product.stock || 0) > 0;
    const thumbnail = product.thumbnail;

    return (
        <div className={cx('detail-wrapper')}>
            <div className={cx('container')}>
                <div className={cx('main-info')}>
                    <div className={cx('image-column')}>
                        <div className={cx('main-image')}>
                            {thumbnail ? (
                                <img src={getImageUrl(thumbnail)} alt={product.title} />
                            ) : (
                                <div className={cx('image-placeholder')}>{product.title?.slice(0, 1) || '?'}</div>
                            )}
                        </div>
                    </div>

                    <div className={cx('content-column')}>
                        <span className={cx('tag')}>{product.category?.name || 'Sản phẩm'}</span>
                        <h1 className={cx('product-title')}>{product.title}</h1>

                        <div className={cx('rating-row')}>
                            <RatingStars value={Math.round(averageRating)} />
                            <span className={cx('reviews-count')}>
                                {averageRating ? averageRating.toFixed(1) : 'Chưa có'} sao ({reviewCount} đánh giá)
                            </span>
                        </div>

                        <div className={cx('price-box')}>
                            <span className={cx('current-price')}>{formatMoney(product.price)}</span>
                        </div>

                        <div className={cx('book-meta')}>
                            <span>{product.tagline || '-'}</span>
                            <span>Tác giả: {product.author || '-'}</span>
                            <span>Nhà xuất bản: {product.publisher || '-'}</span>
                            <span>ISBN: {product.isbn || '-'}</span>
                        </div>

                        <div className={cx('status-row')}>
                            <FaCheckCircle className={cx(inStock ? 'icon-check' : 'icon-muted')} />
                            <span>
                                Tình trạng: <strong>{inStock ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}</strong>
                            </span>
                        </div>

                        <div className={cx('action-row')}>
                            <div className={cx('quantity-selector')}>
                                <button type="button" onClick={() => handleQuantityChange('dec')} disabled={!inStock}>
                                    -
                                </button>
                                <span>{quantity}</span>
                                <button type="button" onClick={() => handleQuantityChange('inc')} disabled={!inStock}>
                                    +
                                </button>
                            </div>

                            <button
                                className={cx('btn-add-cart')}
                                type="button"
                                disabled={!inStock}
                                onClick={() => handleAddToCart()}
                            >
                                <FaCartPlus />
                                Thêm vào giỏ hàng
                            </button>

                            <button
                                className={cx('btn-buy-now')}
                                type="button"
                                disabled={!inStock}
                                onClick={() => handleBuyNow()}
                            >
                                <FaShoppingBag />
                                Mua ngay
                            </button>
                        </div>
                    </div>
                </div>

                <section className={cx('detail-description')}>
                    <h2>Mô tả sản phẩm</h2>
                    <div className={cx('desc-content')}>
                        <p>{product.description || 'Sản phẩm chưa có mô tả chi tiết.'}</p>
                    </div>
                </section>

                <section className={cx('reviews-section')}>
                    <div className={cx('section-heading')}>
                        <div>
                            <h2>Đánh giá sản phẩm</h2>
                            <p>{reviewCount ? `${reviewCount} đánh giá từ khách hàng` : 'Chưa có đánh giá nào'}</p>
                        </div>
                        <div className={cx('rating-summary')}>
                            <strong>{averageRating ? averageRating.toFixed(1) : '0.0'}</strong>
                            <RatingStars value={Math.round(averageRating)} />
                        </div>
                    </div>

                    <div className={cx('review-layout')}>
                        <div className={cx('review-list')}>
                            {reviewsLoading ? (
                                <div className={cx('muted-box')}>Đang tải đánh giá...</div>
                            ) : reviews.length === 0 ? (
                                <div className={cx('muted-box')}>Sản phẩm này chưa có đánh giá.</div>
                            ) : (
                                reviews.map((review) => {
                                    const isMyReview = currentUserId && review.user?.id === currentUserId;
                                    const isEditing = editingReviewId === review.id;

                                    return (
                                        <article className={cx('review-item')} key={review.id}>
                                            <div className={cx('review-avatar')}>
                                                {review.user?.avatarUrl ? (
                                                    <img
                                                        src={getImageUrl(review.user.avatarUrl)}
                                                        alt={review.user.fullName}
                                                    />
                                                ) : (
                                                    <FaUserCircle />
                                                )}
                                            </div>

                                            <div className={cx('review-content')}>
                                                <div className={cx('review-top')}>
                                                    <div>
                                                        <strong>{review.user?.fullName || 'Khách hàng'}</strong>
                                                        {isMyReview && <small>Đánh giá của bạn</small>}
                                                    </div>
                                                    <span>{formatDate(review.createdAt)}</span>
                                                </div>

                                                {isEditing ? (
                                                    <form
                                                        className={cx('inline-review-form')}
                                                        onSubmit={handleUpdateReview}
                                                    >
                                                        <RatingStars
                                                            value={editReviewForm.rating}
                                                            interactive
                                                            onChange={(rating) =>
                                                                setEditReviewForm((prev) => ({ ...prev, rating }))
                                                            }
                                                        />
                                                        <textarea
                                                            value={editReviewForm.comment}
                                                            onChange={(event) =>
                                                                setEditReviewForm((prev) => ({
                                                                    ...prev,
                                                                    comment: event.target.value
                                                                }))
                                                            }
                                                            rows={4}
                                                        />
                                                        <div className={cx('review-actions')}>
                                                            <button type="submit" disabled={updatingReview}>
                                                                {updatingReview ? 'Đang lưu...' : 'Lưu thay đổi'}
                                                            </button>
                                                            <button type="button" onClick={cancelEditReview}>
                                                                Hủy
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <>
                                                        <RatingStars value={review.rating} />
                                                        <p>{review.comment || 'Khách hàng chưa để lại nhận xét.'}</p>
                                                        {isMyReview && (
                                                            <div className={cx('review-actions')}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => startEditReview(review)}
                                                                >
                                                                    Sửa đánh giá
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </div>

                        <form className={cx('review-form')} onSubmit={handleSubmitReview}>
                            <h3>Viết đánh giá</h3>

                            {!accessToken ? (
                                <p className={cx('review-note')}>
                                    Vui lòng <Link to="/auth/login">đăng nhập</Link> để kiểm tra quyền đánh giá.
                                </p>
                            ) : reviewPermission?.canReview ? (
                                <>
                                    <label>Chọn số sao</label>
                                    <RatingStars
                                        value={reviewForm.rating}
                                        interactive
                                        onChange={(rating) => setReviewForm((prev) => ({ ...prev, rating }))}
                                    />

                                    <label htmlFor="review-comment">Nhận xét</label>
                                    <textarea
                                        id="review-comment"
                                        value={reviewForm.comment}
                                        onChange={(event) =>
                                            setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
                                        }
                                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm"
                                        rows={5}
                                    />

                                    <button type="submit" disabled={submittingReview}>
                                        {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                                    </button>
                                </>
                            ) : (
                                <p className={cx('review-note')}>
                                    Chỉ khách hàng đã mua sản phẩm và có đơn hàng hoàn thành mới được đánh giá.
                                </p>
                            )}
                        </form>
                    </div>
                </section>

                <section className={cx('related-section')}>
                    <div className={cx('section-heading')}>
                        <div>
                            <h2>Sản phẩm cùng danh mục</h2>
                            <p>{product.category?.name || 'Gợi ý dành cho bạn'}</p>
                        </div>
                        <Link to={`/category?categoryId=${product.category?.id || ''}`}>Xem thêm</Link>
                    </div>

                    {relatedLoading ? (
                        <div className={cx('muted-box')}>Đang tải sản phẩm gợi ý...</div>
                    ) : relatedProducts.length === 0 ? (
                        <div className={cx('muted-box')}>Chưa có sản phẩm cùng danh mục.</div>
                    ) : (
                        <div className={cx('related-grid')}>
                            {relatedProducts.slice(0, 4).map((item) => (
                                <article key={item.id} className={cx('related-card')}>
                                    <Link to={`/product/${item.id}`} className={cx('related-link')}>
                                        <div className={cx('related-thumb')}>
                                            {item.thumbnail ? (
                                                <img src={getImageUrl(item.thumbnail)} alt={item.title} />
                                            ) : (
                                                <span>{item.title?.slice(0, 1) || '?'}</span>
                                            )}
                                        </div>

                                        <div className={cx('related-info')}>
                                            <span>{item.category?.name || product.category?.name || 'Sản phẩm'}</span>
                                            <h3>{item.title}</h3>
                                            <strong>{formatMoney(item.price)}</strong>
                                        </div>
                                    </Link>

                                    <div className={cx('related-actions')}>
                                        <button
                                            className={cx('related-action-btn', 'cart-btn')}
                                            type="button"
                                            onClick={() => handleAddToCart(item, 1)}
                                            title="Thêm vào giỏ hàng"
                                            aria-label="Thêm vào giỏ hàng"
                                        >
                                            <FaCartPlus />
                                        </button>

                                        <button
                                            className={cx('related-action-btn', 'buy-btn')}
                                            type="button"
                                            onClick={() => handleBuyNow(item, 1)}
                                            title="Mua ngay"
                                            aria-label="Mua ngay"
                                        >
                                            <FaShoppingBag />
                                            <span>Mua</span>
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
