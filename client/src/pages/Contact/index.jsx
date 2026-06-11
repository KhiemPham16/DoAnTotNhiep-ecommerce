import React from 'react';
import classNames from 'classnames/bind';
import { CiMap, CiPhone, CiMail } from 'react-icons/ci';

import styles from './Contact.module.scss';

const cx = classNames.bind(styles);

export default function Contact() {
    return (
        <section className={cx('contact-wrapper')}>
            <div className={cx('contact-container')}>
                <div className={cx('contact-left')}>
                    <div className={cx('contact-info')}>
                        <div className={cx('info-item')}>
                            <span className={cx('icon')}>
                                <CiMap />
                            </span>

                            <div className={cx('info-text')}>
                                <h4>Địa chỉ</h4>

                                <p>
                                    40 Nguyễn Huệ, Quận 1,
                                    <br />
                                    Thành phố Hồ Chí Minh, Việt Nam
                                </p>
                            </div>
                        </div>

                        <div className={cx('info-item')}>
                            <span className={cx('icon')}>
                                <CiPhone />
                            </span>

                            <div className={cx('info-text')}>
                                <h4>Số điện thoại</h4>
                                <p>+84 28 3822 5796</p>
                            </div>
                        </div>

                        <div className={cx('info-item')}>
                            <span className={cx('icon')}>
                                <CiMail />
                            </span>

                            <div className={cx('info-text')}>
                                <h4>Email</h4>
                                <p>nsnguyenhue@fahasa.com.vn</p>
                            </div>
                        </div>
                    </div>

                    <div className={cx('contact-form')}>
                        <h2>Liên hệ với chúng tôi</h2>

                        <form>
                            <input type="text" placeholder="Nhập họ và tên" />

                            <input type="email" placeholder="Nhập địa chỉ email" />

                            <textarea placeholder="Nhập nội dung liên hệ"></textarea>

                            <button className={cx('send-btn')} type="submit">
                                Gửi liên hệ
                            </button>
                        </form>
                    </div>
                </div>

                <div className={cx('contact-right')}>
                    <iframe
                        title="Google Map"
                        src="https://www.google.com/maps?q=FAHASA+TPHCM&output=embed"
                        loading="lazy"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>
        </section>
    );
}
