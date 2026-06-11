import { NavLink, Outlet } from 'react-router-dom';
import styles from './Auth.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function AuthLayout() {
    return (
        <div className={cx('page')}>
            <div className={cx('card')}>
                <div className={cx('header')}>
                    <h1 className={cx('title')}>Tài khoản</h1>
                    <p className={cx('subtitle')}>Đăng nhập hoặc tạo tài khoản để tiếp tục.</p>
                </div>

                <div className={cx('tabs')}>
                    <NavLink
                        to="/auth/login"
                        className={({ isActive }) => `${cx('tab')} ${isActive ? cx('tabActive') : ''}`}
                    >
                        Đăng nhập
                    </NavLink>

                    <NavLink
                        to="/auth/register"
                        className={({ isActive }) => `${cx('tab')} ${isActive ? cx('tabActive') : ''}`}
                    >
                        Đăng ký
                    </NavLink>
                </div>

                <div className={cx('content')}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
