const orderService = require('~/services/order.service');

class OrderController {
    async store(req, res, next) {
        try {
            const order = await orderService.createOrder(req.user.id, req.body);

            return res.status(201).json({
                success: true,
                message: 'Đặt hàng thành công',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    async myOrders(req, res, next) {
        try {
            const orders = await orderService.getMyOrders(req.user.id);

            return res.status(200).json({
                success: true,
                data: orders
            });
        } catch (error) {
            next(error);
        }
    }

    async showMine(req, res, next) {
        try {
            const order = await orderService.getOrderById(req.user.id, req.params.id);

            return res.status(200).json({
                success: true,
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    async index(req, res, next) {
        try {
            const orders = await orderService.getOrders();

            return res.status(200).json({
                success: true,
                data: orders
            });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req, res, next) {
        try {
            const order = await orderService.updateStatus(req.params.id, req.body.status);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái đơn hàng thành công',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    async updatePaymentStatus(req, res, next) {
        try {
            const order = await orderService.updatePaymentStatus(req.params.id, req.body.paymentStatus);

            return res.success(200, order, {
                message: 'Cập nhật trạng thái thanh toán thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    async cancelMine(req, res, next) {
        try {
            const order = await orderService.cancelMyOrder(req.user.id, req.params.id);

            return res.status(200).json({
                success: true,
                message: 'Hủy đơn hàng thành công',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrderController();
