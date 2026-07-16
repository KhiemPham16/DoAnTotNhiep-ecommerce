import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FiChevronLeft, FiChevronRight, FiPackage, FiSearch, FiX } from 'react-icons/fi';

import useDebounce from '~/hooks/useDebounce';
import { useOrderStore } from '~/stores/useOrderStore';
import { formatMoney } from '~/utils/dashboardUtils';

import styles from './Orders.module.scss';

const cx = classNames.bind(styles);

const orderStatusLabels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    SHIPPING: 'Đang giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy'
};

const paymentStatusLabels = {
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    FAILED: 'Thanh toán thất bại',
    REFUNDED: 'Đã hoàn tiền'
};

const statusTabs = [
    { value: 'ALL', label: 'Tất cả' },
    ...Object.entries(orderStatusLabels).map(([value, label]) => ({ value, label }))
];

const getImageUrl = (thumbnail) => {
    if (!thumbnail) return '';
    if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
    return `${import.meta.env.VITE_API_URL}${thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`}`;
};

const getVisiblePages = (currentPage, totalPages) => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const start = Math.min(Math.max(currentPage - 2, 1), totalPages - 4);
    return Array.from({ length: 5 }, (_, index) => start + index);
};

export default function AccountOrders() {
    const {
        orders,
        loading,
        updatingId,
        myOrdersPagination,
        myOrderStatusCounts,
        fetchMyOrders,
        cancelMyOrder
    } = useOrderStore();
    const [keyword, setKeyword] = useState('');
    const [activeStatus, setActiveStatus] = useState('ALL');
    const [paymentStatus, setPaymentStatus] = useState('ALL');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const debouncedKeyword = useDebounce(keyword, 400);

    const queryParams = useMemo(
        () => ({
            page,
            limit: 10,
            keyword: debouncedKeyword.trim() || undefined,
            status: activeStatus === 'ALL' ? undefined : activeStatus,
            paymentStatus: paymentStatus === 'ALL' ? undefined : paymentStatus,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined
        }),
        [activeStatus, debouncedKeyword, fromDate, page, paymentStatus, toDate]
    );

    useEffect(() => {
        fetchMyOrders(queryParams);
    }, [fetchMyOrders, queryParams]);

    useEffect(() => {
        if (!loading && myOrdersPagination.totalPages > 0 && page > myOrdersPagination.totalPages) {
            setPage(myOrdersPagination.totalPages);
        }
    }, [loading, myOrdersPagination.totalPages, page]);

    const hasFilters = Boolean(keyword || paymentStatus !== 'ALL' || fromDate || toDate);
    const visiblePages = getVisiblePages(myOrdersPagination.page, myOrdersPagination.totalPages);

    const selectStatus = (status) => {
        setActiveStatus(status);
        setPage(1);
    };

    const resetFilters = () => {
        setKeyword('');
        setPaymentStatus('ALL');
        setFromDate('');
        setToDate('');
        setPage(1);
    };

    const handleCancel = async (order) => {
        if (!window.confirm(`Bạn chắc chắn muốn hủy đơn hàng #${order.id.slice(0, 8)}?`)) return;
        await cancelMyOrder(order.id);
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <div>
                    <h2>Lịch sử mua hàng</h2>
                    <p>Theo dõi, tìm kiếm và quản lý các đơn hàng của bạn.</p>
                </div>
            </div>

            <div className={cx('orderPanel')}>
                <div className={cx('statusTabs')} role="tablist" aria-label="Lọc theo trạng thái đơn hàng">
                    {statusTabs.map((tab) => (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeStatus === tab.value}
                            className={cx('statusTab', { active: activeStatus === tab.value })}
                            key={tab.value}
                            onClick={() => selectStatus(tab.value)}
                        >
                            <span>{tab.label}</span>
                            <small>{myOrderStatusCounts[tab.value] || 0}</small>
                        </button>
                    ))}
                </div>

                <div className={cx('filters')}>
                    <label className={cx('searchBox')}>
                        <FiSearch aria-hidden="true" />
                        <input
                            type="search"
                            aria-label="Tìm đơn hàng"
                            value={keyword}
                            placeholder="Tìm theo mã đơn hoặc tên sách"
                            onChange={(event) => {
                                setKeyword(event.target.value);
                                setPage(1);
                            }}
                        />
                        {keyword && (
                            <button type="button" aria-label="Xóa từ khóa" onClick={() => setKeyword('')}>
                                <FiX />
                            </button>
                        )}
                    </label>

                    <select
                        value={paymentStatus}
                        aria-label="Lọc trạng thái thanh toán"
                        onChange={(event) => {
                            setPaymentStatus(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="ALL">Tất cả thanh toán</option>
                        {Object.entries(paymentStatusLabels).map(([value, label]) => (
                            <option value={value} key={value}>
                                {label}
                            </option>
                        ))}
                    </select>

                    <div className={cx('dateRange')}>
                        <label>
                            <span>Từ ngày</span>
                            <input
                                type="date"
                                value={fromDate}
                                max={toDate || undefined}
                                onChange={(event) => {
                                    setFromDate(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </label>
                        <span className={cx('dateSeparator')}>–</span>
                        <label>
                            <span>Đến ngày</span>
                            <input
                                type="date"
                                value={toDate}
                                min={fromDate || undefined}
                                onChange={(event) => {
                                    setToDate(event.target.value);
                                    setPage(1);
                                }}
                            />
                        </label>
                    </div>

                    {hasFilters && (
                        <button className={cx('resetButton')} type="button" onClick={resetFilters}>
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            </div>

            <div className={cx('resultSummary')} aria-live="polite">
                <span>
                    {loading ? 'Đang tìm đơn hàng...' : `${myOrdersPagination.total} đơn hàng`}
                </span>
            </div>

            {loading ? (
                <div className={cx('stateBox')}>Đang tải đơn hàng...</div>
            ) : orders.length === 0 ? (
                <div className={cx('stateBox', 'emptyState')}>
                    <FiPackage aria-hidden="true" />
                    <strong>{hasFilters || activeStatus !== 'ALL' ? 'Không tìm thấy đơn hàng phù hợp' : 'Bạn chưa có đơn hàng nào'}</strong>
                    <span>Hãy thử đổi từ khóa, trạng thái hoặc khoảng thời gian.</span>
                    {(hasFilters || activeStatus !== 'ALL') && (
                        <button
                            type="button"
                            onClick={() => {
                                resetFilters();
                                setActiveStatus('ALL');
                            }}
                        >
                            Xem tất cả đơn hàng
                        </button>
                    )}
                </div>
            ) : (
                <div className={cx('orders')}>
                    {orders.map((order) => (
                        <article className={cx('orderCard')} key={order.id}>
                            <div className={cx('orderTop')}>
                                <div>
                                    <h3>Đơn hàng #{order.id.slice(0, 8)}</h3>
                                    <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                                </div>

                                <div className={cx('badges')}>
                                    <span className={cx('badge', order.status?.toLowerCase())}>
                                        {orderStatusLabels[order.status] || order.status}
                                    </span>
                                    <span className={cx('paymentBadge', order.paymentStatus?.toLowerCase())}>
                                        {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            <div className={cx('items')}>
                                {order.items?.slice(0, 3).map((item) => (
                                    <div className={cx('item')} key={item.id}>
                                        <div className={cx('itemInfo')}>
                                            <div className={cx('thumbnail')}>
                                                {item.product?.thumbnail ? (
                                                    <img src={getImageUrl(item.product.thumbnail)} alt="" />
                                                ) : (
                                                    <FiPackage aria-hidden="true" />
                                                )}
                                            </div>
                                            <span>{item.product?.title || item.title}</span>
                                        </div>
                                        <strong>x{item.quantity}</strong>
                                    </div>
                                ))}

                                {order.items?.length > 3 && (
                                    <div className={cx('more')}>+{order.items.length - 3} sản phẩm khác</div>
                                )}
                            </div>

                            <div className={cx('orderBottom')}>
                                <div>
                                    <span>Tổng thanh toán</span>
                                    <strong>{formatMoney(order.finalAmount)}</strong>
                                </div>

                                <div className={cx('actions')}>
                                    <Link to={`/account/orders/${order.id}`}>Xem chi tiết</Link>
                                    {['PENDING', 'CONFIRMED'].includes(order.status) && (
                                        <button
                                            type="button"
                                            disabled={updatingId === order.id}
                                            onClick={() => handleCancel(order)}
                                        >
                                            {updatingId === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {!loading && myOrdersPagination.totalPages > 1 && (
                <nav className={cx('pagination')} aria-label="Phân trang đơn hàng">
                    <button
                        type="button"
                        aria-label="Trang trước"
                        disabled={page === 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                        <FiChevronLeft />
                    </button>
                    {visiblePages.map((pageNumber) => (
                        <button
                            type="button"
                            className={cx({ current: pageNumber === page })}
                            aria-current={pageNumber === page ? 'page' : undefined}
                            key={pageNumber}
                            onClick={() => setPage(pageNumber)}
                        >
                            {pageNumber}
                        </button>
                    ))}
                    <button
                        type="button"
                        aria-label="Trang sau"
                        disabled={page === myOrdersPagination.totalPages}
                        onClick={() => setPage((current) => Math.min(myOrdersPagination.totalPages, current + 1))}
                    >
                        <FiChevronRight />
                    </button>
                </nav>
            )}
        </div>
    );
}
