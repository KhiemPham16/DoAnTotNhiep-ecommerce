export const orderStatusLabels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đang xử lý',
    SHIPPING: 'Đang giao hàng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy'
};

export const paymentStatusLabels = {
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    FAILED: 'Thất bại',
    REFUNDED: 'Hoàn tiền'
};

export const postStatusLabels = {
    DRAFT: 'Draft',
    PUBLISHED: 'Public'
};

export const genderLabels = {
    MALE: 'Nam',
    FEMALE: 'Nữ',
    OTHER: 'Khác'
};

export const roleLabels = {
    ADMIN: 'Quản trị viên',
    MANAGER: 'Quản lý',
    EMPLOYEE: 'Nhân viên',
    CUSTOMER: 'Khách hàng'
};

export const staffRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

export const formatMoney = (value) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(Number(value || 0));

export const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

export const formatDate = (value, options = {}) => {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...options
    }).format(new Date(value));
};

export const toDateKey = (value) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getImageUrl = (path) => {
    if (!path) {
        return '';
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return `${import.meta.env.VITE_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getMediaUrl = (media) => {
    if (!media) {
        return '';
    }

    if (typeof media === 'string') {
        return getImageUrl(media);
    }

    if (media.fileName) {
        return getImageUrl(`/uploads/media/${media.folder || 'common'}/${media.fileName}`);
    }

    return getImageUrl(media.url);
};

export const getMediaValue = (media) => {
    if (!media) {
        return '';
    }

    if (media.fileName) {
        return `/uploads/media/${media.folder || 'common'}/${media.fileName}`;
    }

    return media.url || '';
};

export const formatFileSize = (value) => {
    const size = Number(value || 0);

    if (size >= 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    if (size >= 1024) {
        return `${Math.round(size / 1024)} KB`;
    }

    return `${size} B`;
};

export const normalizePostStatus = (status) => {
    const value = String(status || 'DRAFT').toUpperCase();
    return value === 'PUBLISHED' || value === 'PUBLIC' ? 'PUBLISHED' : 'DRAFT';
};

export const getPostList = (payload) => {
    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.data?.posts)) {
        return payload.data.posts;
    }

    if (Array.isArray(payload?.posts)) {
        return payload.posts;
    }

    return [];
};

export const getPostData = (payload) => payload?.data?.post || payload?.data || payload?.post || payload;

export const getPostId = (post) => post?.id || post?._id;

export const getPostContent = (post) => post?.bodyHtml || post?.content || post?.body || '';

export const getPostCover = (post) => post?.coverImageUrl || post?.thumbnail || post?.coverImage || post?.image || '';

export const isFeaturedPost = (post) =>
    post?.featured === true || post?.featured === 'true' || post?.featured === 1 || post?.featured === '1';

export const sortPostsByFeaturedAndDate = (posts) =>
    [...posts].sort((a, b) => {
        const featuredDiff = Number(isFeaturedPost(b)) - Number(isFeaturedPost(a));

        if (featuredDiff !== 0) {
            return featuredDiff;
        }

        return (
            new Date(b.publishedAt || b.createdAt || 0).getTime() -
            new Date(a.publishedAt || a.createdAt || 0).getTime()
        );
    });
