import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';

import { useAuthStore } from '~/stores/useAuthStore';
import { getDashboardRoutesByRole } from '~/utils/dashboardPermissions';

import styles from './DashboardLayout.module.scss';

const cx = classNames.bind(styles);

function SidebarLink({ to, children, end = false }) {
    return (
        <NavLink to={to} end={end} className={({ isActive }) => cx('navItem', { navItemActive: isActive })}>
            {children}
        </NavLink>
    );
}

export default function Sidebar() {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const allowedRoutes = useMemo(() => getDashboardRoutesByRole(user?.role), [user?.role]);

    const title = useMemo(() => {
        const currentRoute = allowedRoutes.find((route) =>
            route.end ? location.pathname === route.path : location.pathname.startsWith(route.path)
        );

        return currentRoute?.title || allowedRoutes[0]?.title || 'Dashboard';
    }, [allowedRoutes, location.pathname]);

    const handleLogout = async () => {
        await logout();
    };

    return (
        <aside className={cx('sidebar')}>
            <div className={cx('brand')}>
                <div className={cx('brandTitle')}>Dashboard</div>
                <div className={cx('brandSubtitle')}>{title}</div>
            </div>

            <nav className={cx('nav')}>
                {allowedRoutes.map((route) => (
                    <SidebarLink key={route.path} to={route.path} end={route.end}>
                        {route.label}
                    </SidebarLink>
                ))}
            </nav>

            <div className={cx('sidebarFooter')}>
                <div className={cx('userLine')}>
                    {user ? (
                        <>
                            {user.fullName} ({user.role})
                        </>
                    ) : (
                        'Chưa đăng nhập'
                    )}
                </div>

                <button className={cx('logoutBtn')} type="button" onClick={handleLogout}>
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
}
