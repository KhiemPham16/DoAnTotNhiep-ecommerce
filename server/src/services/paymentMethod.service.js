const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const { validateCreatePaymentMethodPayload } = require('~/validators/paymentMethod.validator');

class PaymentMethodService {
    toPublicPaymentMethod(paymentMethod) {
        if (!paymentMethod) return null;

        return {
            id: paymentMethod.publicId,
            name: paymentMethod.name,
            code: paymentMethod.code,
            description: paymentMethod.description,
            isActive: paymentMethod.isActive,
            createdAt: paymentMethod.createdAt,
            updatedAt: paymentMethod.updatedAt
        };
    }

    async getPaymentMethods() {
        const paymentMethods = await prisma.paymentMethod.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        return paymentMethods.map((paymentMethod) => this.toPublicPaymentMethod(paymentMethod));
    }

    async getActivePaymentMethods() {
        const paymentMethods = await prisma.paymentMethod.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return paymentMethods.map((paymentMethod) => this.toPublicPaymentMethod(paymentMethod));
    }

    async getPaymentMethodById(paymentMethodId) {
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: {
                publicId: paymentMethodId
            }
        });

        if (!paymentMethod) {
            throw new AppError(404, 'Phương thức thanh toán không tồn tại');
        }

        return this.toPublicPaymentMethod(paymentMethod);
    }

    async createPaymentMethod(data) {
        const { name, code, description, isActive } = data;

        validateCreatePaymentMethodPayload(data);

        const normalizedName = name.trim();
        const normalizedCode = code.toUpperCase().trim();

        const existed = await prisma.paymentMethod.findFirst({
            where: {
                OR: [{ name: normalizedName }, { code: normalizedCode }]
            }
        });

        if (existed) {
            throw new AppError(409, 'Phương thức thanh toán đã tồn tại');
        }

        const paymentMethod = await prisma.paymentMethod.create({
            data: {
                name: normalizedName,
                code: normalizedCode,
                description,
                isActive
            }
        });

        return this.toPublicPaymentMethod(paymentMethod);
    }

    async updatePaymentMethod(paymentMethodId, data) {
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: {
                publicId: paymentMethodId
            }
        });

        if (!paymentMethod) {
            throw new AppError(404, 'Phương thức thanh toán không tồn tại');
        }

        const updateData = {};

        if (data.name !== undefined) {
            updateData.name = data.name.trim();
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

        const updatedPaymentMethod = await prisma.paymentMethod.update({
            where: {
                id: paymentMethod.id
            },
            data: updateData
        });

        return this.toPublicPaymentMethod(updatedPaymentMethod);
    }

    async deletePaymentMethod(paymentMethodId) {
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: {
                publicId: paymentMethodId
            }
        });

        if (!paymentMethod) {
            throw new AppError(404, 'Phương thức thanh toán không tồn tại');
        }

        const orderCount = await prisma.order.count({
            where: {
                paymentMethodId: paymentMethod.id
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
                id: paymentMethod.id
            }
        });

        return true;
    }
}

module.exports = new PaymentMethodService();
