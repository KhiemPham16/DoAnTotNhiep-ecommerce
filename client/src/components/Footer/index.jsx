import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FaEnvelope, FaFacebook, FaPhoneAlt } from 'react-icons/fa';

import { categoryService } from '~/services/categoryService';

import styles from './Footer.module.scss';

const cx = classNames.bind(styles);

export default function Footer() {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryService.getCategories();
                setCategories((response.data || []).filter((category) => category.isActive).slice(0, 6));
            } catch (error) {
                console.error(error);
            }
        };

        fetchCategories();
    }, []);

    return (
        <footer className={cx('footer')}>
            <div className={cx('footer-top-bar')}>
                <div className={cx('top-bar-container')}>
                    <span>Miễn phí trả nhanh chóng</span>
                    <span>100% sách có bản quyền</span>
                    <span>Giao hàng toàn quốc</span>
                    <span>Quà tặng cho đơn hàng</span>
                </div>
            </div>

            <div className={cx('footer-container')}>
                <div className={cx('footer-column', 'col-logo')}>
                    <Link className={cx('footer-logo')} to="/">
                        Book<span className={cx('logo-accent')}>STORY</span>
                    </Link>
                    <p className={cx('footer-desc')}>
                        Không gian lan tỏa tri thức, mang đến những cuốn sách chất lượng và tinh hoa nhất cho độc giả.
                    </p>
                </div>

                <div className={cx('footer-column')}>
                    <h3>Hỗ trợ khách hàng</h3>
                    <ul>
                        <li>
                            <Link to="/contact">&gt; Liên hệ</Link>
                        </li>
                        <li>
                            <Link to="/category">&gt; Hướng dẫn mua hàng</Link>
                        </li>
                        <li>
                            <Link to="/account/orders">&gt; Lịch sử mua hàng</Link>
                        </li>
                        <li>
                            <Link to="/blog">&gt; Tin tức</Link>
                        </li>
                    </ul>
                </div>

                <div className={cx('footer-column')}>
                    <h3>Liên hệ</h3>
                    <div className={cx('footer-socials')}>
                        <a href="tel:0123456789">
                            <FaPhoneAlt /> Hotline
                        </a>
                    </div>
                    <div className={cx('footer-socials')} style={{ marginTop: '14px' }}>
                        <a href="https://facebook.com" target="_blank" rel="noreferrer">
                            <FaFacebook /> Facebook
                        </a>
                    </div>
                    <div className={cx('footer-socials')} style={{ marginTop: '14px' }}>
                        <a href="mailto:contact@bookstory.com">
                            <FaEnvelope /> Email
                        </a>
                    </div>
                </div>

                <div className={cx('footer-column')}>
                    <h3>Danh mục</h3>
                    <ul>
                        {categories.length === 0 ? (
                            <li>
                                <Link to="/category">&gt; Tất cả sách</Link>
                            </li>
                        ) : (
                            categories.map((category) => (
                                <li key={category.id}>
                                    <Link to={`/category?categoryId=${category.id}`}>&gt; {category.name}</Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            <div className={cx('footer-bottom')}>
                <p>&copy; 2026 BookSTORY. All rights reserved.</p>
            </div>
        </footer>
    );
}
