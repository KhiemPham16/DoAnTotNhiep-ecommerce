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
            const result = await orderService.getMyOrders(req.user.id, req.query);

            return res.status(200).json({
                success: true,
                data: result.orders,
                meta: {
                    pagination: result.pagination,
                    statusCounts: result.statusCounts
                }
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
            const order = await orderService.updateStatus(req.params.id, req.body.status, req.user.id);

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

            return res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái thanh toán thành công',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    async assign(req, res, next) {
        try {
            const order = await orderService.assignOrder(req.params.id, req.body.employeeId);

            return res.status(200).json({
                success: true,
                message: 'Phân công nhân viên phụ trách đơn hàng thành công',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    async approve(req, res, next) {
        try {
            const order = await orderService.approveOrder(req.params.id, req.user.id);

            return res.status(200).json({
                success: true,
                message: 'Duyệt đơn hàng thành công',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    async unassign(req, res, next) {
        try {
            const order = await orderService.unassignOrder(req.params.id);

            return res.status(200).json({
                success: true,
                message: 'Hủy phân công đơn hàng thành công',
                data: order
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
