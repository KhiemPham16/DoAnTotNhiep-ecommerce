import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';

import { useOrderStore } from '~/stores/useOrderStore';
import { formatMoney, getImageUrl } from '~/utils/dashboardUtils';

import styles from './OrderDetail.module.scss';

const cx = classNames.bind(styles);

const orderStatusLabels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy'
};

const paymentStatusLabels = {
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    FAILED: 'Thanh toán thất bại',
    REFUNDED: 'Đã hoàn tiền'
};

export default function OrderDetail() {
    const { id } = useParams();

    const { selectedOrder: order, loading, fetchMyOrderDetail } = useOrderStore();

    useEffect(() => {
        fetchMyOrderDetail(id);
    }, [id, fetchMyOrderDetail]);

    if (loading) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('stateBox')}>Đang tải chi tiết đơn hàng...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={cx('wrapper')}>
                <div className={cx('stateBox')}>Không tìm thấy đơn hàng.</div>
            </div>
        );
    }

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <div>
                    <Link to="/account/orders">← Quay lại</Link>
                    <h2>Đơn hàng #{order.id.slice(0, 8)}</h2>
                    <p>{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                </div>

                <div className={cx('badges')}>
                    <span className={cx('badge', order.status?.toLowerCase())}>
                        {orderStatusLabels[order.status] || order.status}
                    </span>

                    <span className={cx('paymentBadge')}>
                        {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                    </span>
                </div>
            </div>

            <div className={cx('grid')}>
                <section className={cx('card')}>
                    <h3>Thông tin giao hàng</h3>

                    <p>
                        <strong>Người nhận:</strong> {order.address?.receiverName}
                    </p>
                    <p>
                        <strong>Số điện thoại:</strong> {order.address?.receiverPhone}
                    </p>
                    <p>
                        <strong>Địa chỉ:</strong>{' '}
                        {[order.address?.specificAddress, order.address?.ward, order.address?.provinceCity]
                            .filter(Boolean)
                            .join(', ')}
                    </p>
                </section>

                <section className={cx('card')}>
                    <h3>Thanh toán</h3>

                    <p>
                        <strong>Phương thức:</strong> {order.paymentMethod?.name || '-'}
                    </p>
                    <p>
                        <strong>Trạng thái:</strong> {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                    </p>
                    <p>
                        <strong>Mã giảm giá:</strong> {order.coupon?.code || '-'}
                    </p>
                </section>
            </div>

            <section className={cx('card')}>
                <h3>Sản phẩm</h3>

                <div className={cx('items')}>
                    {order.items?.map((item) => (
                        <div className={cx('item')} key={item.id}>
                            <img src={getImageUrl(item.product?.thumbnail)} alt={item.product?.title || item.title} />

                            <div>
                                <h4>{item.product?.title || item.title}</h4>
                                <span>Số lượng: {item.quantity}</span>
                            </div>

                            <strong>{formatMoney(item.subtotal)}</strong>
                        </div>
                    ))}
                </div>
            </section>

            <section className={cx('summary')}>
                <div>
                    <span>Tạm tính</span>
                    <strong>{formatMoney(order.totalAmount)}</strong>
                </div>

                <div>
                    <span>Giảm giá</span>
                    <strong>-{formatMoney(order.discountAmount)}</strong>
                </div>

                <div className={cx('total')}>
                    <span>Tổng thanh toán</span>
                    <strong>{formatMoney(order.finalAmount)}</strong>
                </div>
            </section>
        </div>
    );
}
