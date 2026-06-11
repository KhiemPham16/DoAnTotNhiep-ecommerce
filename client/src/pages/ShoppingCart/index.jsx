import { useState } from 'react';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowRight } from 'react-icons/fa';
import { useCartStore } from '~/stores/useCartStore';
import { useCouponStore } from '~/stores/useCouponStore';

import styles from './ShoppingCart.module.scss';

const cx = classNames.bind(styles);

const formatPrice = (value) => Number(value || 0).toLocaleString('vi-VN') + 'đ';

const getImageUrl = (thumbnail) => {
    if (!thumbnail) return '/images/no-image.png';
    if (/^https?:\/\//i.test(thumbnail)) return thumbnail;

    return `${import.meta.env.VITE_API_URL}${thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`}`;
};

export default function ShoppingCart() {
    const navigate = useNavigate();

    const { items, removeFromCart, updateQuantity } = useCartStore();

    const { coupon: appliedCoupon, discountAmount, applying, applyCoupon, clearCoupon } = useCouponStore();

    const [couponCode, setCouponCode] = useState('');

    const subTotal = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

    const shippingFee = 0;
    const totalBeforeDiscount = subTotal + shippingFee;
    const total = Math.max(0, totalBeforeDiscount - Number(discountAmount || 0));

    const handleChangeQuantity = (id, quantity) => {
        if (quantity < 1) return;
        updateQuantity(id, quantity);
    };

    const handleApplyCoupon = async () => {
        await applyCoupon(couponCode, totalBeforeDiscount);
    };

    const handleGoToPay = () => {
        navigate('/pay');
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('cartList')}>
                    {items.length === 0 ? (
                        <div className={cx('empty')}>Giỏ hàng đang trống</div>
                    ) : (
                        items.map((item) => (
                            <div className={cx('cartItem')} key={item.id}>
                                <div className={cx('thumb')}>
                                    <img src={getImageUrl(item.thumbnail)} alt={item.title} />
                                </div>

                                <div className={cx('info')}>
                                    <h3>{item.title}</h3>
                                    <p>Size: 10 | Color: Safety Yellow</p>

                                    <div className={cx('quantity')}>
                                        <button onClick={() => handleChangeQuantity(item.id, item.quantity - 1)}>
                                            -
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => handleChangeQuantity(item.id, item.quantity + 1)}>
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className={cx('price')}>{formatPrice(item.price)}</div>

                                <button className={cx('removeBtn')} onClick={() => removeFromCart(item.id)}>
                                    <FaTrash />
                                    <span>Remove</span>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <aside className={cx('summary')}>
                    <h2>Chi tiết đơn hàng</h2>

                    <div className={cx('summaryRow')}>
                        <span>Tạm tính</span>
                        <strong>{formatPrice(subTotal)}</strong>
                    </div>

                    <div className={cx('summaryRow')}>
                        <span>Giảm giá</span>
                        <strong>-{formatPrice(discountAmount)}</strong>
                    </div>

                    <div className={cx('summaryRow')}>
                        <span>Phí vận chuyển</span>
                        <strong className={cx('free')}>Free</strong>
                    </div>

                    <div className={cx('totalRow')}>
                        <span>Tổng cộng</span>
                        <strong>{formatPrice(total)}</strong>
                    </div>

                    <div className={cx('coupon')}>
                        <label>Mã giảm giá</label>

                        <div className={cx('couponBox')}>
                            <input
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Nhập mã giảm giá"
                            />

                            <button type="button" onClick={handleApplyCoupon} disabled={applying}>
                                {applying ? 'Đang áp dụng...' : 'Nhập Mã'}
                            </button>
                        </div>

                        {appliedCoupon && (
                            <div className={cx('couponApplied')}>
                                <span>Đã áp dụng: {appliedCoupon.code}</span>

                                <button type="button" onClick={clearCoupon}>
                                    Bỏ mã
                                </button>
                            </div>
                        )}
                    </div>

                    <button className={cx('checkoutBtn')} disabled={items.length === 0} onClick={handleGoToPay}>
                        Tiến hành thanh toán
                        <FaArrowRight />
                    </button>
                </aside>
            </div>
        </div>
    );
}
