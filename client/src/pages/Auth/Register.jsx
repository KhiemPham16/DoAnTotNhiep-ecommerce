import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from './Auth.module.scss';
import { useAuthStore } from '~/stores/useAuthStore';

const cx = classNames.bind(styles);
const PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

export default function Register() {
    const navigate = useNavigate();
    const { register, loading } = useAuthStore();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = ({ target: { name, value } }) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nextErrors = {};
        const fullName = formData.fullName.trim();
        const email = formData.email.trim();
        const phone = formData.phone.trim();

        if (!fullName) nextErrors.fullName = 'Vui lòng nhập họ và tên.';
        if (!email) nextErrors.email = 'Vui lòng nhập email.';
        else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Email không hợp lệ.';
        if (!phone) nextErrors.phone = 'Vui lòng nhập số điện thoại.';
        else if (!PHONE_REGEX.test(phone)) nextErrors.phone = 'Số điện thoại không hợp lệ.';
        if (!formData.password) nextErrors.password = 'Vui lòng nhập mật khẩu.';
        if (!formData.confirmPassword) nextErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
        else if (formData.password !== formData.confirmPassword) {
            nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp.';
        }

        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        const result = await register(fullName, email, phone, formData.password);

        if (!result.success) {
            setErrors({ email: result.message });
            return;
        }

        navigate('/auth/login');
    };

    const renderField = (name, label, type, placeholder, autoComplete) => (
        <div className={cx('field')}>
            <label className={cx('label')} htmlFor={name}>{label}</label>
            <input
                id={name}
                className={cx('input', { inputError: errors[name] })}
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                aria-invalid={Boolean(errors[name])}
            />
            {errors[name] && <p className={cx('fieldError')}>{errors[name]}</p>}
        </div>
    );

    const renderPasswordField = (name, label, visible, setVisible) => (
        <div className={cx('field')}>
            <label className={cx('label')} htmlFor={name}>{label}</label>
            <div className={cx('passwordInput')}>
                <input
                    id={name}
                    className={cx('input', { inputError: errors[name] })}
                    type={visible ? 'text' : 'password'}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors[name])}
                />
                <button
                    className={cx('visibilityButton')}
                    type="button"
                    onClick={() => setVisible((prev) => !prev)}
                    aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                    {visible ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
            {errors[name] && <p className={cx('fieldError')}>{errors[name]}</p>}
        </div>
    );

    return (
        <form className={cx('form')} onSubmit={handleSubmit} noValidate>
            {renderField('fullName', 'Họ và tên', 'text', 'Nguyễn Văn A', 'name')}
            {renderField('email', 'Email', 'email', 'you@example.com', 'email')}
            {renderField('phone', 'Số điện thoại', 'tel', '0xxxxxxxxx', 'tel')}
            {renderPasswordField('password', 'Mật khẩu', showPassword, setShowPassword)}
            {renderPasswordField('confirmPassword', 'Nhập lại mật khẩu', showConfirmPassword, setShowConfirmPassword)}

            <button className={cx('button')} type="submit" disabled={loading}>
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>

            <p className={cx('note')}>
                Đã có tài khoản? <Link className={cx('link')} to="/auth/login">Đăng nhập</Link>
            </p>
            <p className={cx('note')}>Sau khi đăng ký, hãy kiểm tra email để xác thực tài khoản.</p>
        </form>
    );
}
