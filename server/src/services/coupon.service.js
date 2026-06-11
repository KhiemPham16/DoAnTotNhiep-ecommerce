const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const { validateCreateCouponPayload, validateCouponPayload } = require('~/validators/coupon.validator');

class CouponService {
    generateHolidayCode(expiresAt) {
        const date = new Date(expiresAt);

        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();

        return `SIEUSALE${day}${month}${year}`;
    }

    generateRandomCode() {
        return `SALE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }

    async makeUniqueCode(code) {
        const baseCode = code.toUpperCase().trim();

        let couponCode = baseCode;
        let count = 1;

        while (
            await prisma.coupon.findUnique({
                where: {
                    code: couponCode
                }
            })
        ) {
            couponCode = `${baseCode}-${count}`;
            count++;
        }

        return couponCode;
    }

    async getCoupons() {
        return prisma.coupon.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async getCouponById(couponId) {
        const coupon = await prisma.coupon.findUnique({
            where: {
                id: couponId
            }
        });

        if (!coupon) {
            throw new AppError(404, 'Mã giảm giá không tồn tại');
        }

        return coupon;
    }

    async createCoupon(data) {
        const {
            couponType,
            code,
            type,
            value,
            minOrderAmount,
            maxDiscountAmount,
            usageLimit,
            startsAt,
            expiresAt,
            isActive
        } = data;

        validateCreateCouponPayload(data);

        let couponCode;

        if (couponType === 'holiday') {
            couponCode = this.generateHolidayCode(expiresAt);
        }

        if (couponType === 'random') {
            couponCode = this.generateRandomCode();
        }

        if (couponType === 'custom') {
            couponCode = code;
        }

        couponCode = await this.makeUniqueCode(couponCode);

        return prisma.coupon.create({
            data: {
                couponType: couponType.toUpperCase(),
                code: couponCode,
                type: type.toUpperCase(),
                value,
                minOrderAmount,
                maxDiscountAmount,
                usageLimit,
                startsAt: startsAt ? new Date(startsAt) : null,
                expiresAt: new Date(expiresAt),
                isActive
            }
        });
    }

    async updateCoupon(couponId, data) {
        const coupon = await prisma.coupon.findUnique({
            where: {
                id: couponId
            }
        });

        if (!coupon) {
            throw new AppError(404, 'Mã giảm giá không tồn tại');
        }

        const updateData = {};

        const allowedFields = [
            'value',
            'minOrderAmount',
            'maxDiscountAmount',
            'usageLimit',
            'startsAt',
            'expiresAt',
            'isActive'
        ];

        allowedFields.forEach((field) => {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        });

        if (data.type !== undefined) {
            updateData.type = data.type.toUpperCase();
        }

        if (data.startsAt !== undefined) {
            updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
        }

        if (data.expiresAt !== undefined) {
            updateData.expiresAt = new Date(data.expiresAt);
        }

        return prisma.coupon.update({
            where: {
                id: couponId
            },
            data: updateData
        });
    }

    async deleteCoupon(couponId) {
        const coupon = await prisma.coupon.findUnique({
            where: {
                id: couponId
            }
        });

        if (!coupon) {
            throw new AppError(404, 'Mã giảm giá không tồn tại');
        }

        await prisma.coupon.delete({
            where: {
                id: couponId
            }
        });

        return true;
    }

    async validateCoupon(code, totalAmount) {
        validateCouponPayload(code, totalAmount);

        const coupon = await prisma.coupon.findFirst({
            where: {
                code: code.toUpperCase().trim(),
                isActive: true
            }
        });

        if (!coupon) {
            throw new AppError(404, 'Mã giảm giá không tồn tại');
        }

        const now = new Date();

        if (coupon.startsAt && coupon.startsAt > now) {
            throw new AppError(400, 'Mã giảm giá chưa đến thời gian sử dụng');
        }

        if (coupon.expiresAt < now) {
            throw new AppError(400, 'Mã giảm giá đã hết hạn');
        }

        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            throw new AppError(400, 'Mã giảm giá đã hết lượt sử dụng');
        }

        const orderAmount = Number(totalAmount);
        const minOrderAmount = Number(coupon.minOrderAmount || 0);

        if (orderAmount < minOrderAmount) {
            throw new AppError(400, `Đơn hàng tối thiểu ${minOrderAmount}`);
        }

        let discountAmount = 0;
        const couponValue = Number(coupon.value);

        if (coupon.type === 'PERCENT') {
            discountAmount = (orderAmount * couponValue) / 100;

            if (coupon.maxDiscountAmount) {
                discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
            }
        }

        if (coupon.type === 'FIXED') {
            discountAmount = couponValue;
        }

        discountAmount = Math.min(discountAmount, orderAmount);

        return {
            coupon,
            discountAmount,
            finalAmount: orderAmount - discountAmount
        };
    }
}

module.exports = new CouponService();
