import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Auth.module.scss';

import { useAuthStore } from '~/stores/useAuthStore';

const cx = classNames.bind(styles);

export default function Login() {
    const { login, loading } = useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const success = await login(formData.email, formData.password);

        if (!success) return;

        const { user } = useAuthStore.getState();

        const role = user?.role?.toUpperCase();

        if (['ADMIN', 'MANAGER'].includes(role)) {
            navigate('/dashboard');
        } else {
            navigate('/');
        }
    };

    return (
        <form className={cx('form')} onSubmit={handleSubmit}>
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
                <label className={cx('label')}>Mật khẩu</label>

                <input
                    className={cx('input')}
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                />
            </div>

            <button className={cx('button')} type="submit" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div className={cx('rowBetween')}>
                <Link className={cx('link')} to="/auth/forgot-password">
                    Quên mật khẩu?
                </Link>

                <Link className={cx('link')} to="/auth/register">
                    Tạo tài khoản
                </Link>
            </div>
        </form>
    );
}
