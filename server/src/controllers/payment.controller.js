const paymentService = require('~/services/payment.service');

async function createSepayCheckout(req, res, next) {
    try {
        const userId = req.user?.userId || req.user?.id || req.user?.sub;

        const result = await paymentService.createSepayCheckout(req.params.orderId, userId);

        res.status(200).json({
            success: true,
            message: 'Tạo thanh toán SePay thành công',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

async function handleSepayWebhook(req, res, next) {
    try {
        await paymentService.handleSepayWebhook(req.body);

        res.status(200).json({
            success: true,
            message: 'Webhook xử lý thành công'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createSepayCheckout,
    handleSepayWebhook
};
