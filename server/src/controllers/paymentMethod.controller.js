const paymentMethodService = require('~/services/paymentMethod.service');

class PaymentMethodController {
    async index(req, res, next) {
        try {
            const paymentMethods = await paymentMethodService.getPaymentMethods();

            return res.status(200).json({
                success: true,
                data: paymentMethods
            });
        } catch (error) {
            next(error);
        }
    }

    async active(req, res, next) {
        try {
            const paymentMethods = await paymentMethodService.getActivePaymentMethods();

            return res.status(200).json({
                success: true,
                data: paymentMethods
            });
        } catch (error) {
            next(error);
        }
    }

    async show(req, res, next) {
        try {
            const paymentMethod = await paymentMethodService.getPaymentMethodById(req.params.id);

            return res.status(200).json({
                success: true,
                data: paymentMethod
            });
        } catch (error) {
            next(error);
        }
    }

    async store(req, res, next) {
        try {
            const paymentMethod = await paymentMethodService.createPaymentMethod(req.body);

            return res.status(201).json({
                success: true,
                message: 'Tạo phương thức thanh toán thành công',
                data: paymentMethod
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const paymentMethod = await paymentMethodService.updatePaymentMethod(req.params.id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật phương thức thanh toán thành công',
                data: paymentMethod
            });
        } catch (error) {
            next(error);
        }
    }

    async destroy(req, res, next) {
        try {
            await paymentMethodService.deletePaymentMethod(req.params.id);

            return res.status(200).json({
                success: true,
                message: 'Xóa phương thức thanh toán thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PaymentMethodController();
