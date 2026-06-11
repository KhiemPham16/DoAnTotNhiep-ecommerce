import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Auth.module.scss';
import classNames from 'classnames/bind';
import { toast } from 'sonner';

import { useAuthStore } from '~/stores/useAuthStore';

const cx = classNames.bind(styles);

export default function Register() {
    const navigate = useNavigate();
    const { register, loading } = useAuthStore();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Mật khẩu nhập lại không khớp');
            return;
        }

        await register(formData.fullName, formData.email, formData.phone, formData.password);

        navigate('/auth/login');
    };

    return (
        <form className={cx('form')} onSubmit={handleSubmit}>
            <div className={cx('field')}>
                <label className={cx('label')}>Họ và tên</label>
                <input
                    className={cx('input')}
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
                />
            </div>

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

            <div className={cx('field')}>
                <label className={cx('label')}>Số điện thoại</label>
                <input
                    className={cx('input')}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0xxxxxxxxx"
                    autoComplete="tel"
                />
            </div>

            <div className={cx('field')}>
                <label className={cx('label')}>Mật khẩu</label>
                <input
                    className={cx('input')}
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                />
            </div>

            <div className={cx('field')}>
                <label className={cx('label')}>Nhập lại mật khẩu</label>
                <input
                    className={cx('input')}
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                />
            </div>

            <button className={cx('button')} type="submit" disabled={loading}>
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>

            <p className={cx('note')}>
                Đã có tài khoản?{' '}
                <Link className={cx('link')} to="/auth/login">
                    Đăng nhập
                </Link>
            </p>

            <p className={cx('note')}>Sau khi đăng ký, hãy kiểm tra email để xác thực tài khoản.</p>
        </form>
    );
}
