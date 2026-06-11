export const dashboardRoutes = [
    {
        path: '/dashboard',
        label: 'Tổng quan',
        title: 'Tổng quan',
        end: true,
        roles: ['ADMIN', 'MANAGER']
    },
    {
        path: '/dashboard/employees',
        label: 'Nhân viên',
        title: 'Quản lý nhân viên',
        roles: ['ADMIN', 'MANAGER']
    },
    {
        path: '/dashboard/products',
        label: 'Sản phẩm',
        title: 'Quản lý sản phẩm',
        roles: ['ADMIN', 'MANAGER', 'EMPLOYEE']
    },
    {
        path: '/dashboard/categories',
        label: 'Danh mục',
        title: 'Quản lý danh mục',
        roles: ['ADMIN', 'MANAGER']
    },
    {
        path: '/dashboard/customers',
        label: 'Khách hàng',
        title: 'Quản lý khách hàng',
        roles: ['ADMIN', 'MANAGER']
    },
    {
        path: '/dashboard/orders',
        label: 'Đơn hàng',
        title: 'Quản lý đơn hàng',
        roles: ['ADMIN', 'MANAGER', 'EMPLOYEE']
    },
    {
        path: '/dashboard/blogs',
        label: 'Bài viết',
        title: 'Quản lý bài viết',
        roles: ['ADMIN', 'MANAGER', 'EMPLOYEE']
    },
    {
        path: '/dashboard/media',
        label: 'Media',
        title: 'Quản lý media',
        roles: ['ADMIN', 'MANAGER', 'EMPLOYEE']
    },
    {
        path: '/dashboard/coupons',
        label: 'Mã giảm giá',
        title: 'Quản lý mã giảm giá',
        roles: ['ADMIN', 'MANAGER']
    },
    {
        path: '/dashboard/payment-methods',
        label: 'Phương thức thanh toán',
        title: 'Quản lý phương thức thanh toán',
        roles: ['ADMIN', 'MANAGER']
    }
];

const normalizeRole = (role) => String(role || '').toUpperCase();

export const canAccessDashboardRoute = (role, route) => Boolean(route?.roles?.includes(normalizeRole(role)));

export const getDashboardRoutesByRole = (role) =>
    dashboardRoutes.filter((route) => canAccessDashboardRoute(role, route));

export const getDefaultDashboardPath = (role) => getDashboardRoutesByRole(role)[0]?.path || '/';

export const getDashboardTitle = (pathname, role) => {
    const currentRoute = dashboardRoutes.find((route) =>
        route.end ? pathname === route.path : pathname.startsWith(route.path)
    );

    if (currentRoute && canAccessDashboardRoute(role, currentRoute)) {
        return currentRoute.title;
    }

    return getDashboardRoutesByRole(role)[0]?.title || 'Dashboard';
};
