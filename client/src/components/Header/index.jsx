import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaSearch, FaShoppingCart } from 'react-icons/fa';
import classNames from 'classnames/bind';

import { useAuthStore } from '~/stores/useAuthStore';

import styles from './Header.module.scss';

const cx = classNames.bind(styles);

export default function Header() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { accessToken, user, fetchMe, logout } = useAuthStore();
    const [keyword, setKeyword] = useState(searchParams.get('search') || '');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        if (accessToken && !user) {
            fetchMe();
        }
    }, [accessToken, user, fetchMe]);

    useEffect(() => {
        setKeyword(searchParams.get('search') || '');
    }, [searchParams]);

    useEffect(() => {
        if (!userMenuOpen) return;

        const onMouseDown = (event) => {
            if (!userMenuRef.current) return;
            if (!userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [userMenuOpen]);

    const displayName = useMemo(() => user?.fullName || user?.email || 'User', [user]);

    const handleSearch = (event) => {
        event.preventDefault();
        const search = keyword.trim();
        navigate(search ? `/category?search=${encodeURIComponent(search)}` : '/category');
    };

    const handleLogout = async () => {
        setUserMenuOpen(false);
        await logout();
    };

    return (
        <div className={cx('header')}>
            <div className={cx('headerTop')}>
                <div className={cx('headerTopLeft')}>
                    <Link className={cx('logo')} to="/">
                        Book<span className={cx('logoAccent')}>STORY</span>
                    </Link>

                    <form className={cx('search')} onSubmit={handleSearch}>
                        <input
                            type="search"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                        />
                        <button type="submit" aria-label="Tìm kiếm">
                            <FaSearch />
                        </button>
                    </form>
                </div>

                <div className={cx('headerTopRight')}>
                    <Link className={cx('cart')} to="/cart">
                        <FaShoppingCart />
                        <span>Giỏ hàng</span>
                    </Link>

                    <div className={cx('user')}>
                        {user ? (
                            <div className={cx('userDropdown')} ref={userMenuRef}>
                                <button
                                    className={cx('userTrigger')}
                                    type="button"
                                    onClick={() => setUserMenuOpen((prev) => !prev)}
                                    aria-haspopup="menu"
                                    aria-expanded={userMenuOpen}
                                >
                                    <span className={cx('userName')}>{displayName}</span>
                                    <span className={cx('userChevron')} aria-hidden="true">
                                        ▾
                                    </span>
                                </button>

                                {userMenuOpen && (
                                    <div className={cx('userMenu')} role="menu">
                                        <Link
                                            className={cx('userMenuItem')}
                                            to="/account"
                                            role="menuitem"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            Hồ sơ
                                        </Link>
                                        <Link
                                            className={cx('userMenuItem')}
                                            to="/account/orders"
                                            role="menuitem"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            Lịch sử mua hàng
                                        </Link>
                                        <button
                                            className={cx('userMenuItem', 'userMenuButton')}
                                            type="button"
                                            role="menuitem"
                                            onClick={handleLogout}
                                        >
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link className={cx('accountLink')} to="/auth/login">
                                Tài khoản
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <nav className={cx('nav')}>
                <ul>
                    <li>
                        <Link to="/">Trang chủ</Link>
                    </li>
                    <li>
                        <Link to="/category">Danh mục</Link>
                    </li>
                    <li>
                        <Link to="/blog">Tin tức</Link>
                    </li>
                    <li>
                        <Link to="/contact">Liên hệ</Link>
                    </li>
                    {user && ['ADMIN', 'MANAGER','EMPLOYEE'].includes(user.role) && (
                        <li>
                            <Link to="/dashboard">Dashboard</Link>
                        </li>
                    )}
                </ul>
            </nav>
        </div>
    );
}
