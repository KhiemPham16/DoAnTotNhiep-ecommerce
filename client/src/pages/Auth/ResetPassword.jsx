import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import classNames from 'classnames/bind';

import { useAuthStore } from '~/stores/useAuthStore';

import styles from './Auth.module.scss';

const cx = classNames.bind(styles);

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { forgotPassword, resetPassword, loading } = useAuthStore();
    const [formData, setFormData] = useState({
        email: searchParams.get('email') || '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isCompleted, setIsCompleted] = useState(false);
    const [lastSentEmail, setLastSentEmail] = useState(searchParams.get('email') || '');

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleResendOtp = async () => {
        const email = formData.email.trim();

        if (!email) {
            toast.error('Vui lòng nhập email để gửi lại OTP');
            return;
        }

        const success = await forgotPassword(email);

        if (success) {
            setLastSentEmail(email);
            setFormData((prev) => ({
                ...prev,
                otp: ''
            }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const email = formData.email.trim();
        const otp = formData.otp.trim();

        if (!email || !otp || !formData.newPassword || !formData.confirmPassword) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error('Mật khẩu mới cần ít nhất 6 ký tự');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Mật khẩu nhập lại không khớp');
            return;
        }

        const success = await resetPassword(email, otp, formData.newPassword);

        if (success) {
            setIsCompleted(true);
            setTimeout(() => navigate('/auth/login'), 1200);
        }
    };

    return (
        <form className={cx('form')} onSubmit={handleSubmit}>
            <p className={cx('note')}>Nhập OTP đã gửi đến email và mật khẩu mới để hoàn tất đặt lại mật khẩu.</p>

            <div className={cx('field')}>
                <label className={cx('label')}>Email</label>
                <input
                    className={cx('input')}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                />
            </div>

            {lastSentEmail && (
                <p className={cx('success')}>OTP đã được gửi đến {lastSentEmail}. Nếu chưa nhận được, bạn có thể gửi lại.</p>
            )}

            <div className={cx('field')}>
                <label className={cx('label')}>OTP</label>
                <input
                    className={cx('input')}
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                />
            </div>

            <div className={cx('rowBetween')}>
                <span className={cx('note')}>Không nhận được OTP?</span>
                <button className={cx('textButton')} type="button" onClick={handleResendOtp} disabled={loading}>
                    {loading ? 'Đang gửi lại...' : 'Gửi lại OTP'}
                </button>
            </div>

            <div className={cx('field')}>
                <label className={cx('label')}>Mật khẩu mới</label>
                <input
                    className={cx('input')}
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Tối thiểu 6 ký tự"
                    autoComplete="new-password"
                />
            </div>

            <div className={cx('field')}>
                <label className={cx('label')}>Nhập lại mật khẩu mới</label>
                <input
                    className={cx('input')}
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                />
            </div>

            {isCompleted && <p className={cx('success')}>Đặt lại mật khẩu thành công. Đang chuyển về đăng nhập...</p>}

            <button className={cx('button')} type="submit" disabled={loading || isCompleted}>
                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </button>

            <p className={cx('note')}>
                <Link className={cx('link')} to="/auth/login">
                    Quay lại đăng nhập
                </Link>
            </p>
        </form>
    );
}
