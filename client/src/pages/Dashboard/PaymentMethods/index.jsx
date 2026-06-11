import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { toast } from 'sonner';

import { formatDate } from '~/utils/dashboardUtils';
import useDebounce from '~/hooks/useDebounce';
import { usePaymentMethodStore } from '~/stores/usePaymentMethodStore';

import styles from './DashboardPaymentMethods.module.scss';

const cx = classNames.bind(styles);

const initialFormData = {
    name: '',
    code: '',
    description: '',
    isActive: true
};

const normalizeCode = (value) => value.trim().toUpperCase().replace(/\s+/g, '_');

export default function PaymentMethods() {
    const {
        paymentMethods,
        loading,
        saving,
        fetchPaymentMethods,
        createPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod
    } = usePaymentMethodStore();

    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const debouncedKeyword = useDebounce(keyword, 500);

    useEffect(() => {
        fetchPaymentMethods();
    }, [fetchPaymentMethods]);

    const filteredMethods = useMemo(() => {
        const search = debouncedKeyword.trim().toLowerCase();

        return paymentMethods.filter((method) => {
            const matchesKeyword =
                !search ||
                [method.name, method.code, method.description]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(search));
            const matchesStatus = statusFilter === 'all' || String(Boolean(method.isActive)) === statusFilter;

            return matchesKeyword && matchesStatus;
        });
    }, [debouncedKeyword, paymentMethods, statusFilter]);

    const activeCount = useMemo(() => paymentMethods.filter((method) => method.isActive).length, [paymentMethods]);
    const inactiveCount = paymentMethods.length - activeCount;

    const openCreateModal = () => {
        setEditingMethod(null);
        setFormData(initialFormData);
        setIsOpenModal(true);
    };

    const openEditModal = (method) => {
        setEditingMethod(method);
        setFormData({
            name: method.name || '',
            code: method.code || '',
            description: method.description || '',
            isActive: Boolean(method.isActive)
        });
        setIsOpenModal(true);
    };

    const closeModal = () => {
        setIsOpenModal(false);
        setEditingMethod(null);
        setFormData(initialFormData);
    };

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : name === 'code' ? normalizeCode(value) : value
        }));
    };

    const buildPayload = () => ({
        name: formData.name.trim(),
        code: normalizeCode(formData.code),
        description: formData.description.trim() || null,
        isActive: formData.isActive
    });

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = buildPayload();

        if (!payload.name || !payload.code) {
            toast.error('Vui lòng nhập tên và mã phương thức thanh toán');
            return;
        }

        const success = editingMethod
            ? await updatePaymentMethod(editingMethod.id, payload)
            : await createPaymentMethod(payload);

        if (success) {
            closeModal();
        }
    };

    const handleToggleStatus = async (method) => {
        await updatePaymentMethod(method.id, { isActive: !method.isActive });
    };

    const handleDelete = async (method) => {
        if (!window.confirm(`Xóa phương thức thanh toán "${method.name}"?`)) {
            return;
        }

        await deletePaymentMethod(method.id);
    };

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <div>
                    <div className={cx('title')}>Quản lý phương thức thanh toán</div>
                    <div className={cx('subtitle')}>
                        Thêm, cập nhật, bật/tắt và xóa các phương thức thanh toán dùng trong quá trình đặt hàng.
                    </div>
                </div>

                <button className={cx('primaryBtn')} type="button" onClick={openCreateModal}>
                    Thêm phương thức
                </button>
            </div>

            <div className={cx('toolbar')}>
                <input
                    className={cx('input')}
                    type="search"
                    placeholder="Tìm theo tên, mã hoặc mô tả"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                />
                <select
                    className={cx('select')}
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã tắt</option>
                </select>
            </div>

            <div className={cx('summary')}>
                <div>
                    <strong>{filteredMethods.length}</strong>
                    <span>Phương thức hiển thị</span>
                </div>
                <div>
                    <strong>{paymentMethods.length}</strong>
                    <span>Tổng phương thức</span>
                </div>
                <div>
                    <strong>{activeCount}</strong>
                    <span>Đang hoạt động</span>
                </div>
                <div>
                    <strong>{inactiveCount}</strong>
                    <span>Đã tắt</span>
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('tableWrap')}>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Tên phương thức</th>
                                <th>Mã</th>
                                <th>Mô tả</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Cập nhật</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="7">
                                        Đang tải phương thức thanh toán...
                                    </td>
                                </tr>
                            ) : filteredMethods.length === 0 ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="7">
                                        Không có phương thức thanh toán phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredMethods.map((method) => (
                                    <tr key={method.id}>
                                        <td>
                                            <strong>{method.name}</strong>
                                        </td>
                                        <td>
                                            <span className={cx('code')}>{method.code}</span>
                                        </td>
                                        <td>
                                            <span className={cx('description')}>
                                                {method.description || 'Chưa có mô tả'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={cx('badge', method.isActive ? 'active' : 'inactive')}>
                                                {method.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                                            </span>
                                        </td>
                                        <td>{formatDate(method.createdAt)}</td>
                                        <td>{formatDate(method.updatedAt)}</td>
                                        <td>
                                            <div className={cx('rowActions')}>
                                                <button type="button" onClick={() => openEditModal(method)}>
                                                    Sửa
                                                </button>
                                                <button type="button" onClick={() => handleToggleStatus(method)}>
                                                    {method.isActive ? 'Tắt' : 'Bật'}
                                                </button>
                                                <button
                                                    className={cx('danger')}
                                                    type="button"
                                                    onClick={() => handleDelete(method)}
                                                >
                                                    Xóa
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
                            <h2>{editingMethod ? 'Cập nhật phương thức thanh toán' : 'Thêm phương thức thanh toán'}</h2>
                            <button type="button" onClick={closeModal} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <form className={cx('form')} onSubmit={handleSubmit}>
                            <label>
                                Tên phương thức
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Ví dụ: Thanh toán khi nhận hàng"
                                />
                            </label>

                            <label>
                                Mã phương thức
                                <input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="Ví dụ: COD"
                                />
                            </label>

                            <label>
                                Mô tả
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Mô tả ngắn về phương thức thanh toán"
                                    rows={4}
                                />
                            </label>

                            <label className={cx('checkLabel')}>
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                Đang hoạt động
                            </label>

                            <div className={cx('modalActions')}>
                                <button type="button" onClick={closeModal}>
                                    Hủy
                                </button>
                                <button className={cx('primaryBtn')} type="submit" disabled={saving}>
                                    {saving ? 'Đang lưu...' : editingMethod ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
