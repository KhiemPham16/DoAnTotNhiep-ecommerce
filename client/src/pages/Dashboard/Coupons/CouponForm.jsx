import classNames from 'classnames/bind';

import styles from './DashboardCoupons.module.scss';

const cx = classNames.bind(styles);

export default function CouponForm({ editingCoupon, formData, saving, onChange, onClose, onSubmit }) {
    const isEditing = Boolean(editingCoupon);

    return (
        <form className={cx('form')} onSubmit={onSubmit}>
            <div className={cx('formGrid')}>
                <label>
                    Loại mã
                    <select name="couponType" value={formData.couponType} onChange={onChange} disabled={isEditing}>
                        <option value="holiday">Holiday</option>
                        <option value="custom">Custom</option>
                        <option value="random">Random</option>
                    </select>
                </label>
                <label>
                    Kiểu giảm
                    <select name="type" required value={formData.type} onChange={onChange}>
                        <option value="PERCENT">Theo phần trăm</option>
                        <option value="FIXED">Theo số tiền</option>
                    </select>
                </label>
            </div>

            {formData.couponType === 'custom' && !isEditing && (
                <label>
                    Mã coupon
                    <input name="code" required value={formData.code} onChange={onChange} placeholder="VD: BOOKSALE50" />
                </label>
            )}

            {formData.couponType === 'holiday' && !isEditing && (
                <div className={cx('hint')}>Holiday sẽ tự tạo mã dạng SIEUSALE + ngày hết hạn.</div>
            )}

            {formData.couponType === 'random' && !isEditing && (
                <div className={cx('hint')}>Random sẽ tự tạo mã dạng SALE-XXXXXX.</div>
            )}

            {isEditing && (
                <label>
                    Mã coupon
                    <input value={editingCoupon.code} readOnly />
                </label>
            )}

            <div className={cx('formGrid')}>
                <label>
                    Giá trị
                    <input name="value" type="number" min="0" required value={formData.value} onChange={onChange} />
                </label>
                <label>
                    Đơn tối thiểu
                    <input name="minOrderAmount" type="number" min="0" value={formData.minOrderAmount} onChange={onChange} />
                </label>
            </div>

            <div className={cx('formGrid')}>
                <label>
                    Giảm tối đa
                    <input
                        name="maxDiscountAmount"
                        type="number"
                        min="0"
                        value={formData.maxDiscountAmount}
                        onChange={onChange}
                        disabled={formData.type !== 'PERCENT'}
                    />
                </label>
                <label>
                    Giới hạn lượt dùng
                    <input name="usageLimit" type="number" min="0" value={formData.usageLimit} onChange={onChange} />
                </label>
            </div>

            <div className={cx('formGrid')}>
                <label>
                    Bắt đầu
                    <input name="startsAt" type="datetime-local" value={formData.startsAt} onChange={onChange} />
                </label>
                <label>
                    Hết hạn
                    <input name="expiresAt" type="datetime-local" required value={formData.expiresAt} onChange={onChange} />
                </label>
            </div>

            <label className={cx('checkLabel')}>
                <input name="isActive" type="checkbox" checked={formData.isActive} onChange={onChange} />
                Đang hoạt động
            </label>

            <div className={cx('modalActions')}>
                <button type="button" onClick={onClose}>
                    Hủy
                </button>
                <button className={cx('primaryBtn')} type="submit" disabled={saving}>
                    {saving ? 'Đang xác nhận...' : 'Xác nhận'}
                </button>
            </div>
        </form>
    );
}
