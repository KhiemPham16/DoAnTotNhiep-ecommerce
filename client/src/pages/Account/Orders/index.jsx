import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';

import { useOrderStore } from '~/stores/useOrderStore';
import { formatMoney } from '~/utils/dashboardUtils';

import styles from './Orders.module.scss';

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

export default function AccountOrders() {
    const { orders, loading, updatingId, fetchMyOrders, cancelMyOrder } = useOrderStore();

    useEffect(() => {
        fetchMyOrders();
    }, [fetchMyOrders]);

    if (loading) {
        return (
            <div className={cx('wrapper')}>
                <h2>Lịch sử mua hàng</h2>
                <div className={cx('stateBox')}>Đang tải đơn hàng...</div>
            </div>
        );
    }

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <div>
                    <h2>Lịch sử mua hàng</h2>
                    <p>Theo dõi trạng thái và chi tiết các đơn hàng của bạn.</p>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className={cx('stateBox')}>Bạn chưa có đơn hàng nào.</div>
            ) : (
                <div className={cx('orders')}>
                    {orders.map((order) => (
                        <div className={cx('orderCard')} key={order.id}>
                            <div className={cx('orderTop')}>
                                <div>
                                    <h3>Đơn hàng #{order.id.slice(0, 8)}</h3>
                                    <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
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

                            <div className={cx('items')}>
                                {order.items?.slice(0, 3).map((item) => (
                                    <div className={cx('item')} key={item.id}>
                                        <span>{item.product?.title || item.title}</span>
                                        <strong>x{item.quantity}</strong>
                                    </div>
                                ))}

                                {order.items?.length > 3 && (
                                    <div className={cx('more')}>+{order.items.length - 3} sản phẩm khác</div>
                                )}
                            </div>

                            <div className={cx('orderBottom')}>
                                <div>
                                    <span>Tổng thanh toán</span>
                                    <strong>{formatMoney(order.finalAmount)}</strong>
                                </div>

                                <div className={cx('actions')}>
                                    <Link to={`/account/orders/${order.id}`}>Xem chi tiết</Link>

                                    {['PENDING', 'CONFIRMED'].includes(order.status) && (
                                        <button
                                            type="button"
                                            disabled={updatingId === order.id}
                                            onClick={() => cancelMyOrder(order.id)}
                                        >
                                            {updatingId === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
