import classNames from 'classnames/bind';
import { Editor } from '@tinymce/tinymce-react';

import MediaPicker from '~/components/MediaPicker';

import styles from './DashboardBlogs.module.scss';

const cx = classNames.bind(styles);
const tinyMceApiKey = import.meta.env.VITE_TINYMCE_API_KEY;

export default function PostForm({ formData, saving, onChange, onClose, onSubmit }) {
    const handleEditorChange = (value) => {
        onChange({
            target: {
                name: 'bodyHtml',
                value,
                type: 'text'
            }
        });
    };

    return (
        <form className={cx('form')} onSubmit={onSubmit}>
            <label>
                Tiêu đề
                <input name="title" value={formData.title} onChange={onChange} />
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
                <input name="dek" value={formData.dek} onChange={onChange} />
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
                Nội dung bài viết
                <div className={cx('editorShell')}>
                    <Editor
                        apiKey={tinyMceApiKey}
                        value={formData.bodyHtml}
                        disabled={saving}
                        onEditorChange={handleEditorChange}
                        init={{
                            height: 420,
                            menubar: false,
                            branding: false,
                            promotion: false,
                            resize: true,
                            plugins: [
                                'advlist',
                                'autolink',
                                'lists',
                                'link',
                                'image',
                                'charmap',
                                'preview',
                                'anchor',
                                'searchreplace',
                                'visualblocks',
                                'code',
                                'fullscreen',
                                'insertdatetime',
                                'media',
                                'table',
                                'help',
                                'wordcount'
                            ],
                            toolbar:
                                'undo redo | blocks | bold italic underline blockquote | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat code preview fullscreen',
                            content_style:
                                'body { font-family: Inter, Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #111827; } img { max-width: 100%; height: auto; }'
                        }}
                    />
                </div>
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
