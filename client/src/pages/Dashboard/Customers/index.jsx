import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';

import {
    formatDate,
    formatMoney,
    genderLabels,
    getImageUrl,
    orderStatusLabels,
    paymentStatusLabels
} from '~/utils/dashboardUtils';
import useDebounce from '~/hooks/useDebounce';
import { useOrderStore } from '~/stores/useOrderStore';
import { useUserStore } from '~/stores/useUserStore';

import CustomerForm from './CustomerForm';
import styles from './DashboardCustomers.module.scss';

const cx = classNames.bind(styles);

const initialFormData = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    avatarUrl: ''
};

export default function Customers() {
    const { users, loading, saving, fetchUsers, createUser, updateUser } = useUserStore();
    const { orders, loading: ordersLoading, fetchOrders } = useOrderStore();
    const [keyword, setKeyword] = useState('');
    const [genderFilter, setGenderFilter] = useState('all');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [historyCustomer, setHistoryCustomer] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const debouncedKeyword = useDebounce(keyword, 500);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const customers = useMemo(() => users.filter((user) => user.role === 'CUSTOMER'), [users]);

    const filteredCustomers = useMemo(() => {
        const search = debouncedKeyword.trim().toLowerCase();

        return customers.filter((customer) => {
            const matchesGender = genderFilter === 'all' || customer.gender === genderFilter;
            const matchesKeyword =
                !search ||
                [customer.fullName, customer.email, customer.phone, customer.username]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(search));

            return matchesGender && matchesKeyword;
        });
    }, [customers, debouncedKeyword, genderFilter]);

    const customerOrders = useMemo(() => {
        if (!historyCustomer) {
            return [];
        }

        return orders.filter((order) => order.user?.id === historyCustomer.id || order.userId === historyCustomer.id);
    }, [historyCustomer, orders]);

    const totalSpent = useMemo(
        () =>
            customerOrders
                .filter((order) => order.status !== 'CANCELLED')
                .reduce((sum, order) => sum + Number(order.finalAmount || 0), 0),
        [customerOrders]
    );

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: value
        }));
    };

    const openCreateModal = () => {
        setEditingCustomer(null);
        setFormData(initialFormData);
        setIsOpenModal(true);
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            fullName: customer.fullName || '',
            email: customer.email || '',
            phone: customer.phone || '',
            password: '',
            gender: customer.gender || '',
            avatarUrl: customer.avatarUrl || ''
        });
        setIsOpenModal(true);
    };

    const closeModal = () => {
        setIsOpenModal(false);
        setEditingCustomer(null);
        setFormData(initialFormData);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            role: 'CUSTOMER',
            gender: formData.gender || undefined,
            avatarUrl: formData.avatarUrl.trim() || undefined
        };

        if (!editingCustomer) {
            payload.password = formData.password;
        }

        const success = editingCustomer
            ? await updateUser(editingCustomer.id, payload, 'Cập nhật khách hàng thành công')
            : await createUser(payload, 'Thêm khách hàng thành công');

        if (success) {
            closeModal();
        }
    };

    const openHistoryModal = async (customer) => {
        setHistoryCustomer(customer);
        await fetchOrders();
    };

    const closeHistoryModal = () => {
        setHistoryCustomer(null);
    };

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <div>
                    <div className={cx('title')}>Quản lý khách hàng</div>
                    <div className={cx('subtitle')}>Xem danh sách, tìm kiếm và theo dõi lịch sử mua hàng.</div>
                </div>

                <button className={cx('primaryBtn')} type="button" onClick={openCreateModal}>
                    Thêm khách hàng
                </button>
            </div>

            <div className={cx('toolbar')}>
                <input
                    className={cx('input')}
                    type="search"
                    placeholder="Tìm theo tên, email, số điện thoại"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                />
                <select
                    className={cx('select')}
                    value={genderFilter}
                    onChange={(event) => setGenderFilter(event.target.value)}
                >
                    <option value="all">Tất cả giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                </select>
            </div>

            <div className={cx('summary')}>
                <div>
                    <strong>{filteredCustomers.length}</strong>
                    <span>Khách hàng hiển thị</span>
                </div>
                <div>
                    <strong>{customers.length}</strong>
                    <span>Tổng khách hàng</span>
                </div>
                <div>
                    <strong>{customers.filter((customer) => customer.gender).length}</strong>
                    <span>Đã cập nhật hồ sơ</span>
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('tableWrap')}>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Khách hàng</th>
                                <th>Liên hệ</th>
                                <th>Giới tính</th>
                                <th>Ngày tạo</th>
                                <th>Cập nhật</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="6">
                                        Đang tải danh sách khách hàng...
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="6">
                                        Không có khách hàng phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className={cx('customerCell')}>
                                                <div className={cx('avatar')}>
                                                    {customer.avatarUrl ? (
                                                        <img
                                                            src={getImageUrl(customer.avatarUrl)}
                                                            alt={customer.fullName}
                                                        />
                                                    ) : (
                                                        <span>{customer.fullName?.slice(0, 1) || '?'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>{customer.fullName}</strong>
                                                    <span>@{customer.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={cx('contact')}>
                                                <span>{customer.email}</span>
                                                <span>{customer.phone}</span>
                                            </div>
                                        </td>
                                        <td>{genderLabels[customer.gender] || '-'}</td>
                                        <td>{formatDate(customer.createdAt)}</td>
                                        <td>{formatDate(customer.updatedAt)}</td>
                                        <td>
                                            <div className={cx('rowActions')}>
                                                <button type="button" onClick={() => openEditModal(customer)}>
                                                    Sửa
                                                </button>
                                                <button type="button" onClick={() => openHistoryModal(customer)}>
                                                    Lịch sử
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isOpenModal && (
                <div className={cx('modalOverlay')}>
                    <div className={cx('modalContent')}>
                        <div className={cx('modalHeader')}>
                            <h2>{editingCustomer ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}</h2>
                            <button type="button" onClick={closeModal} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <CustomerForm
                            editingCustomer={editingCustomer}
                            formData={formData}
                            saving={saving}
                            onChange={handleInputChange}
                            onClose={closeModal}
                            onSubmit={handleSubmit}
                        />
                    </div>
                </div>
            )}

            {historyCustomer && (
                <div className={cx('modalOverlay')}>
                    <div className={cx('historyModal')}>
                        <div className={cx('modalHeader')}>
                            <div>
                                <h2>Lịch sử mua hàng</h2>
                                <span>{historyCustomer.fullName}</span>
                            </div>
                            <button type="button" onClick={closeHistoryModal} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <div className={cx('historySummary')}>
                            <div>
                                <strong>{customerOrders.length}</strong>
                                <span>Tổng đơn</span>
                            </div>
                            <div>
                                <strong>{formatMoney(totalSpent)}</strong>
                                <span>Tổng giá trị</span>
                            </div>
                            <div>
                                <strong>{customerOrders.filter((order) => order.status === 'COMPLETED').length}</strong>
                                <span>Hoàn tất</span>
                            </div>
                        </div>

                        <div className={cx('historyBody')}>
                            {ordersLoading ? (
                                <div className={cx('empty')}>Đang tải lịch sử mua hàng...</div>
                            ) : customerOrders.length === 0 ? (
                                <div className={cx('empty')}>Khách hàng chưa có đơn hàng.</div>
                            ) : (
                                <div className={cx('orderList')}>
                                    {customerOrders.map((order) => (
                                        <div className={cx('orderItem')} key={order.id}>
                                            <div className={cx('orderTop')}>
                                                <div>
                                                    <strong>#{order.id.slice(0, 8)}</strong>
                                                    <span>{formatDate(order.createdAt)}</span>
                                                </div>
                                                <strong>{formatMoney(order.finalAmount)}</strong>
                                            </div>
                                            <div className={cx('orderMeta')}>
                                                <span className={cx('status', order.status.toLowerCase())}>
                                                    {orderStatusLabels[order.status] || order.status}
                                                </span>
                                                <span>
                                                    {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                                                </span>
                                                <span>{order.items?.length || 0} sản phẩm</span>
                                            </div>
                                            {order.items?.length > 0 && (
                                                <div className={cx('items')}>
                                                    {order.items.map((item) => (
                                                        <span key={item.id}>
                                                            {item.title} x {item.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
