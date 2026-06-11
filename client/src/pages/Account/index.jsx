import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { toast } from 'sonner';
import { FiBox, FiGrid, FiLock, FiLogOut, FiShoppingCart, FiTrendingUp, FiUser } from 'react-icons/fi';

import { useAuthStore } from '~/stores/useAuthStore';
import { useOrderStore } from '~/stores/useOrderStore';
import { formatDate, formatMoney, getImageUrl, orderStatusLabels, paymentStatusLabels } from '~/utils/dashboardUtils';

import styles from './Account.module.scss';

const cx = classNames.bind(styles);

const dashboardRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

export default function Account() {
    const { user, loading: profileLoading, changePassword, logout, updateAvatar, updateProfile } = useAuthStore();
    const { orders, loading, fetchMyOrders } = useOrderStore();
    const [profileForm, setProfileForm] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        gender: user?.gender || ''
    });
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchMyOrders();
    }, [fetchMyOrders]);

    useEffect(() => {
        setProfileForm({
            fullName: user?.fullName || '',
            phone: user?.phone || '',
            gender: user?.gender || ''
        });
    }, [user]);

    const orderStats = useMemo(() => {
        const completedOrders = orders.filter((order) => order.status === 'COMPLETED');
        const activeOrders = orders.filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.status));
        const totalSpent = completedOrders.reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);

        return {
            total: orders.length,
            active: activeOrders.length,
            completed: completedOrders.length,
            totalSpent
        };
    }, [orders]);

    const recentOrders = useMemo(
        () =>
            [...orders]
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 3),
        [orders]
    );

    const initials = useMemo(() => {
        const source = user?.fullName || user?.email || 'U';
        return source
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0])
            .join('')
            .toUpperCase();
    }, [user]);

    const handleLogout = async () => {
        await logout();
    };

    const handleProfileChange = (event) => {
        const { name, value } = event.target;

        setProfileForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();

        if (!profileForm.fullName.trim()) {
            toast.error('Vui lòng nhập họ tên');
            return;
        }

        await updateProfile({
            fullName: profileForm.fullName.trim(),
            phone: profileForm.phone.trim() || null,
            gender: profileForm.gender || null
        });
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh');
            return;
        }

        await updateAvatar(file);
    };

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;

        setPasswordForm((current) => ({
            ...current,
            [name]: value
        }));
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('Vui lòng nhập đầy đủ thông tin đổi mật khẩu');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error('Mật khẩu mới cần ít nhất 6 ký tự');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Mật khẩu nhập lại không khớp');
            return;
        }

        const success = await changePassword(passwordForm.oldPassword, passwordForm.newPassword);

        if (success !== false) {
            setPasswordForm({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    };

    return (
        <main className={cx('wrapper')}>
            <section className={cx('hero')}>
                <label className={cx('avatar')} title="Đổi avatar">
                    {user?.avatarUrl ? <img src={getImageUrl(user.avatarUrl)} alt={user.fullName || 'Avatar'} /> : initials}
                    <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={profileLoading} />
                    <span>Đổi ảnh</span>
                </label>
                <div className={cx('heroInfo')}>
                    <span>Tài khoản BookStory</span>
                    <h1>{user?.fullName || 'Khách hàng'}</h1>
                    <p>{user?.email || 'Chưa có email'}</p>
                </div>
                <div className={cx('heroActions')}>
                    {dashboardRoles.includes(user?.role) && (
                        <Link className={cx('outlineBtn')} to="/dashboard">
                            <FiGrid />
                            Dashboard
                        </Link>
                    )}
                    <button className={cx('dangerBtn')} type="button" onClick={handleLogout}>
                        <FiLogOut />
                        Đăng xuất
                    </button>
                </div>
            </section>

            <section className={cx('statsGrid')}>
                <div className={cx('statCard')}>
                    <FiShoppingCart />
                    <span>Tổng đơn hàng</span>
                    <strong>{orderStats.total}</strong>
                </div>
                <div className={cx('statCard')}>
                    <FiBox />
                    <span>Đơn đang xử lý</span>
                    <strong>{orderStats.active}</strong>
                </div>
                <div className={cx('statCard')}>
                    <FiTrendingUp />
                    <span>Đã hoàn thành</span>
                    <strong>{orderStats.completed}</strong>
                </div>
                <div className={cx('statCard')}>
                    <FiLock />
                    <span>Tổng đã mua</span>
                    <strong>{formatMoney(orderStats.totalSpent)}</strong>
                </div>
            </section>

            <section className={cx('contentGrid')}>
                <div className={cx('panel')}>
                    <div className={cx('panelHeader')}>
                        <div>
                            <h2>Thông tin cá nhân</h2>
                            <p>Cập nhật hồ sơ dùng cho tài khoản và đơn hàng.</p>
                        </div>
                        <FiUser />
                    </div>

                    <form className={cx('profileForm')} onSubmit={handleProfileSubmit}>
                        <label>
                            Họ tên
                            <input
                                name="fullName"
                                value={profileForm.fullName}
                                onChange={handleProfileChange}
                                placeholder="Nhập họ tên"
                            />
                        </label>

                        <label>
                            Email
                            <input value={user?.email || ''} disabled />
                        </label>

                        <label>
                            Số điện thoại
                            <input
                                name="phone"
                                value={profileForm.phone}
                                onChange={handleProfileChange}
                                placeholder="Nhập số điện thoại"
                            />
                        </label>

                        <label>
                            Giới tính
                            <select name="gender" value={profileForm.gender} onChange={handleProfileChange}>
                                <option value="">Chưa cập nhật</option>
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </label>

                        <label>
                            Vai trò
                            <input value={user?.role || 'CUSTOMER'} disabled />
                        </label>

                        <button type="submit" disabled={profileLoading}>
                            {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </form>

                    <div className={cx('quickLinks')}>
                        <Link to="/account/orders">Xem lịch sử mua hàng</Link>
                        <Link to="/category">Tiếp tục mua sách</Link>
                    </div>
                </div>

                <div className={cx('panel')}>
                    <div className={cx('panelHeader')}>
                        <div>
                            <h2>Đơn hàng gần đây</h2>
                            <p>Theo dõi nhanh trạng thái các đơn mới nhất.</p>
                        </div>
                        <Link to="/account/orders">Xem tất cả</Link>
                    </div>

                    {loading ? (
                        <div className={cx('stateBox')}>Đang tải đơn hàng...</div>
                    ) : recentOrders.length === 0 ? (
                        <div className={cx('stateBox')}>
                            <strong>Bạn chưa có đơn hàng nào.</strong>
                            <Link to="/category">Khám phá sách ngay</Link>
                        </div>
                    ) : (
                        <div className={cx('recentOrders')}>
                            {recentOrders.map((order) => (
                                <Link className={cx('orderItem')} key={order.id} to={`/account/orders/${order.id}`}>
                                    <div>
                                        <strong>#{order.id.slice(0, 8)}</strong>
                                        <span>{formatDate(order.createdAt, { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div>
                                        <span className={cx('badge', order.status?.toLowerCase())}>
                                            {orderStatusLabels[order.status] || order.status}
                                        </span>
                                        <small>{paymentStatusLabels[order.paymentStatus] || order.paymentStatus}</small>
                                    </div>
                                    <strong>{formatMoney(order.finalAmount)}</strong>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className={cx('panel')}>
                    <div className={cx('panelHeader')}>
                        <div>
                            <h2>Đổi mật khẩu</h2>
                            <p>Cập nhật mật khẩu định kỳ để bảo vệ tài khoản.</p>
                        </div>
                        <FiLock />
                    </div>

                    <form className={cx('profileForm')} onSubmit={handlePasswordSubmit}>
                        <label>
                            Mật khẩu hiện tại
                            <input
                                name="oldPassword"
                                type="password"
                                value={passwordForm.oldPassword}
                                onChange={handlePasswordChange}
                                placeholder="Nhập mật khẩu hiện tại"
                                autoComplete="current-password"
                            />
                        </label>

                        <label>
                            Mật khẩu mới
                            <input
                                name="newPassword"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Tối thiểu 6 ký tự"
                                autoComplete="new-password"
                            />
                        </label>

                        <label>
                            Nhập lại mật khẩu mới
                            <input
                                name="confirmPassword"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Nhập lại mật khẩu mới"
                                autoComplete="new-password"
                            />
                        </label>

                        <button type="submit" disabled={profileLoading}>
                            {profileLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}
