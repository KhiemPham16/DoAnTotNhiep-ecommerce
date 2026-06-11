import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';

import { useAuthStore } from '~/stores/useAuthStore';
import { getDashboardTitle } from '~/utils/dashboardPermissions';

import Sidebar from './Sidebar';
import styles from './DashboardLayout.module.scss';

const cx = classNames.bind(styles);

export default function DashboardLayout() {
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const pageTitle = getDashboardTitle(location.pathname, user?.role);

    return (
        <div className={cx('layout')}>
            <Sidebar />

            <main className={cx('content')}>
                <div className={cx('contentInner')}>
                    <div className={cx('topbar')}>
                        <div>
                            <div className={cx('pageTitle')}>{pageTitle}</div>
                            <div className={cx('breadcrumb')}>{location.pathname}</div>
                        </div>
                    </div>

                    <Outlet />
                </div>
            </main>
        </div>
    );
}
