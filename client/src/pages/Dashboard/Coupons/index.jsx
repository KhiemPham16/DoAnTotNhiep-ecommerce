import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';

import { formatDate, formatMoney } from '~/utils/dashboardUtils';
import useDebounce from '~/hooks/useDebounce';
import { useCouponStore } from '~/stores/useCouponStore';

import CouponForm from './CouponForm';
import styles from './DashboardCoupons.module.scss';

const cx = classNames.bind(styles);

const couponTypeLabels = {
    HOLIDAY: 'Holiday',
    CUSTOM: 'Custom',
    RANDOM: 'Random'
};

const discountTypeLabels = {
    PERCENT: 'Phần trăm',
    FIXED: 'Số tiền'
};

const initialFormData = {
    couponType: 'custom',
    code: '',
    type: 'PERCENT',
    value: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    startsAt: '',
    expiresAt: '',
    isActive: true
};

const toDateTimeInput = (value) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
};

const normalizeCouponType = (value) => String(value || 'CUSTOM').toUpperCase();

const buildPayload = (formData, isEditing) => {
    const payload = {
        type: formData.type,
        value: Number(formData.value),
        minOrderAmount: formData.minOrderAmount === '' ? null : Number(formData.minOrderAmount),
        maxDiscountAmount:
            formData.type === 'PERCENT' && formData.maxDiscountAmount !== ''
                ? Number(formData.maxDiscountAmount)
                : null,
        usageLimit: formData.usageLimit === '' ? null : Number(formData.usageLimit),
        startsAt: formData.startsAt || null,
        expiresAt: formData.expiresAt,
        isActive: formData.isActive
    };

    if (!isEditing) {
        payload.couponType = formData.couponType;

        if (formData.couponType === 'custom') {
            payload.code = formData.code.trim();
        }
    }

    return payload;
};

export default function Coupons() {
    const { coupons, loading, saving, fetchCoupons, createCoupon, updateCoupon, deleteCoupon } = useCouponStore();
    const [keyword, setKeyword] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const debouncedKeyword = useDebounce(keyword, 500);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const filteredCoupons = useMemo(() => {
        const search = debouncedKeyword.trim().toLowerCase();

        return coupons.filter((coupon) => {
            const couponType = normalizeCouponType(coupon.couponType);
            const matchesType = typeFilter === 'all' || couponType === typeFilter;
            const matchesStatus = statusFilter === 'all' || String(Boolean(coupon.isActive)) === statusFilter;
            const matchesKeyword =
                !search ||
                [coupon.code, coupon.couponType, coupon.type]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(search));

            return matchesType && matchesStatus && matchesKeyword;
        });
    }, [coupons, debouncedKeyword, statusFilter, typeFilter]);

    const activeCoupons = useMemo(() => coupons.filter((coupon) => coupon.isActive), [coupons]);
    const expiredCoupons = useMemo(
        () => coupons.filter((coupon) => new Date(coupon.expiresAt) < new Date()),
        [coupons]
    );

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'type' && value === 'FIXED' ? { maxDiscountAmount: '' } : {})
        }));
    };

    const openCreateModal = () => {
        setEditingCoupon(null);
        setFormData(initialFormData);
        setIsOpenModal(true);
    };

    const openEditModal = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            couponType: normalizeCouponType(coupon.couponType).toLowerCase(),
            code: coupon.code || '',
            type: coupon.type || 'PERCENT',
            value: coupon.value ? String(coupon.value) : '',
            minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : '',
            maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '',
            usageLimit: coupon.usageLimit !== null && coupon.usageLimit !== undefined ? String(coupon.usageLimit) : '',
            startsAt: toDateTimeInput(coupon.startsAt),
            expiresAt: toDateTimeInput(coupon.expiresAt),
            isActive: Boolean(coupon.isActive)
        });
        setIsOpenModal(true);
    };

    const closeModal = () => {
        setIsOpenModal(false);
        setEditingCoupon(null);
        setFormData(initialFormData);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = buildPayload(formData, Boolean(editingCoupon));
        const success = editingCoupon ? await updateCoupon(editingCoupon.id, payload) : await createCoupon(payload);

        if (success) {
            closeModal();
        }
    };

    const handleToggleStatus = async (coupon) => {
        await updateCoupon(coupon.id, { isActive: !coupon.isActive });
    };

    const handleDelete = async (coupon) => {
        if (!window.confirm(`Xóa mã giảm giá "${coupon.code}"?`)) {
            return;
        }

        await deleteCoupon(coupon.id);
    };

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <div>
                    <div className={cx('title')}>Quản lý mã giảm giá</div>
                    <div className={cx('subtitle')}>
                        Tạo mã holiday, custom, random; cập nhật điều kiện sử dụng, thời hạn và trạng thái mã.
                    </div>
                </div>

                <button className={cx('primaryBtn')} type="button" onClick={openCreateModal}>
                    Thêm mã giảm giá
                </button>
            </div>

            <div className={cx('toolbar')}>
                <input
                    className={cx('input')}
                    type="search"
                    placeholder="Tìm theo mã, loại mã, kiểu giảm"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                />
                <select
                    className={cx('select')}
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                >
                    <option value="all">Tất cả loại mã</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="CUSTOM">Custom</option>
                    <option value="RANDOM">Random</option>
                </select>
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
                    <strong>{filteredCoupons.length}</strong>
                    <span>Mã hiển thị</span>
                </div>
                <div>
                    <strong>{coupons.length}</strong>
                    <span>Tổng mã</span>
                </div>
                <div>
                    <strong>{activeCoupons.length}</strong>
                    <span>Đang hoạt động</span>
                </div>
                <div>
                    <strong>{expiredCoupons.length}</strong>
                    <span>Đã hết hạn</span>
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('tableWrap')}>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Loại</th>
                                <th>Kiểu giảm</th>
                                <th>Điều kiện</th>
                                <th>Lượt dùng</th>
                                <th>Hết hạn</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="8">
                                        Đang tải danh sách mã giảm giá...
                                    </td>
                                </tr>
                            ) : filteredCoupons.length === 0 ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="8">
                                        Chưa có mã giảm giá phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredCoupons.map((coupon) => {
                                    const couponType = normalizeCouponType(coupon.couponType);
                                    const typeClass = couponType.toLowerCase();
                                    const isExpired = new Date(coupon.expiresAt) < new Date();

                                    return (
                                        <tr key={coupon.id}>
                                            <td>
                                                <div className={cx('codeCell')}>
                                                    <strong>{coupon.code}</strong>
                                                    <span>{isExpired ? 'Đã hết hạn' : 'Còn hiệu lực'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={cx('badge', typeClass)}>
                                                    {couponTypeLabels[couponType] || couponType}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={cx('codeCell')}>
                                                    <strong>{discountTypeLabels[coupon.type] || coupon.type}</strong>
                                                    <span>
                                                        {coupon.type === 'PERCENT'
                                                            ? `${Number(coupon.value)}%`
                                                            : formatMoney(coupon.value)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={cx('codeCell')}>
                                                    <strong>Đơn từ {formatMoney(coupon.minOrderAmount)}</strong>
                                                    <span>
                                                        Tối đa:{' '}
                                                        {coupon.maxDiscountAmount
                                                            ? formatMoney(coupon.maxDiscountAmount)
                                                            : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                {coupon.usedCount || 0}/{coupon.usageLimit ?? '∞'}
                                            </td>
                                            <td>{formatDate(coupon.expiresAt)}</td>
                                            <td>
                                                <span className={cx('badge', coupon.isActive ? 'active' : 'inactive')}>
                                                    {coupon.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={cx('rowActions')}>
                                                    <button type="button" onClick={() => openEditModal(coupon)}>
                                                        Sửa
                                                    </button>
                                                    <button type="button" onClick={() => handleToggleStatus(coupon)}>
                                                        {coupon.isActive ? 'Tắt' : 'Bật'}
                                                    </button>
                                                    <button
                                                        className={cx('danger')}
                                                        type="button"
                                                        onClick={() => handleDelete(coupon)}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isOpenModal && (
                <div className={cx('modalOverlay')}>
                    <div className={cx('modalContent')}>
                        <div className={cx('modalHeader')}>
                            <h2>{editingCoupon ? 'Cập nhật mã giảm giá' : 'Thêm mã giảm giá mới'}</h2>
                            <button type="button" onClick={closeModal} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <CouponForm
                            editingCoupon={editingCoupon}
                            formData={formData}
                            saving={saving}
                            onChange={handleInputChange}
                            onClose={closeModal}
                            onSubmit={handleSubmit}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
