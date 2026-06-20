import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { FaCartPlus, FaFilter, FaShoppingBag, FaStar } from 'react-icons/fa';
import { formatMoney, getImageUrl } from '~/utils/dashboardUtils';
import useDebounce from '~/hooks/useDebounce';
import { categoryService } from '~/services/categoryService';
import { productService } from '~/services/productService';
import { useCartStore } from '~/stores/useCartStore';

import styles from './Category.module.scss';

const cx = classNames.bind(styles);

const allCategoryId = 'all';
const productsPerPage = 24;

export default function Category() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { addToCart } = useCartStore();
    const searchKeyword = searchParams.get('search')?.trim() || '';
    const categoryIdParam = searchParams.get('categoryId') || allCategoryId;
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(categoryIdParam);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const debouncedSearchKeyword = useDebounce(searchKeyword, 500);

    useEffect(() => {
        setSelectedCategoryId(categoryIdParam);
    }, [categoryIdParam]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                const response = await categoryService.getCategories();
                const categoryList = response.data || [];
                setCategories(categoryList.filter((category) => category.isActive));
            } catch (error) {
                console.error(error);
                toast.error(error?.response?.data?.message || 'Không tải được danh mục sản phẩm');
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

    const productParams = useMemo(
        () => ({
            keyword: debouncedSearchKeyword || undefined,
            categoryId: selectedCategoryId === allCategoryId ? undefined : selectedCategoryId,
            isActive: 'true',
            limit: 1000
        }),
        [debouncedSearchKeyword, selectedCategoryId]
    );

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoadingProducts(true);
                const response = await productService.getProducts(productParams);
                setProducts(response.data || []);
            } catch (error) {
                console.error(error);
                toast.error(error?.response?.data?.message || 'Không tải được sản phẩm');
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchProducts();
    }, [productParams]);

    const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
    const heading = searchKeyword ? `Kết quả tìm kiếm: "${searchKeyword}"` : selectedCategory?.name || 'Tất cả sách';

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchKeyword, selectedCategoryId]);

    const totalPages = Math.ceil(products.length / productsPerPage);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * productsPerPage;
        return products.slice(startIndex, startIndex + productsPerPage);
    }, [currentPage, products]);

    const buildCartProduct = (product) => ({
        id: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
        stock: product.stock,
        category: product.category,
        author: product.author,
        publisher: product.publisher,
        isbn: product.isbn
    });

    const handleAddToCart = (product) => {
        if (Number(product.stock || 0) <= 0) {
            toast.error('Sản phẩm đã hết hàng');
            return;
        }

        addToCart(buildCartProduct(product), 1);
    };

    const handleBuyNow = (product) => {
        if (Number(product.stock || 0) <= 0) {
            toast.error('Sản phẩm đã hết hàng');
            return;
        }

        addToCart(buildCartProduct(product), 1);
        navigate('/cart');
    };

    return (
        <div className={cx('category-wrapper')}>
            <div className={cx('container')}>
                <aside className={cx('sidebar')}>
                    <h2 className={cx('sidebar-title')}>
                        <FaFilter /> Bộ lọc sách
                    </h2>
                    <ul className={cx('genre-list')}>
                        <li
                            className={cx('genre-item', { active: selectedCategoryId === allCategoryId })}
                            onClick={() => setSelectedCategoryId(allCategoryId)}
                        >
                            Tất cả sách
                        </li>

                        {loadingCategories ? (
                            <li className={cx('genre-empty')}>Đang tải danh mục...</li>
                        ) : (
                            categories.map((category) => (
                                <li
                                    key={category.id}
                                    className={cx('genre-item', { active: selectedCategoryId === category.id })}
                                    onClick={() => setSelectedCategoryId(category.id)}
                                >
                                    {category.name}
                                </li>
                            ))
                        )}
                    </ul>
                </aside>

                <main className={cx('content')}>
                    <div className={cx('content-header')}>
                        <h1>{heading}</h1>
                        <p>Tìm thấy {products.length} sản phẩm phù hợp</p>
                    </div>

                    {loadingProducts ? (
                        <div className={cx('empty')}>Đang tải sản phẩm...</div>
                    ) : products.length === 0 ? (
                        <div className={cx('empty')}>Chưa có sản phẩm phù hợp.</div>
                    ) : (
                        <>
                        <div className={cx('products-grid')}>
                            {paginatedProducts.map((product) => (
                                <article key={product.id} className={cx('product-card')}>
                                    <Link to={`/product/${product.slug}`} className={cx('product-link')}>
                                        <div className={cx('thumb')}>
                                            {product.thumbnail ? (
                                                <img src={getImageUrl(product.thumbnail)} alt={product.title} />
                                            ) : (
                                                <span className={cx('thumb-placeholder')}>
                                                    {product.title?.slice(0, 1) || '?'}
                                                </span>
                                            )}
                                        </div>

                                        <div className={cx('info')}>
                                            <span className={cx('tag')}>{product.category?.name || 'Sản phẩm'}</span>
                                            <h3 className={cx('title')}>{product.title}</h3>

                                            <div className={cx('rating')}>
                                                {[...Array(5)].map((_, index) => (
                                                    <FaStar key={index} className={cx('star')} />
                                                ))}
                                            </div>

                                            <div className={cx('price-row')}>
                                                <span className={cx('price')}>{formatMoney(product.price)}</span>
                                            </div>
                                        </div>
                                    </Link>

                                    <div className={cx('product-actions')}>
                                        <button
                                            className={cx('action-btn', 'cart-btn')}
                                            type="button"
                                            onClick={() => handleAddToCart(product)}
                                            title="Thêm vào giỏ hàng"
                                            aria-label="Thêm vào giỏ hàng"
                                        >
                                            <FaCartPlus />
                                        </button>

                                        <button
                                            className={cx('action-btn', 'buy-btn')}
                                            type="button"
                                            onClick={() => handleBuyNow(product)}
                                            title="Mua ngay"
                                            aria-label="Mua ngay"
                                        >
                                            <FaShoppingBag />
                                            <span>Mua</span>
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className={cx('pagination')}>
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                >
                                    Trước
                                </button>

                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={cx({ active: currentPage === page })}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
