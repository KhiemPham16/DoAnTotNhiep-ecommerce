import classNames from 'classnames/bind';

import styles from './DashboardCategories.module.scss';

const cx = classNames.bind(styles);

export default function CategoryForm({
    editingCategory,
    formData,
    saving,
    onChange,
    onClose,
    onSubmit
}) {
    return (
        <form className={cx('form')} onSubmit={onSubmit}>
            <label>
                Tên danh mục
                <input name="name" required value={formData.name} onChange={onChange} />
            </label>

            {editingCategory && (
                <label className={cx('checkLabel')}>
                    <input name="isActive" type="checkbox" checked={formData.isActive} onChange={onChange} />
                    Đang hoạt động
                </label>
            )}

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
