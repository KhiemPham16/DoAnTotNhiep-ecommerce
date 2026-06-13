import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'sonner';
import { FaArrowRight, FaCreditCard, FaTruck, FaUniversity, FaWallet } from 'react-icons/fa';

import { useAuthStore } from '~/stores/useAuthStore';
import { useCartStore } from '~/stores/useCartStore';
import { useCouponStore } from '~/stores/useCouponStore';
import { useAddressStore } from '~/stores/useAddressStore';
import { usePaymentMethodStore } from '~/stores/usePaymentMethodStore';
import { useOrderStore } from '~/stores/useOrderStore';
import { getImageUrl } from '~/utils/dashboardUtils';

import styles from './Pay.module.scss';

const cx = classNames.bind(styles);

const formatPrice = (value) => Number(value || 0).toLocaleString('vi-VN') + 'đ';

const getPaymentIcon = (code = '') => {
    const normalizedCode = code.toUpperCase();

    if (normalizedCode.includes('COD')) return <FaTruck />;
    if (normalizedCode.includes('BANK') || normalizedCode.includes('SEPAY')) return <FaUniversity />;
    if (normalizedCode.includes('MOMO') || normalizedCode.includes('ZALO')) return <FaWallet />;

    return <FaCreditCard />;
};

const isSepayMethod = (method) => {
    const paymentText = `${method?.code || ''} ${method?.name || ''} ${method?.description || ''}`.toUpperCase();

    return (
        paymentText.includes('SEPAY') ||
        paymentText.includes('BANK_TRANSFER') ||
        paymentText.includes('BANK') ||
        paymentText.includes('CHUYỂN KHOẢN') ||
        paymentText.includes('NGÂN HÀNG')
    );
};

export default function Pay() {
    const navigate = useNavigate();

    const { user } = useAuthStore();

    const { items, clearCart } = useCartStore();
    const { coupon, discountAmount, clearCoupon } = useCouponStore();
    const { address, fetchMyAddress, upsertMyAddress, saving: savingAddress } = useAddressStore();
    const { paymentMethods, fetchActivePaymentMethods } = usePaymentMethodStore();
    const { createOrder, creating, payingId } = useOrderStore();

    const [paymentMethodId, setPaymentMethodId] = useState('');

    const [formData, setFormData] = useState({
        receiverName: '',
        receiverPhone: '',
        email: '',
        provinceCity: '',
        ward: '',
        specificAddress: '',
        note: ''
    });

    useEffect(() => {
        fetchMyAddress();
        fetchActivePaymentMethods();
    }, [fetchMyAddress, fetchActivePaymentMethods]);

    useEffect(() => {
        if (address) {
            setFormData((prev) => ({
                ...prev,
                receiverName: address.receiverName || '',
                receiverPhone: address.receiverPhone || '',
                provinceCity: address.provinceCity || '',
                ward: address.ward || '',
                specificAddress: address.specificAddress || ''
            }));
        }
    }, [address]);

    // autofill phone from logged-in user if no saved address; keep editable
    useEffect(() => {
        if (!address && user?.phone) {
            setFormData((prev) => ({
                ...prev,
                receiverPhone: prev.receiverPhone || user.phone || ''
            }));
        }
    }, [user, address]);

    useEffect(() => {
        if (!paymentMethodId && paymentMethods.length > 0) {
            setPaymentMethodId(paymentMethods[0].id);
        }
    }, [paymentMethods, paymentMethodId]);

    const selectedPaymentMethod = useMemo(
        () => paymentMethods.find((method) => method.id === paymentMethodId),
        [paymentMethods, paymentMethodId]
    );

    const subTotal = useMemo(
        () => items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0),
        [items]
    );

    const shippingFee = 0;
    const totalBeforeDiscount = subTotal + shippingFee;
    const total = Math.max(0, totalBeforeDiscount - Number(discountAmount || 0));

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitOrder = async () => {
        if (items.length === 0) return toast.error('Giỏ hàng đang trống');
        if (!formData.receiverName.trim()) return toast.error('Vui lòng nhập họ và tên');
        if (!formData.receiverPhone.trim()) return toast.error('Vui lòng nhập số điện thoại');
        if (!formData.specificAddress.trim()) return toast.error('Vui lòng nhập địa chỉ nhận hàng');
        if (!paymentMethodId) return toast.error('Vui lòng chọn phương thức thanh toán');

        const savedAddress = await upsertMyAddress({
            receiverName: formData.receiverName,
            receiverPhone: formData.receiverPhone,
            provinceCity: formData.provinceCity || '-',
            ward: formData.ward || '-',
            specificAddress: formData.specificAddress
        });

        if (!savedAddress?.id) return;

        const checkoutPayload = {
            addressId: savedAddress.id,
            paymentMethodId,
            couponCode: coupon?.code || undefined,
            note: formData.note || undefined,
            items: items.map((item) => ({
                productId: item.id,
                quantity: item.quantity
            }))
        };

        // SePay: chưa tạo đơn ở Pay.jsx
        // Qua trang SePay trước, user bấm "Thanh toán ngay" mới tạo đơn
        if (isSepayMethod(selectedPaymentMethod)) {
            navigate('/sepay', {
                state: {
                    checkoutPayload,
                    paymentMethod: selectedPaymentMethod
                }
            });

            return;
        }

        // COD / phương thức thường: tạo đơn ngay
        const order = await createOrder(checkoutPayload);

        console.log('ORDER RESULT:', order);

        const orderId = order?.id || order?.orderId || order?.data?.id || order?.data?.orderId;

        if (!orderId) {
            toast.error('Không lấy được mã đơn hàng');
            return;
        }

        clearCart();
        clearCoupon();

        navigate('/payment-confirm', {
            state: {
                order: {
                    ...order,
                    id: orderId,
                    paymentMethod: selectedPaymentMethod
                }
            }
        });
    };

    const submitting = creating || savingAddress || Boolean(payingId);

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <main className={cx('left')}>
                    <section className={cx('card')}>
                        <h2>
                            <FaTruck />
                            1. Thông tin giao hàng
                        </h2>

                        <div className={cx('formGroup')}>
                            <label>Họ và tên</label>
                            <input
                                name="receiverName"
                                value={formData.receiverName}
                                onChange={handleChange}
                                placeholder="Nhập họ và tên người nhận"
                            />
                        </div>

                        <div className={cx('grid')}>
                            <div className={cx('formGroup')}>
                                <label>Số điện thoại</label>
                                <input
                                    name="receiverPhone"
                                    value={formData.receiverPhone}
                                    onChange={handleChange}
                                    placeholder="090x xxx xxx"
                                />
                            </div>

                            <div className={cx('formGroup')}>
                                <label>Email</label>
                                <input value={user?.email || ''} disabled readOnly />
                            </div>
                        </div>

                        <div className={cx('formGroup')}>
                            <label>Địa chỉ nhận hàng</label>
                            <textarea
                                name="specificAddress"
                                value={formData.specificAddress}
                                onChange={handleChange}
                                placeholder="Số nhà, tên đường, Phường/Xã..."
                            />
                        </div>
                    </section>

                    <section className={cx('card')}>
                        <h2>
                            <FaCreditCard />
                            3. Phương thức thanh toán
                        </h2>

                        <div className={cx('paymentGrid')}>
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    className={cx('paymentCard', {
                                        active: paymentMethodId === method.id
                                    })}
                                    onClick={() => setPaymentMethodId(method.id)}
                                >
                                    <span className={cx('paymentIcon')}>{getPaymentIcon(method.code)}</span>
                                    <strong>{method.name}</strong>
                                </button>
                            ))}
                        </div>
                    </section>
                </main>

                <aside className={cx('summary')}>
                    <h2>Tóm tắt đơn hàng ({items.length})</h2>

                    <div className={cx('summaryItems')}>
                        {items.map((item) => (
                            <div key={item.id} className={cx('summaryItem')}>
                                <img src={getImageUrl(item.thumbnail)} alt={item.title} />

                                <div>
                                    <h3>{item.title}</h3>
                                    <p>SL: {item.quantity}</p>
                                </div>

                                <strong>{formatPrice(Number(item.price || 0) * item.quantity)}</strong>
                            </div>
                        ))}
                    </div>

                    {coupon && (
                        <div className={cx('couponApplied')}>
                            <span>Đã áp dụng: {coupon.code}</span>

                            <button type="button" onClick={clearCoupon}>
                                Bỏ mã
                            </button>
                        </div>
                    )}

                    <div className={cx('priceRows')}>
                        <div>
                            <span>Tạm tính</span>
                            <strong>{formatPrice(subTotal)}</strong>
                        </div>

                        <div>
                            <span>Phí vận chuyển</span>
                            <strong>Free</strong>
                        </div>

                        <div className={cx('discount')}>
                            <span>Giảm giá</span>
                            <strong>-{formatPrice(discountAmount)}</strong>
                        </div>
                    </div>

                    <div className={cx('totalRow')}>
                        <span>Tổng thanh toán</span>
                        <strong>{formatPrice(total)}</strong>
                    </div>

                    <button type="button" className={cx('submitBtn')} onClick={handleSubmitOrder} disabled={submitting}>
                        {submitting ? 'Đang xử lý...' : 'HOÀN TẤT ĐẶT HÀNG'}
                        <FaArrowRight />
                    </button>
                </aside>
            </div>
        </div>
    );
}
