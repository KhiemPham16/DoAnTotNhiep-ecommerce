import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';

import useDebounce from '~/hooks/useDebounce';
import { useCategoryStore } from '~/stores/useCategoryStore';

import CategoryForm from './CategoryForm';
import styles from './DashboardCategories.module.scss';

const cx = classNames.bind(styles);

const initialFormData = {
    name: '',
    isActive: true
};

const formatDate = (value) => {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(value));
};

export default function Categories() {
    const {
        categories,
        loading,
        saving,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        toggleCategoryStatus
    } = useCategoryStore();
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const debouncedKeyword = useDebounce(keyword, 500);

    useEffect(() => {
        fetchCategories();
    }, []);

    const filteredCategories = useMemo(() => {
        const search = debouncedKeyword.trim().toLowerCase();

        return categories.filter((category) => {
            const matchesKeyword =
                !search ||
                [category.name, category.slug].filter(Boolean).some((value) => value.toLowerCase().includes(search));
            const matchesStatus = statusFilter === 'all' || String(Boolean(category.isActive)) === statusFilter;

            return matchesKeyword && matchesStatus;
        });
    }, [categories, debouncedKeyword, statusFilter]);

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData(initialFormData);
        setIsOpenModal(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || '',
            isActive: Boolean(category.isActive)
        });
        setIsOpenModal(true);
    };

    const closeModal = () => {
        setIsOpenModal(false);
        setEditingCategory(null);
        setFormData(initialFormData);
    };

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            name: formData.name.trim(),
            isActive: formData.isActive
        };

        const success = editingCategory
            ? await updateCategory(editingCategory.id, payload)
            : await createCategory({ name: payload.name });

        if (success) {
            closeModal();
        }
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`Xóa danh mục "${category.name}"?`)) {
            return;
        }

        await deleteCategory(category.id);
    };

    const handleToggleStatus = async (category) => {
        await toggleCategoryStatus(category);
    };

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <div>
                    <div className={cx('title')}>Quản lý danh mục</div>
                    <div className={cx('subtitle')}>Thêm mới, cập nhật, xóa và xem danh sách danh mục sản phẩm.</div>
                </div>

                <button className={cx('primaryBtn')} type="button" onClick={openCreateModal}>
                    Thêm danh mục
                </button>
            </div>

            <div className={cx('toolbar')}>
                <input
                    className={cx('input')}
                    type="search"
                    placeholder="Tìm theo tên hoặc slug"
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
                    <strong>{filteredCategories.length}</strong>
                    <span>Danh mục hiển thị</span>
                </div>
                <div>
                    <strong>{categories.filter((category) => category.isActive).length}</strong>
                    <span>Đang hoạt động</span>
                </div>
                <div>
                    <strong>{categories.filter((category) => !category.isActive).length}</strong>
                    <span>Đã tắt</span>
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('tableWrap')}>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Tên danh mục</th>
                                <th>Slug</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Cập nhật</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="6">
                                        Đang tải danh mục...
                                    </td>
                                </tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="6">
                                        Không có danh mục phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((category) => (
                                    <tr key={category.id}>
                                        <td>
                                            <strong>{category.name}</strong>
                                        </td>
                                        <td>
                                            <span className={cx('slug')}>{category.slug}</span>
                                        </td>
                                        <td>
                                            <span className={cx('badge', category.isActive ? 'active' : 'inactive')}>
                                                {category.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                                            </span>
                                        </td>
                                        <td>{formatDate(category.createdAt)}</td>
                                        <td>{formatDate(category.updatedAt)}</td>
                                        <td>
                                            <div className={cx('rowActions')}>
                                                <button type="button" onClick={() => openEditModal(category)}>
                                                    Sửa
                                                </button>
                                                <button type="button" onClick={() => handleToggleStatus(category)}>
                                                    {category.isActive ? 'Tắt' : 'Bật'}
                                                </button>
                                                <button
                                                    className={cx('danger')}
                                                    type="button"
                                                    onClick={() => handleDelete(category)}
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
                            <h2>{editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h2>
                            <button type="button" onClick={closeModal} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <CategoryForm
                            editingCategory={editingCategory}
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
