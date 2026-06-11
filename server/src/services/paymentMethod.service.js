const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const { validateCreatePaymentMethodPayload } = require('~/validators/paymentMethod.validator');

class PaymentMethodService {
    async getPaymentMethods() {
        return prisma.paymentMethod.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async getActivePaymentMethods() {
        return prisma.paymentMethod.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async getPaymentMethodById(paymentMethodId) {
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: {
                id: paymentMethodId
            }
        });

        if (!paymentMethod) {
            throw new AppError(404, 'Phương thức thanh toán không tồn tại');
        }

        return paymentMethod;
    }

    async createPaymentMethod(data) {
        const { name, code, description, isActive } = data;

        validateCreatePaymentMethodPayload(data);

        const normalizedCode = code.toUpperCase().trim();

        const existed = await prisma.paymentMethod.findFirst({
            where: {
                OR: [{ name }, { code: normalizedCode }]
            }
        });

        if (existed) {
            throw new AppError(409, 'Phương thức thanh toán đã tồn tại');
        }

        return prisma.paymentMethod.create({
            data: {
                name,
                code: normalizedCode,
                description,
                isActive
            }
        });
    }

    async updatePaymentMethod(paymentMethodId, data) {
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: {
                id: paymentMethodId
            }
        });

        if (!paymentMethod) {
            throw new AppError(404, 'Phương thức thanh toán không tồn tại');
        }

        const updateData = {};

        if (data.name !== undefined) {
            updateData.name = data.name;
        }

        if (data.code !== undefined) {
            updateData.code = data.code.toUpperCase().trim();
        }

        if (data.description !== undefined) {
            updateData.description = data.description;
        }

        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive;
        }

        return prisma.paymentMethod.update({
            where: {
                id: paymentMethodId
            },
            data: updateData
        });
    }

    async deletePaymentMethod(paymentMethodId) {
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: {
                id: paymentMethodId
            }
        });

        if (!paymentMethod) {
            throw new AppError(404, 'Phương thức thanh toán không tồn tại');
        }

        const orderCount = await prisma.order.count({
            where: {
                paymentMethodId
            }
        });

        if (orderCount > 0) {
            throw new AppError(
                400,
                'Phương thức thanh toán đã được sử dụng, không thể xóa. Hãy tắt trạng thái hoạt động thay thế.'
            );
        }

        await prisma.paymentMethod.delete({
            where: {
                id: paymentMethodId
            }
        });

        return true;
    }
}

module.exports = new PaymentMethodService();
