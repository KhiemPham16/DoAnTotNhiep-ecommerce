import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FaArrowLeft, FaUniversity, FaShieldAlt } from 'react-icons/fa';

import { useOrderStore } from '~/stores/useOrderStore';

import styles from './Sepay.module.scss';

const cx = classNames.bind(styles);

export default function Sepay() {
    const navigate = useNavigate();
    const { orderId } = useParams();

    const { createSepayCheckout, payingId } = useOrderStore();

    const [processing, setProcessing] = useState(false);

    const handlePayment = async () => {
        try {
            setProcessing(true);

            await createSepayCheckout(orderId);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('card')}>
                    <div className={cx('icon')}>
                        <FaUniversity />
                    </div>

                    <h1>Thanh toán qua SePay</h1>

                    <p>Bạn sẽ được chuyển đến cổng thanh toán SePay để hoàn tất giao dịch.</p>

                    <div className={cx('orderInfo')}>
                        <span>Mã đơn hàng</span>
                        <strong>{orderId}</strong>
                    </div>

                    <div className={cx('security')}>
                        <FaShieldAlt />
                        <span>Thanh toán bảo mật qua chuyển khoản ngân hàng</span>
                    </div>

                    <div className={cx('actions')}>
                        <button type="button" className={cx('backBtn')} onClick={() => navigate(-1)}>
                            <FaArrowLeft />
                            Quay lại
                        </button>

                        <button
                            type="button"
                            className={cx('payBtn')}
                            disabled={processing || payingId === orderId}
                            onClick={handlePayment}
                        >
                            {processing || payingId === orderId ? 'Đang chuyển hướng...' : 'Thanh toán ngay'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
