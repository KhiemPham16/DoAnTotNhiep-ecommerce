import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import classNames from 'classnames/bind';

import { useAuthStore } from '~/stores/useAuthStore';

import styles from './Auth.module.scss';

const cx = classNames.bind(styles);

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { forgotPassword, loading } = useAuthStore();
    const [email, setEmail] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            toast.error('Vui lòng nhập email');
            return;
        }

        const success = await forgotPassword(trimmedEmail);

        if (success) {
            navigate(`/auth/reset-password?email=${encodeURIComponent(trimmedEmail)}`);
        }
    };

    return (
        <form className={cx('form')} onSubmit={handleSubmit}>
            <p className={cx('note')}>Nhập email để nhận mã OTP đặt lại mật khẩu.</p>

            <div className={cx('field')}>
                <label className={cx('label')}>Email</label>
                <input
                    className={cx('input')}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                />
            </div>

            <button className={cx('button')} type="submit" disabled={loading}>
                {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
            </button>

            <div className={cx('rowBetween')}>
                <Link className={cx('link')} to="/auth/login">
                    Quay lại đăng nhập
                </Link>
                <Link className={cx('link')} to="/auth/reset-password">
                    Tôi đã có OTP
                </Link>
            </div>
        </form>
    );
}
