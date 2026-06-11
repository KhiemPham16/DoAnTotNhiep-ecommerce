import React, { useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '~/stores/useAuthStore';

import styles from './Auth.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const { verifyEmail } = useAuthStore();

    useEffect(() => {
        const verify = async () => {
            const token = searchParams.get('token');

            if (!token) return;

            try {
                await verifyEmail(token);

                setTimeout(() => {
                    navigate('/auth/login');
                }, 2000);
            } catch (error) {
                console.error(error);
            }
        };

        verify();
    }, [searchParams, verifyEmail, navigate]);

    return (
        <div className={cx('form')}>
            <p className={cx('note')}>Đang xác thực email...</p>

            <div className={cx('rowBetween')}>
                <Link className={cx('link')} to="/auth/login">
                    Về đăng nhập
                </Link>

                <Link className={cx('link')} to="/auth/register">
                    Tạo tài khoản
                </Link>
            </div>
        </div>
    );
}
