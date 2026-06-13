const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const { validateCreateCouponPayload, validateCouponPayload } = require('~/validators/coupon.validator');

class CouponService {
    toPublicCoupon(coupon) {
        if (!coupon) return null;

        return {
            id: coupon.publicId,
            couponType: coupon.couponType,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrderAmount: coupon.minOrderAmount,
            maxDiscountAmount: coupon.maxDiscountAmount,
            usageLimit: coupon.usageLimit,
            usedCount: coupon.usedCount,
            startsAt: coupon.startsAt,
            expiresAt: coupon.expiresAt,
            isActive: coupon.isActive,
            createdAt: coupon.createdAt,
            updatedAt: coupon.updatedAt
        };
    }

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
        const coupons = await prisma.coupon.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        return coupons.map((coupon) => this.toPublicCoupon(coupon));
    }

    async getCouponById(couponId) {
        const coupon = await prisma.coupon.findUnique({
            where: {
                publicId: couponId
            }
        });

        if (!coupon) {
            throw new AppError(404, 'Mã giảm giá không tồn tại');
        }

        return this.toPublicCoupon(coupon);
    }

    async createCoupon(data) {
        validateCreateCouponPayload(data);

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

        const coupon = await prisma.coupon.create({
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

        return this.toPublicCoupon(coupon);
    }

    async updateCoupon(couponId, data) {
        const coupon = await prisma.coupon.findUnique({
            where: {
                publicId: couponId
            }
        });

        if (!coupon) {
            throw new AppError(404, 'Mã giảm giá không tồn tại');
        }

        const updateData = {};

        const allowedFields = ['value', 'minOrderAmount', 'maxDiscountAmount', 'usageLimit', 'isActive'];

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

        const updatedCoupon = await prisma.coupon.update({
            where: {
                id: coupon.id
            },
            data: updateData
        });

        return this.toPublicCoupon(updatedCoupon);
    }

    async deleteCoupon(couponId) {
        const coupon = await prisma.coupon.findUnique({
            where: {
                publicId: couponId
            }
        });

        if (!coupon) {
            throw new AppError(404, 'Mã giảm giá không tồn tại');
        }

        await prisma.coupon.delete({
            where: {
                id: coupon.id
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
            coupon: this.toPublicCoupon(coupon),
            discountAmount,
            finalAmount: orderAmount - discountAmount
        };
    }
}

module.exports = new CouponService();
