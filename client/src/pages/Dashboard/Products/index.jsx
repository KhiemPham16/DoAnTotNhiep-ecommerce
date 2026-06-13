import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';

import useDebounce from '~/hooks/useDebounce';
import { useProductStore } from '~/stores/useProductStore';
import { useCategoryStore } from '~/stores/useCategoryStore';

import ProductForm from './ProductForm';
import styles from './DashboardProducts.module.scss';

const cx = classNames.bind(styles);

const initialFormData = {
    title: '',
    categoryId: '',
    author: '',
    publisher: '',
    isbn: '',
    tagline: '',
    description: '',
    thumbnail: '',
    price: '',
    stock: '',
    isFeatured: false,
    isActive: true
};

const formatPrice = (value) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(Number(value || 0));

const getImageUrl = (thumbnail) => {
    if (!thumbnail) return '';

    if (/^https?:\/\//i.test(thumbnail)) {
        return thumbnail;
    }

    return `${import.meta.env.VITE_API_URL}${thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`}`;
};

export default function Products() {
    const { products, loading, saving, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductStore();

    const { categories, fetchCategories } = useCategoryStore();

    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(initialFormData);

    const debouncedKeyword = useDebounce(keyword, 500);

    const productParams = useMemo(
        () => ({
            keyword: debouncedKeyword.trim() || undefined,
            isActive: statusFilter === 'all' ? undefined : statusFilter,
            limit: 100
        }),
        [debouncedKeyword, statusFilter]
    );

    useEffect(() => {
        fetchProducts(productParams, { force: true });
    }, [fetchProducts, productParams]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setFormData(initialFormData);
        setIsOpenModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            title: product.title || '',
            categoryId: product.categoryId || product.category?.id || '',
            author: product.author || '',
            publisher: product.publisher || '',
            isbn: product.isbn || '',
            tagline: product.tagline || '',
            description: product.description || '',
            thumbnail: product.thumbnail || '',
            price: product.price ? String(product.price) : '',
            stock: product.stock ? String(product.stock) : '0',
            isFeatured: Boolean(product.isFeatured),
            isActive: Boolean(product.isActive)
        });
        setIsOpenModal(true);
    };

    const closeModal = () => {
        setIsOpenModal(false);
        setEditingProduct(null);
        setFormData(initialFormData);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            ...formData,
            title: formData.title.trim(),
            author: formData.author.trim(),
            publisher: formData.publisher.trim(),
            isbn: formData.isbn.trim(),
            tagline: formData.tagline.trim(),
            description: formData.description.trim(),
            thumbnail: formData.thumbnail.trim(),
            price: Number(formData.price),
            stock: Number(formData.stock || 0)
        };

        const success = editingProduct
            ? await updateProduct(editingProduct.id, payload, productParams)
            : await createProduct(payload, productParams);

        if (success) {
            closeModal();
        }
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`Xóa sản phẩm "${product.title}"?`)) {
            return;
        }

        await deleteProduct(product.id, productParams);
    };

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <div>
                    <div className={cx('title')}>Quản lý sản phẩm</div>
                    <div className={cx('subtitle')}>Thêm, sửa, xóa và lọc danh sách sản phẩm.</div>
                </div>

                <button className={cx('primaryBtn')} type="button" onClick={openCreateModal}>
                    Thêm sản phẩm
                </button>
            </div>

            <div className={cx('toolbar')}>
                <input
                    className={cx('input')}
                    type="search"
                    placeholder="Tìm theo tên sản phẩm"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                />

                <select
                    className={cx('select')}
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="true">Đang bán</option>
                    <option value="false">Tạm ẩn</option>
                </select>
            </div>

            <div className={cx('card')}>
                <div className={cx('tableWrap')}>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Danh mục</th>
                                <th>Giá</th>
                                <th>Tồn kho</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="6">
                                        Đang tải sản phẩm...
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="6">
                                        Chưa có sản phẩm phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div className={cx('productCell')}>
                                                <div className={cx('thumb')}>
                                                    {product.thumbnail ? (
                                                        <img src={getImageUrl(product.thumbnail)} alt={product.title} />
                                                    ) : (
                                                        <span>{product.title?.slice(0, 1) || '?'}</span>
                                                    )}
                                                </div>

                                                <div>
                                                    <strong>{product.title}</strong>
                                                    <span>{product.author}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>{product.category?.name || '-'}</td>
                                        <td>{formatPrice(product.price)}</td>
                                        <td>{product.stock}</td>

                                        <td>
                                            <span className={cx('badge', product.isActive ? 'active' : 'inactive')}>
                                                {product.isActive ? 'Đang bán' : 'Tạm ẩn'}
                                            </span>
                                        </td>

                                        <td>
                                            <div className={cx('rowActions')}>
                                                <button type="button" onClick={() => openEditModal(product)}>
                                                    Sửa
                                                </button>

                                                <button
                                                    className={cx('danger')}
                                                    type="button"
                                                    onClick={() => handleDelete(product)}
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
                            <h2>{editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h2>

                            <button type="button" onClick={closeModal} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <ProductForm
                            categories={categories}
                            editingProduct={editingProduct}
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
