import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';

import { formatFileSize, getMediaUrl, getMediaValue, getImageUrl } from '~/utils/dashboardUtils';
import useDebounce from '~/hooks/useDebounce';
import { useMediaStore } from '~/stores/useMediaStore';

import styles from './MediaPicker.module.scss';

const cx = classNames.bind(styles);

export default function MediaPicker({
    name,
    value,
    label,
    placeholder = '/uploads/media/common/example.jpg',
    folder = 'common',
    onChange
}) {
    const { media, loading, uploading, fetchMedia, uploadMedia } = useMediaStore();
    const [isOpen, setIsOpen] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [uploadData, setUploadData] = useState({
        file: null,
        alt: '',
        folder
    });
    const debouncedKeyword = useDebounce(keyword, 500);

    useEffect(() => {
        if (isOpen) {
            fetchMedia();
        }
    }, [fetchMedia, isOpen]);

    const imageMedia = useMemo(() => {
        const search = debouncedKeyword.trim().toLowerCase();

        return media
            .filter((item) => item.type === 'IMAGE' || item.mimeType?.startsWith('image/'))
            .filter((item) => {
                if (!search) {
                    return true;
                }

                return [item.originalName, item.fileName, item.alt, item.folder]
                    .filter(Boolean)
                    .some((text) => text.toLowerCase().includes(search));
            });
    }, [debouncedKeyword, media]);

    const emitChange = (nextValue) => {
        onChange({
            target: {
                name,
                value: nextValue,
                type: 'text'
            }
        });
    };

    const handleSelect = (item) => {
        emitChange(getMediaValue(item));
        setIsOpen(false);
    };

    const handleUpload = async () => {
        if (!uploadData.file) {
            return;
        }

        const success = await uploadMedia(uploadData);

        if (success) {
            setUploadData({
                file: null,
                alt: '',
                folder
            });
        }
    };

    return (
        <div className={cx('picker')}>
            <label>
                {label}
                <div className={cx('inputRow')}>
                    <input name={name} placeholder={placeholder} value={value} onChange={onChange} />
                    <button type="button" onClick={() => setIsOpen(true)}>
                        Chọn ảnh
                    </button>
                </div>
            </label>

            {value && (
                <div className={cx('preview')}>
                    <img src={getImageUrl(value)} alt="" />
                    <span>{value}</span>
                </div>
            )}

            {isOpen && (
                <div className={cx('overlay')}>
                    <div className={cx('modal')}>
                        <div className={cx('header')}>
                            <div>
                                <h2>Thư viện ảnh</h2>
                                <span>Chọn ảnh từ media hoặc upload ảnh mới.</span>
                            </div>
                            <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <div className={cx('uploadBox')}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    setUploadData((current) => ({
                                        ...current,
                                        file: event.target.files?.[0] || null
                                    }))
                                }
                            />
                            <input
                                placeholder="Alt text"
                                value={uploadData.alt}
                                onChange={(event) =>
                                    setUploadData((current) => ({
                                        ...current,
                                        alt: event.target.value
                                    }))
                                }
                            />
                            <input
                                placeholder="Folder"
                                value={uploadData.folder}
                                onChange={(event) =>
                                    setUploadData((current) => ({
                                        ...current,
                                        folder: event.target.value
                                    }))
                                }
                            />
                            <button type="button" onClick={handleUpload} disabled={uploading || !uploadData.file}>
                                {uploading ? 'Đang upload...' : 'Upload'}
                            </button>
                        </div>

                        <div className={cx('toolbar')}>
                            <input
                                type="search"
                                placeholder="Tìm theo tên ảnh, alt, folder"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                            />
                        </div>

                        <div className={cx('body')}>
                            {loading ? (
                                <div className={cx('empty')}>Đang tải thư viện ảnh...</div>
                            ) : imageMedia.length === 0 ? (
                                <div className={cx('empty')}>Chưa có ảnh phù hợp.</div>
                            ) : (
                                <div className={cx('grid')}>
                                    {imageMedia.map((item) => (
                                        <button
                                            className={cx('item')}
                                            type="button"
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                        >
                                            <img src={getMediaUrl(item)} alt={item.alt || item.originalName || ''} />
                                            <strong>{item.alt || item.originalName || item.fileName}</strong>
                                            <span>
                                                {item.folder || 'common'} · {formatFileSize(item.size)}
                                            </span>
                                        </button>
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
