import classNames from 'classnames/bind';

import MediaPicker from '~/components/MediaPicker';

import styles from './DashboardCustomers.module.scss';

const cx = classNames.bind(styles);

export default function CustomerForm({ editingCustomer, formData, saving, onChange, onClose, onSubmit }) {
    return (
        <form className={cx('form')} onSubmit={onSubmit}>
            <div className={cx('formGrid')}>
                <label>
                    Họ tên
                    <input name="fullName" required value={formData.fullName} onChange={onChange} />
                </label>
                <label>
                    Số điện thoại
                    <input name="phone" required value={formData.phone} onChange={onChange} />
                </label>
            </div>

            <label>
                Email
                <input
                    name="email"
                    type="email"
                    required
                    disabled={Boolean(editingCustomer)}
                    value={formData.email}
                    onChange={onChange}
                />
            </label>

            {!editingCustomer && (
                <label>
                    Mật khẩu tạm thời
                    <input
                        name="password"
                        type="password"
                        required
                        minLength="6"
                        value={formData.password}
                        onChange={onChange}
                        autoComplete="new-password"
                    />
                </label>
            )}

            <div className={cx('formGrid')}>
                <label>
                    Giới tính
                    <select name="gender" value={formData.gender} onChange={onChange}>
                        <option value="">Chưa chọn</option>
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                    </select>
                </label>
                <MediaPicker
                    name="avatarUrl"
                    label="Avatar"
                    folder="avatars"
                    placeholder="/uploads/media/avatars/example.webp"
                    value={formData.avatarUrl}
                    onChange={onChange}
                />
            </div>

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
