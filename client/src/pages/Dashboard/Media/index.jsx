import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';

import { formatDate, formatFileSize, getMediaUrl } from '~/utils/dashboardUtils';
import useDebounce from '~/hooks/useDebounce';
import { useMediaStore } from '~/stores/useMediaStore';

import styles from './DashboardMedia.module.scss';

const cx = classNames.bind(styles);

const initialUploadData = {
    file: null,
    alt: '',
    folder: 'common'
};

export default function Media() {
    const {
        media,
        selectedMedia,
        loading,
        saving,
        uploading,
        deletingId,
        fetchMedia,
        fetchMediaDetail,
        uploadMedia,
        updateMedia,
        deleteMedia,
        clearSelectedMedia
    } = useMediaStore();
    const [keyword, setKeyword] = useState('');
    const [typeFilter, setTypeFilter] = useState('IMAGE');
    const [folderFilter, setFolderFilter] = useState('all');
    const [uploadData, setUploadData] = useState(initialUploadData);
    const [editData, setEditData] = useState({
        alt: '',
        folder: ''
    });
    const debouncedKeyword = useDebounce(keyword, 500);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const folders = useMemo(
        () => Array.from(new Set(media.map((item) => item.folder).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [media]
    );

    const filteredMedia = useMemo(() => {
        const search = debouncedKeyword.trim().toLowerCase();

        return media.filter((item) => {
            const matchesType =
                typeFilter === 'all' || item.type === typeFilter || item.mimeType?.startsWith(typeFilter.toLowerCase());
            const matchesFolder = folderFilter === 'all' || item.folder === folderFilter;
            const matchesKeyword =
                !search ||
                [item.originalName, item.fileName, item.alt, item.folder, item.uploadedBy?.fullName]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(search));

            return matchesType && matchesFolder && matchesKeyword;
        });
    }, [folderFilter, debouncedKeyword, media, typeFilter]);

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!uploadData.file) {
            return;
        }

        const success = await uploadMedia(uploadData);

        if (success) {
            setUploadData(initialUploadData);
            event.target.reset();
        }
    };

    const openDetail = async (item) => {
        const mediaDetail = await fetchMediaDetail(item.id);

        if (mediaDetail) {
            setEditData({
                alt: mediaDetail.alt || '',
                folder: mediaDetail.folder || 'common'
            });
        }
    };

    const closeDetail = () => {
        clearSelectedMedia();
        setEditData({ alt: '', folder: '' });
    };

    const handleUpdate = async (event) => {
        event.preventDefault();

        if (!selectedMedia) {
            return;
        }

        await updateMedia(selectedMedia.id, {
            alt: editData.alt.trim() || undefined,
            folder: editData.folder.trim() || 'common'
        });
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Xóa media "${item.originalName || item.fileName}"?`)) {
            return;
        }

        const success = await deleteMedia(item.id);

        if (success && selectedMedia?.id === item.id) {
            closeDetail();
        }
    };

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <div>
                    <div className={cx('title')}>Thư viện Media</div>
                    <div className={cx('subtitle')}>
                        Quản lý hình ảnh, upload file và chọn ảnh dùng cho sản phẩm, blog, nhân viên.
                    </div>
                </div>
            </div>

            <form className={cx('uploadPanel')} onSubmit={handleUpload}>
                <div>
                    <strong>Upload media mới</strong>
                    <span>Hỗ trợ ảnh và các file media theo cấu hình backend.</span>
                </div>
                <input
                    type="file"
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
                <button type="submit" disabled={uploading || !uploadData.file}>
                    {uploading ? 'Đang upload...' : 'Upload'}
                </button>
            </form>

            <div className={cx('toolbar')}>
                <input
                    type="search"
                    placeholder="Tìm theo tên file, alt, folder, người upload"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                />
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                    <option value="all">Tất cả loại</option>
                    <option value="IMAGE">Hình ảnh</option>
                    <option value="VIDEO">Video</option>
                    <option value="DOCUMENT">Tài liệu</option>
                </select>
                <select value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)}>
                    <option value="all">Tất cả folder</option>
                    {folders.map((folder) => (
                        <option key={folder} value={folder}>
                            {folder}
                        </option>
                    ))}
                </select>
            </div>

            <div className={cx('summary')}>
                <div>
                    <strong>{filteredMedia.length}</strong>
                    <span>Media hiển thị</span>
                </div>
                <div>
                    <strong>{media.filter((item) => item.type === 'IMAGE').length}</strong>
                    <span>Hình ảnh</span>
                </div>
                <div>
                    <strong>{folders.length}</strong>
                    <span>Folder</span>
                </div>
            </div>

            <div className={cx('library')}>
                {loading ? (
                    <div className={cx('empty')}>Đang tải thư viện media...</div>
                ) : filteredMedia.length === 0 ? (
                    <div className={cx('empty')}>Chưa có media phù hợp.</div>
                ) : (
                    filteredMedia.map((item) => (
                        <button
                            className={cx('mediaItem')}
                            key={item.id}
                            type="button"
                            onClick={() => openDetail(item)}
                        >
                            <div className={cx('thumb')}>
                                {item.type === 'IMAGE' || item.mimeType?.startsWith('image/') ? (
                                    <img src={getMediaUrl(item)} alt={item.alt || item.originalName || ''} />
                                ) : (
                                    <span>{item.type || 'FILE'}</span>
                                )}
                            </div>
                            <strong>{item.alt || item.originalName || item.fileName}</strong>
                            <span>{item.folder || 'common'}</span>
                            <small>{formatFileSize(item.size)}</small>
                        </button>
                    ))
                )}
            </div>

            {selectedMedia && (
                <div className={cx('overlay')}>
                    <div className={cx('detailModal')}>
                        <div className={cx('modalHeader')}>
                            <div>
                                <h2>Chi tiết media</h2>
                                <span>{selectedMedia.originalName || selectedMedia.fileName}</span>
                            </div>
                            <button type="button" onClick={closeDetail} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <div className={cx('detailBody')}>
                            <div className={cx('preview')}>
                                {selectedMedia.type === 'IMAGE' || selectedMedia.mimeType?.startsWith('image/') ? (
                                    <img
                                        src={getMediaUrl(selectedMedia)}
                                        alt={selectedMedia.alt || selectedMedia.originalName || ''}
                                    />
                                ) : (
                                    <span>{selectedMedia.type || 'FILE'}</span>
                                )}
                            </div>

                            <form className={cx('detailForm')} onSubmit={handleUpdate}>
                                <label>
                                    Alt text
                                    <input
                                        value={editData.alt}
                                        onChange={(event) =>
                                            setEditData((current) => ({ ...current, alt: event.target.value }))
                                        }
                                    />
                                </label>
                                <label>
                                    Folder
                                    <input
                                        value={editData.folder}
                                        onChange={(event) =>
                                            setEditData((current) => ({ ...current, folder: event.target.value }))
                                        }
                                    />
                                </label>
                                <label>
                                    URL
                                    <input readOnly value={getMediaUrl(selectedMedia)} />
                                </label>

                                <div className={cx('meta')}>
                                    <span>Loại: {selectedMedia.type}</span>
                                    <span>Dung lượng: {formatFileSize(selectedMedia.size)}</span>
                                    <span>Ngày upload: {formatDate(selectedMedia.createdAt)}</span>
                                    <span>Người upload: {selectedMedia.uploadedBy?.fullName || '-'}</span>
                                </div>

                                <div className={cx('modalActions')}>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(selectedMedia)}
                                        disabled={deletingId === selectedMedia.id}
                                    >
                                        {deletingId === selectedMedia.id ? 'Đang xóa...' : 'Xóa'}
                                    </button>
                                    <button className={cx('primaryBtn')} type="submit" disabled={saving}>
                                        {saving ? 'Đang xác nhận...' : 'Xác nhận'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
