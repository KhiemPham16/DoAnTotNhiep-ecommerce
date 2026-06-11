const couponService = require('~/services/coupon.service');

class CouponController {
    async index(req, res, next) {
        try {
            const coupons = await couponService.getCoupons();

            return res.success(200, coupons);
        } catch (error) {
            next(error);
        }
    }

    async show(req, res, next) {
        try {
            const coupon = await couponService.getCouponById(req.params.id);

            return res.success(200, coupon);
        } catch (error) {
            next(error);
        }
    }

    async store(req, res, next) {
        try {
            const coupon = await couponService.createCoupon(req.body);

            return res.success(201, coupon, {
                message: 'Tạo mã giảm giá thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const coupon = await couponService.updateCoupon(req.params.id, req.body);

            return res.success(200, coupon, {
                message: 'Cập nhật mã giảm giá thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async destroy(req, res, next) {
        try {
            await couponService.deleteCoupon(req.params.id);

            return res.success(200, null, {
                message: 'Xóa mã giảm giá thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async validate(req, res, next) {
        try {
            const result = await couponService.validateCoupon(req.body.code, req.body.totalAmount);

            return res.success(200, result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CouponController();
