import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { toast } from 'sonner';

import { formatDate, genderLabels, getImageUrl, roleLabels, staffRoles } from '~/utils/dashboardUtils';
import useDebounce from '~/hooks/useDebounce';
import { useAuthStore } from '~/stores/useAuthStore';
import { useUserStore } from '~/stores/useUserStore';

import EmployeeForm from './EmployeeForm.jsx';
import styles from './DashboardEmployees.module.scss';

const cx = classNames.bind(styles);

const initialFormData = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'EMPLOYEE',
    gender: '',
    avatarUrl: ''
};

const assignableRoles = ['EMPLOYEE', 'MANAGER'];

export default function Employees() {
    const currentUser = useAuthStore((state) => state.user);
    const { users, loading, saving, fetchUsers, createUser, updateUser, deleteUser } = useUserStore();
    const [keyword, setKeyword] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const debouncedKeyword = useDebounce(keyword, 500);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const employees = useMemo(() => users.filter((user) => staffRoles.includes(user.role)), [users]);

    const filteredEmployees = useMemo(() => {
        const search = debouncedKeyword.trim().toLowerCase();

        return employees.filter((employee) => {
            const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
            const matchesKeyword =
                !search ||
                [employee.fullName, employee.email, employee.phone, employee.username]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(search));

            return matchesRole && matchesKeyword;
        });
    }, [employees, debouncedKeyword, roleFilter]);

    const roleOptions = useMemo(() => {
        if (currentUser?.role === 'ADMIN') return assignableRoles;
        if (currentUser?.role === 'MANAGER') return ['EMPLOYEE'];
        return [];
    }, [currentUser?.role]);

    const canCreateEmployee = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
    const canEditEmployee = (employee) =>
        currentUser?.role === 'ADMIN'
            ? assignableRoles.includes(employee.role)
            : currentUser?.role === 'MANAGER' && employee.role === 'EMPLOYEE';
    const canChangeRole = (employee) =>
        currentUser?.role === 'ADMIN' &&
        employee.id !== currentUser?.id &&
        assignableRoles.includes(employee.role);
    const canLockEmployee = (employee) => employee.id !== currentUser?.id && canEditEmployee(employee);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: value
        }));
    };

    const openCreateModal = () => {
        if (!canCreateEmployee) {
            toast.error('Bạn không có quyền tạo nhân viên');
            return;
        }

        setEditingEmployee(null);
        setFormData({
            ...initialFormData,
            role: 'EMPLOYEE'
        });
        setIsOpenModal(true);
    };

    const openEditModal = (employee) => {
        if (!canEditEmployee(employee)) {
            toast.error('Bạn không có quyền cập nhật tài khoản này');
            return;
        }

        setEditingEmployee(employee);
        setFormData({
            fullName: employee.fullName || '',
            email: employee.email || '',
            phone: employee.phone || '',
            password: '',
            role: assignableRoles.includes(employee.role) ? employee.role : 'EMPLOYEE',
            gender: employee.gender || '',
            avatarUrl: employee.avatarUrl || ''
        });
        setIsOpenModal(true);
    };

    const closeModal = () => {
        setIsOpenModal(false);
        setEditingEmployee(null);
        setFormData(initialFormData);
    };

    const getAllowedPayloadRole = () => {
        if (currentUser?.role === 'ADMIN' && assignableRoles.includes(formData.role)) {
            return formData.role;
        }

        return 'EMPLOYEE';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            role: getAllowedPayloadRole(),
            gender: formData.gender || undefined,
            avatarUrl: formData.avatarUrl.trim() || undefined
        };

        if (!editingEmployee) {
            payload.password = formData.password;
        }

        const success = editingEmployee
            ? await updateUser(editingEmployee.id, payload, 'Cập nhật nhân viên thành công')
            : await createUser(payload, 'Thêm nhân viên thành công');

        if (success) {
            closeModal();
        }
    };

    const handleChangeRole = async (employee, role) => {
        if (role === employee.role) return;

        if (!canChangeRole(employee)) {
            toast.error('Chỉ quản trị viên mới được phân quyền nhân viên và quản lý');
            return;
        }

        if (!assignableRoles.includes(role)) {
            toast.error('Chỉ được phân quyền Nhân viên hoặc Quản lý');
            return;
        }

        await updateUser(
            employee.id,
            {
                fullName: employee.fullName,
                phone: employee.phone,
                gender: employee.gender || undefined,
                avatarUrl: employee.avatarUrl || undefined,
                role
            },
            'Cập nhật quyền nhân viên thành công'
        );
    };

    const handleLockEmployee = async (employee) => {
        if (!canLockEmployee(employee)) {
            toast.error('Không thể khóa tài khoản này');
            return;
        }

        if (!window.confirm(`Khóa tài khoản "${employee.fullName}"?`)) return;

        await deleteUser(employee.id, 'Đã khóa tài khoản nhân viên');
    };

    return (
        <div className={cx('page')}>
            <div className={cx('header')}>
                <div>
                    <div className={cx('title')}>Quản lý nhân viên</div>
                    <div className={cx('subtitle')}>
                        Xem danh sách, thêm nhân viên, cập nhật thông tin và phân quyền tài khoản.
                    </div>
                </div>

                <button className={cx('primaryBtn')} type="button" onClick={openCreateModal}>
                    Thêm nhân viên
                </button>
            </div>

            <div className={cx('permissionNote')}>
                <strong>Phân quyền:</strong> Chỉ quản trị viên được phân quyền Nhân viên và Quản lý. Quản lý chỉ được tạo
                và cập nhật tài khoản Nhân viên, không được chỉ định nhân viên khác làm Quản lý. Không ai được tự thay
                đổi quyền của bản thân.
            </div>

            <div className={cx('toolbar')}>
                <input
                    className={cx('input')}
                    type="search"
                    placeholder="Tìm theo tên, email, số điện thoại"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                />
                <select
                    className={cx('select')}
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                >
                    <option value="all">Tất cả quyền</option>
                    {staffRoles.map((role) => (
                        <option key={role} value={role}>
                            {roleLabels[role]}
                        </option>
                    ))}
                </select>
            </div>

            <div className={cx('summary')}>
                <div>
                    <strong>{filteredEmployees.length}</strong>
                    <span>Nhân viên hiển thị</span>
                </div>
                <div>
                    <strong>{employees.filter((employee) => employee.role === 'ADMIN').length}</strong>
                    <span>Quản trị viên</span>
                </div>
                <div>
                    <strong>{employees.filter((employee) => employee.role === 'MANAGER').length}</strong>
                    <span>Quản lý</span>
                </div>
                <div>
                    <strong>{employees.filter((employee) => employee.role === 'EMPLOYEE').length}</strong>
                    <span>Nhân viên</span>
                </div>
            </div>

            <div className={cx('card')}>
                <div className={cx('tableWrap')}>
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Liên hệ</th>
                                <th>Quyền</th>
                                <th>Phân quyền nhanh</th>
                                <th>Giới tính</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="7">
                                        Đang tải danh sách nhân viên...
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td className={cx('empty')} colSpan="7">
                                        Không có nhân viên phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee) => (
                                    <tr key={employee.id}>
                                        <td>
                                            <div className={cx('employeeCell')}>
                                                <div className={cx('avatar')}>
                                                    {employee.avatarUrl ? (
                                                        <img
                                                            src={getImageUrl(employee.avatarUrl)}
                                                            alt={employee.fullName}
                                                        />
                                                    ) : (
                                                        <span>{employee.fullName?.slice(0, 1) || '?'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <strong>{employee.fullName}</strong>
                                                    <span>@{employee.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={cx('contact')}>
                                                <span>{employee.email}</span>
                                                <span>{employee.phone}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={cx('roleBadge', employee.role.toLowerCase())}>
                                                {roleLabels[employee.role]}
                                            </span>
                                        </td>
                                        <td>
                                            {canChangeRole(employee) ? (
                                                <select
                                                    className={cx('permissionSelect')}
                                                    value={employee.role}
                                                    disabled={saving}
                                                    onChange={(event) => handleChangeRole(employee, event.target.value)}
                                                >
                                                    {assignableRoles.map((role) => (
                                                        <option key={role} value={role}>
                                                            {roleLabels[role]}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={cx('permissionLocked')}>Không có quyền</span>
                                            )}
                                        </td>
                                        <td>{genderLabels[employee.gender] || '-'}</td>
                                        <td>{formatDate(employee.createdAt)}</td>
                                        <td>
                                            <div className={cx('rowActions')}>
                                                <button
                                                    type="button"
                                                    disabled={!canEditEmployee(employee)}
                                                    onClick={() => openEditModal(employee)}
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    className={cx('danger')}
                                                    type="button"
                                                    disabled={!canLockEmployee(employee)}
                                                    onClick={() => handleLockEmployee(employee)}
                                                >
                                                    Khóa
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
                            <h2>{editingEmployee ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h2>
                            <button type="button" onClick={closeModal} aria-label="Đóng">
                                ×
                            </button>
                        </div>

                        <EmployeeForm
                            editingEmployee={editingEmployee}
                            formData={formData}
                            roleOptions={roleOptions}
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
