import classNames from 'classnames/bind';

import MediaPicker from '~/components/MediaPicker';

import styles from './DashboardProducts.module.scss';

const cx = classNames.bind(styles);

export default function ProductForm({ categories, formData, saving, onChange, onClose, onSubmit }) {
    return (
        <form className={cx('form')} onSubmit={onSubmit}>
            <label>
                Tên sản phẩm
                <input name="title" required value={formData.title} onChange={onChange} />
            </label>

            <label>
                Danh mục
                <select name="categoryId" required value={formData.categoryId} onChange={onChange}>
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </label>

            <div className={cx('formGrid')}>
                <label>
                    Tác giả
                    <input name="author" required value={formData.author} onChange={onChange} />
                </label>
                <label>
                    Nhà xuất bản
                    <input name="publisher" value={formData.publisher} onChange={onChange} />
                </label>
            </div>

            <div className={cx('formGrid')}>
                <label>
                    Giá
                    <input name="price" type="number" min="0" required value={formData.price} onChange={onChange} />
                </label>
                <label>
                    Tồn kho
                    <input name="stock" type="number" min="0" value={formData.stock} onChange={onChange} />
                </label>
            </div>

            <label>
                ISBN
                <input name="isbn" value={formData.isbn} onChange={onChange} />
            </label>

            <MediaPicker
                name="thumbnail"
                label="Ảnh đại diện"
                folder="products"
                placeholder="/uploads/media/products/example.jpg"
                value={formData.thumbnail}
                onChange={onChange}
            />

            <label>
                Mô tả
                <textarea name="description" rows="4" value={formData.description} onChange={onChange} />
            </label>

            <div className={cx('checks')}>
                <label>
                    <input name="isFeatured" type="checkbox" checked={formData.isFeatured} onChange={onChange} />
                    Nổi bật
                </label>
                <label>
                    <input name="isActive" type="checkbox" checked={formData.isActive} onChange={onChange} />
                    Đang bán
                </label>
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
