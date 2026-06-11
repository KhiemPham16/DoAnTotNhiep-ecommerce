import classNames from 'classnames/bind';

import MediaPicker from '~/components/MediaPicker';

import styles from './DashboardBlogs.module.scss';

const cx = classNames.bind(styles);

export default function PostForm({ formData, saving, onChange, onClose, onSubmit }) {
    return (
        <form className={cx('form')} onSubmit={onSubmit}>
            <label>
                Tiêu đề
                <input name="title" required value={formData.title} onChange={onChange} />
            </label>

            <label>
                Mô tả ngắn
                <input name="excerpt" value={formData.excerpt} onChange={onChange} />
            </label>

            <div className={cx('formGrid')}>
                <MediaPicker
                    name="coverImageUrl"
                    label="Ảnh đại diện"
                    folder="posts"
                    placeholder="/uploads/media/posts/example.jpg"
                    value={formData.coverImageUrl}
                    onChange={onChange}
                />
                <label>
                    Trạng thái
                    <select name="status" value={formData.status} onChange={onChange}>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Public</option>
                    </select>
                </label>
            </div>

            <label>
                Dòng giới thiệu
                <input name="dek" required value={formData.dek} onChange={onChange} />
            </label>

            <div className={cx('formGrid')}>
                <label>
                    Thời gian đọc
                    <input name="readMinutes" type="number" min="1" required value={formData.readMinutes} onChange={onChange} />
                </label>
                <label className={cx('checkLabel')}>
                    <input name="featured" type="checkbox" checked={formData.featured} onChange={onChange} />
                    Bài viết nổi bật
                </label>
            </div>

            <label>
                Nội dung HTML
                <textarea name="bodyHtml" rows="10" required value={formData.bodyHtml} onChange={onChange} />
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
