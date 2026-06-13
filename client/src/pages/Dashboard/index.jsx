import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';

import { useDashboardStore } from '~/stores/useDashboardStore';

import pageStyles from './DashboardPage.module.scss';
import styles from './Dashboard.module.scss';

const cx = classNames.bind(styles);
const cp = classNames.bind(pageStyles);

const orderStatusLabels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đang xử lý',
    SHIPPING: 'Đang giao hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy'
};

const staffRoles = ['EMPLOYEE'];

const formatMoney = (value) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(Number(value || 0));

const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const toDateKey = (value) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatShortDate = (date) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit'
    }).format(date);

const getOrderRevenue = (order) => (order.status === 'CANCELLED' ? 0 : Number(order.finalAmount || 0));

const getSalesPerson = (order) =>
    order.employee ||
    order.staff ||
    order.seller ||
    order.salesperson ||
    order.createdBy ||
    order.confirmedBy ||
    order.handledBy ||
    null;

export default function Dashboard() {
    const { orders, products, users, loading, fetchOverview } = useDashboardStore();

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const stats = useMemo(() => {
        const todayKey = toDateKey(new Date());
        const validOrders = orders.filter((order) => order.status !== 'CANCELLED');
        const completedOrders = orders.filter((order) => order.status === 'COMPLETED');
        const totalRevenue = validOrders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
        const completedRevenue = completedOrders.reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);
        const todayRevenue = validOrders
            .filter((order) => toDateKey(order.createdAt) === todayKey)
            .reduce((sum, order) => sum + getOrderRevenue(order), 0);

        return {
            totalRevenue,
            completedRevenue,
            todayRevenue,
            averageOrderValue: validOrders.length ? totalRevenue / validOrders.length : 0,
            totalOrders: orders.length,
            pendingOrders: orders.filter((order) => order.status === 'PENDING').length,
            completedOrders: completedOrders.length,
            cancelledOrders: orders.filter((order) => order.status === 'CANCELLED').length,
            activeProducts: products.filter((product) => product.isActive).length,
            lowStockProducts: products.filter((product) => Number(product.stock || 0) <= 5).length,
            outOfStockProducts: products.filter((product) => Number(product.stock || 0) === 0).length,
            staffCount: users.filter((user) => staffRoles.includes(user.role)).length
        };
    }, [orders, products, users]);

    const orderStatusStats = useMemo(
        () =>
            Object.keys(orderStatusLabels).map((status) => ({
                status,
                label: orderStatusLabels[status],
                count: orders.filter((order) => order.status === status).length
            })),
        [orders]
    );

    const revenueTimeline = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            return {
                key: toDateKey(date),
                label: formatShortDate(date),
                revenue: 0,
                orders: 0
            };
        });

        const byKey = new Map(days.map((day) => [day.key, day]));

        orders.forEach((order) => {
            const key = toDateKey(order.createdAt);
            const day = byKey.get(key);

            if (!day || order.status === 'CANCELLED') {
                return;
            }

            day.revenue += Number(order.finalAmount || 0);
            day.orders += 1;
        });

        const maxRevenue = Math.max(...days.map((day) => day.revenue), 1);

        return days.map((day) => ({
            ...day,
            percent: Math.max(6, Math.round((day.revenue / maxRevenue) * 100))
        }));
    }, [orders]);

    const topProducts = useMemo(() => {
        const soldMap = new Map();

        products.forEach((product) => {
            soldMap.set(product.id, {
                id: product.id,
                title: product.title,
                category: product.category?.name,
                stock: Number(product.stock || 0),
                sold: Number(product.soldCount || 0),
                revenue: Number(product.soldCount || 0) * Number(product.price || 0)
            });
        });

        orders.forEach((order) => {
            if (order.status === 'CANCELLED') {
                return;
            }

            order.items?.forEach((item) => {
                const current = soldMap.get(item.productId) || {
                    id: item.productId,
                    title: item.title,
                    category: '-',
                    stock: 0,
                    sold: 0,
                    revenue: 0
                };

                current.sold += Number(item.quantity || 0);
                current.revenue += Number(item.subtotal || 0);
                soldMap.set(item.productId, current);
            });
        });

        return Array.from(soldMap.values())
            .sort((a, b) => b.sold - a.sold || b.revenue - a.revenue)
            .slice(0, 6);
    }, [orders, products]);

    const stockStats = useMemo(
        () =>
            [...products]
                .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
                .slice(0, 8)
                .map((product) => ({
                    id: product.id,
                    title: product.title,
                    category: product.category?.name,
                    stock: Number(product.stock || 0),
                    isActive: product.isActive
                })),
        [products]
    );

    const salesStaffStats = useMemo(() => {
        const staffMap = new Map();

        users
            .filter((user) => staffRoles.includes(user.role))
            .forEach((user) => {
                staffMap.set(user.id, {
                    id: user.id,
                    name: user.fullName,
                    role: user.role,
                    orders: 0,
                    revenue: 0
                });
            });

        let hasAssignedOrders = false;

        orders.forEach((order) => {
            const staff = getSalesPerson(order);
            const staffId = staff?.id || staff?.userId || staff;

            if (!staffId || !staffMap.has(staffId)) {
                return;
            }

            hasAssignedOrders = true;
            const current = staffMap.get(staffId);
            current.orders += 1;
            current.revenue += getOrderRevenue(order);
        });

        return {
            hasAssignedOrders,
            items: Array.from(staffMap.values())
                .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)
                .slice(0, 6)
        };
    }, [orders, users]);

    return (
        <div className={cp('page')}>
            <div className={cp('header')}>
                <div>
                    <div className={cp('title')}>Tổng quan</div>
                    <div className={cp('subtitle')}>
                        Theo dõi doanh thu ghi nhận, đơn hàng, sản phẩm, tồn kho và hiệu suất vận hành.
                    </div>
                </div>

                <div className={cp('actions')}>
                    <Link className={cp('secondaryBtn')} to="/">
                        Về giao diện người dùng
                    </Link>
                    <button className={cp('secondaryBtn')} type="button" onClick={fetchOverview} disabled={loading}>
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
            </div>

            <div className={cx('metricGrid')}>
                <div className={cx('metricCard')}>
                    <span>Tổng doanh thu ghi nhận</span>
                    <strong>{formatMoney(stats.totalRevenue)}</strong>
                    <small>Doanh thu hôm nay: {formatMoney(stats.todayRevenue)}</small>
                </div>
                <div className={cx('metricCard')}>
                    <span>Doanh thu đã hoàn tất</span>
                    <strong>{formatMoney(stats.completedRevenue)}</strong>
                    <small>Giá trị đơn hàng trung bình: {formatMoney(stats.averageOrderValue)}</small>
                </div>
                <div className={cx('metricCard')}>
                    <span>Đơn hàng</span>
                    <strong>{formatNumber(stats.totalOrders)}</strong>
                    <small>{stats.pendingOrders} đơn chờ xác nhận</small>
                </div>
                <div className={cx('metricCard')}>
                    <span>Sản phẩm</span>
                    <strong>{formatNumber(stats.activeProducts)}</strong>
                    <small>{stats.lowStockProducts} sản phẩm sắp hết hàng</small>
                </div>
            </div>

            <div className={cx('mainGrid')}>
                <section className={cx('panel', 'wide')}>
                    <div className={cx('panelHeader')}>
                        <div>
                            <h2>Xu hướng doanh thu ghi nhận</h2>
                            <p>7 ngày gần nhất, loại trừ đơn đã hủy.</p>
                        </div>
                    </div>

                    <div className={cx('chart')}>
                        {revenueTimeline.map((day) => (
                            <div className={cx('barGroup')} key={day.key}>
                                <div className={cx('barTrack')}>
                                    <div
                                        className={cx('bar')}
                                        style={{
                                            height: `${day.percent}%`,
                                            '--bar-width': `${day.percent}%`
                                        }}
                                        title={formatMoney(day.revenue)}
                                    />
                                </div>
                                <strong>{formatMoney(day.revenue)}</strong>
                                <span>{day.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={cx('panel')}>
                    <div className={cx('panelHeader')}>
                        <div>
                            <h2>Phân bổ trạng thái đơn hàng</h2>
                            <p>Số lượng đơn hàng theo từng trạng thái xử lý.</p>
                        </div>
                    </div>

                    <div className={cx('statusList')}>
                        {orderStatusStats.map((item) => (
                            <div className={cx('statusItem')} key={item.status}>
                                <span>{item.label}</span>
                                <strong>{formatNumber(item.count)}</strong>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className={cx('mainGrid')}>
                <section className={cx('panel')}>
                    <div className={cx('panelHeader')}>
                        <div>
                            <h2>Top sản phẩm theo sản lượng bán</h2>
                            <p>Xếp hạng theo số lượng bán ra và doanh thu ghi nhận.</p>
                        </div>
                    </div>

                    <div className={cx('tableList')}>
                        {topProducts.length === 0 ? (
                            <div className={cx('empty')}>Chưa có dữ liệu bán hàng.</div>
                        ) : (
                            topProducts.map((product, index) => (
                                <div className={cx('rankItem')} key={product.id}>
                                    <span className={cx('rank')}>{index + 1}</span>
                                    <div>
                                        <strong>{product.title}</strong>
                                        <small>{product.category || '-'}</small>
                                    </div>
                                    <div className={cx('right')}>
                                        <strong>{formatNumber(product.sold)}</strong>
                                        <small>{formatMoney(product.revenue)}</small>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className={cx('panel')}>
                    <div className={cx('panelHeader')}>
                        <div>
                            <h2>Cảnh báo tồn kho</h2>
                            <p>Ưu tiên các sản phẩm có tồn kho thấp hoặc đã hết hàng.</p>
                        </div>
                    </div>

                    <div className={cx('tableList')}>
                        {stockStats.length === 0 ? (
                            <div className={cx('empty')}>Chưa có dữ liệu sản phẩm.</div>
                        ) : (
                            stockStats.map((product) => (
                                <div className={cx('stockItem')} key={product.id}>
                                    <div>
                                        <strong>{product.title}</strong>
                                        <small>{product.category || '-'}</small>
                                    </div>
                                    <span
                                        className={cx(
                                            product.stock === 0
                                                ? 'dangerBadge'
                                                : product.stock <= 5
                                                  ? 'warnBadge'
                                                  : 'okBadge'
                                        )}
                                    >
                                        {product.stock} tồn kho
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <section className={cx('panel')}>
                <div className={cx('panelHeader')}>
                    <div>
                        <h2>Hiệu suất nhân viên bán hàng</h2>
                        <p>
                            {salesStaffStats.hasAssignedOrders
                                ? 'Dựa trên đơn hàng có thông tin nhân viên phụ trách.'
                                : 'Backend hiện chưa gắn đơn hàng với nhân viên phụ trách, nên chỉ hiển thị danh sách nhân sự.'}
                        </p>
                    </div>
                    <span className={cx('pill')}>{stats.staffCount} nhân sự</span>
                </div>

                <div className={cx('staffGrid')}>
                    {salesStaffStats.items.length === 0 ? (
                        <div className={cx('empty')}>Chưa có dữ liệu nhân viên.</div>
                    ) : (
                        salesStaffStats.items.map((staff) => (
                            <div className={cx('staffCard')} key={staff.id}>
                                <div>
                                    <strong>{staff.name}</strong>
                                    <span>{staff.role}</span>
                                </div>
                                <div>
                                    <strong>{formatNumber(staff.orders)}</strong>
                                    <span>đơn phụ trách</span>
                                </div>
                                <div>
                                    <strong>{formatMoney(staff.revenue)}</strong>
                                    <span>doanh số phụ trách</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
