import { Link, useLocation, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

import styles from './Payments.module.scss';

const cx = classNames.bind(styles);

const formatPrice = (value) => Number(value || 0).toLocaleString('vi-VN') + 'đ';

export default function Payments() {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const order = location.state?.order;

    const payment = searchParams.get('payment');
    const orderIdFromQuery = searchParams.get('orderId');

    const displayOrderId = order?.id || order?.orderId || orderIdFromQuery;

    const isPaymentError = payment === 'error' || payment === 'cancel';

    return (
        <div className={cx('wrapper')}>
            <div className={cx('card')}>
                {isPaymentError ? (
                    <FaTimesCircle className={cx('icon', 'error')} />
                ) : (
                    <FaCheckCircle className={cx('icon')} />
                )}

                <h1>{isPaymentError ? 'Thanh toán chưa hoàn tất' : 'Đặt hàng thành công'}</h1>

                <p>
                    {payment === 'success'
                        ? 'Đơn hàng của bạn đã được thanh toán thành công.'
                        : payment === 'cancel'
                          ? 'Bạn đã hủy quá trình thanh toán.'
                          : payment === 'error'
                            ? 'Có lỗi xảy ra trong quá trình thanh toán.'
                            : 'Đơn hàng của bạn đã được tạo và đang chờ xử lý.'}
                </p>

                <div className={cx('info')}>
                    {displayOrderId && (
                        <div>
                            <span>Mã đơn hàng</span>
                            <strong>{displayOrderId}</strong>
                        </div>
                    )}

                    {order?.finalAmount !== undefined && (
                        <div>
                            <span>Tổng thanh toán</span>
                            <strong>{formatPrice(order.finalAmount)}</strong>
                        </div>
                    )}

                    {order?.paymentMethod && (
                        <div>
                            <span>Thanh toán</span>
                            <strong>{order.paymentMethod.name}</strong>
                        </div>
                    )}
                </div>

                <div className={cx('actions')}>
                    <Link to="/category">Tiếp tục mua hàng</Link>
                    <Link to="/account/orders">Xem đơn hàng</Link>
                </div>
            </div>
        </div>
    );
}
