import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'sonner';
import { FaArrowLeft, FaUniversity, FaShieldAlt } from 'react-icons/fa';

import { useOrderStore } from '~/stores/useOrderStore';

import styles from './Sepay.module.scss';

const cx = classNames.bind(styles);

export default function Sepay() {
    const navigate = useNavigate();
    const location = useLocation();

    const checkoutPayload = location.state?.checkoutPayload;

    const { createOrder, createSepayCheckout, creating, payingId } = useOrderStore();

    const [processing, setProcessing] = useState(false);

    const handlePayment = async () => {
        if (!checkoutPayload) {
            toast.error('Không tìm thấy thông tin thanh toán');
            navigate('/pay');
            return;
        }

        try {
            setProcessing(true);

            const order = await createOrder(checkoutPayload);

            const orderId = order?.id || order?.orderId || order?.data?.id || order?.data?.orderId;

            if (!orderId) {
                toast.error('Không lấy được mã đơn hàng');
                return;
            }

            await createSepayCheckout(orderId);
        } finally {
            setProcessing(false);
        }
    };

    const loading = processing || creating || Boolean(payingId);

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('card')}>
                    <div className={cx('icon')}>
                        <FaUniversity />
                    </div>

                    <h1>Thanh toán qua SePay</h1>

                    <p>Bạn sẽ được chuyển đến cổng thanh toán SePay để hoàn tất giao dịch.</p>

                    <div className={cx('security')}>
                        <FaShieldAlt />
                        <span>Thanh toán bảo mật qua chuyển khoản ngân hàng</span>
                    </div>

                    <div className={cx('actions')}>
                        <button type="button" className={cx('backBtn')} onClick={() => navigate('/pay')}>
                            <FaArrowLeft />
                            Quay lại
                        </button>

                        <button type="button" className={cx('payBtn')} disabled={loading} onClick={handlePayment}>
                            {loading ? 'Đang chuyển hướng...' : 'Thanh toán ngay'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
