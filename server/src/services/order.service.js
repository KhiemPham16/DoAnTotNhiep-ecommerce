const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const {
    validateCreateOrderPayload,
    validateOrderStatusPayload,
    validatePaymentStatusPayload
} = require('~/validators/order.validator');

class OrderService {
    normalizeStatus(status) {
        return status.toUpperCase();
    }

    toPublicUser(user) {
        if (!user) return null;

        return {
            id: user.publicId,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role
        };
    }

    toPublicProduct(product) {
        if (!product) return null;

        return {
            id: product.publicId,
            title: product.title,
            slug: product.slug,
            thumbnail: product.thumbnail
        };
    }

    toPublicAddress(address) {
        if (!address) return null;

        return {
            id: address.publicId,
            receiverName: address.receiverName,
            receiverPhone: address.receiverPhone,
            provinceCity: address.provinceCity,
            ward: address.ward,
            specificAddress: address.specificAddress,
            isDefault: address.isDefault
        };
    }

    toPublicPaymentMethod(paymentMethod) {
        if (!paymentMethod) return null;

        return {
            id: paymentMethod.publicId,
            name: paymentMethod.name,
            code: paymentMethod.code,
            description: paymentMethod.description,
            isActive: paymentMethod.isActive
        };
    }

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
            isActive: coupon.isActive
        };
    }

    toPublicOrderItem(item) {
        if (!item) return null;

        return {
            id: item.publicId,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            product: this.toPublicProduct(item.product)
        };
    }

    toPublicOrder(order) {
        if (!order) return null;

        return {
            id: order.publicId,
            user: this.toPublicUser(order.user),
            approvedBy: this.toPublicUser(order.approvedBy),
            assignedTo: this.toPublicUser(order.assignedTo),
            address: this.toPublicAddress(order.address),
            paymentMethod: this.toPublicPaymentMethod(order.paymentMethod),
            coupon: this.toPublicCoupon(order.coupon),
            status: order.status,
            paymentStatus: order.paymentStatus,
            discountAmount: order.discountAmount,
            totalAmount: order.totalAmount,
            finalAmount: order.finalAmount,
            note: order.note,
            items: order.items?.map((item) => this.toPublicOrderItem(item)) || [],
            approvedAt: order.approvedAt,
            assignedAt: order.assignedAt,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };
    }

    orderInclude() {
        return {
            user: true,
            approvedBy: true,
            assignedTo: true,
            address: true,
            paymentMethod: true,
            coupon: true,
            items: {
                include: {
                    product: true
                }
            }
        };
    }

    async createOrder(userId, data) {
        const { addressId, paymentMethodId, items, couponCode, note } = data;

        validateCreateOrderPayload(data);

        const address = await prisma.address.findFirst({
            where: {
                publicId: addressId,
                userId
            }
        });

        if (!address) {
            throw new AppError(404, 'Địa chỉ giao hàng không tồn tại');
        }

        const paymentMethod = await prisma.paymentMethod.findFirst({
            where: {
                publicId: paymentMethodId,
                isActive: true
            }
        });

        if (!paymentMethod) {
            throw new AppError(404, 'Phương thức thanh toán không tồn tại hoặc đã bị tắt');
        }

        const orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            const product = await prisma.product.findFirst({
                where: {
                    publicId: item.productId,
                    isActive: true,
                    deletedAt: null
                }
            });

            if (!product) {
                throw new AppError(404, 'Sản phẩm không tồn tại hoặc đã ngừng bán');
            }

            if (product.stock < item.quantity) {
                throw new AppError(400, `Sản phẩm "${product.title}" không đủ tồn kho`);
            }

            const price = Number(product.price);
            const subtotal = price * item.quantity;

            orderItems.push({
                productId: product.id,
                title: product.title,
                price,
                quantity: item.quantity,
                subtotal
            });

            totalAmount += subtotal;
        }

        let coupon = null;
        let discountAmount = 0;

        if (couponCode) {
            coupon = await prisma.coupon.findFirst({
                where: {
                    code: couponCode.toUpperCase().trim(),
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

            const minOrderAmount = Number(coupon.minOrderAmount || 0);

            if (totalAmount < minOrderAmount) {
                throw new AppError(400, `Đơn hàng tối thiểu ${minOrderAmount}`);
            }

            if (coupon.type === 'PERCENT') {
                discountAmount = (totalAmount * Number(coupon.value)) / 100;

                if (coupon.maxDiscountAmount) {
                    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
                }
            }

            if (coupon.type === 'FIXED') {
                discountAmount = Number(coupon.value);
            }

            discountAmount = Math.min(discountAmount, totalAmount);
        }

        const finalAmount = totalAmount - discountAmount;

        const order = await prisma.$transaction(async (tx) => {
            const createdOrder = await tx.order.create({
                data: {
                    userId,
                    addressId: address.id,
                    paymentMethodId: paymentMethod.id,
                    couponId: coupon ? coupon.id : null,
                    status: 'PENDING',
                    paymentStatus: 'UNPAID',
                    discountAmount,
                    totalAmount,
                    finalAmount,
                    note,
                    items: {
                        create: orderItems.map((item) => ({
                            productId: item.productId,
                            title: item.title,
                            price: item.price,
                            quantity: item.quantity,
                            subtotal: item.subtotal
                        }))
                    }
                },
                include: this.orderInclude()
            });

            for (const item of orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity },
                        soldCount: { increment: item.quantity }
                    }
                });
            }

            if (coupon) {
                await tx.coupon.update({
                    where: { id: coupon.id },
                    data: {
                        usedCount: { increment: 1 }
                    }
                });
            }

            return createdOrder;
        });

        return this.toPublicOrder(order);
    }

    async getMyOrders(userId) {
        const orders = await prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: this.orderInclude()
        });

        return orders.map((order) => this.toPublicOrder(order));
    }

    async getOrderById(userId, orderId) {
        const order = await prisma.order.findFirst({
            where: {
                publicId: orderId,
                userId
            },
            include: this.orderInclude()
        });

        if (!order) {
            throw new AppError(404, 'Đơn hàng không tồn tại');
        }

        return this.toPublicOrder(order);
    }

    async getOrders() {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: this.orderInclude()
        });

        return orders.map((order) => this.toPublicOrder(order));
    }

    async updateStatus(orderId, status, actorId) {
        const nextStatus = this.normalizeStatus(status);

        validateOrderStatusPayload(nextStatus);

        const order = await prisma.order.findUnique({
            where: { publicId: orderId },
            include: {
                items: true
            }
        });

        if (!order) {
            throw new AppError(404, 'Đơn hàng không tồn tại');
        }

        const oldStatus = order.status;

        if (oldStatus === nextStatus) {
            const currentOrder = await prisma.order.findUnique({
                where: { id: order.id },
                include: this.orderInclude()
            });

            return this.toPublicOrder(currentOrder);
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            if (nextStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { increment: item.quantity },
                            soldCount: { decrement: item.quantity }
                        }
                    });
                }
            }

            if (oldStatus === 'CANCELLED' && nextStatus !== 'CANCELLED') {
                for (const item of order.items) {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId }
                    });

                    if (!product) {
                        throw new AppError(404, `Sản phẩm "${item.title}" không tồn tại`);
                    }

                    if (product.stock < item.quantity) {
                        throw new AppError(400, `Sản phẩm "${item.title}" không đủ tồn kho`);
                    }

                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { decrement: item.quantity },
                            soldCount: { increment: item.quantity }
                        }
                    });
                }
            }

            const updateData = {
                status: nextStatus
            };

            if (nextStatus === 'CONFIRMED' && !order.approvedById) {
                updateData.approvedById = actorId;
                updateData.approvedAt = new Date();
                updateData.assignedToId = actorId;
                updateData.assignedAt = new Date();
            }

            return tx.order.update({
                where: { id: order.id },
                data: updateData,
                include: this.orderInclude()
            });
        });

        return this.toPublicOrder(updatedOrder);
    }

    async updatePaymentStatus(orderId, paymentStatus) {
        const nextStatus = paymentStatus.toUpperCase();

        validatePaymentStatusPayload(nextStatus);

        const order = await prisma.order.findUnique({
            where: { publicId: orderId }
        });

        if (!order) {
            throw new AppError(404, 'Đơn hàng không tồn tại');
        }

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: nextStatus
            },
            include: this.orderInclude()
        });

        return this.toPublicOrder(updatedOrder);
    }

    async assignOrder(orderId, employeeId) {
        const order = await prisma.order.findUnique({
            where: { publicId: orderId }
        });

        if (!order) {
            throw new AppError(404, 'Không tìm thấy đơn hàng');
        }

        const employee = await prisma.user.findUnique({
            where: { publicId: employeeId }
        });

        if (!employee) {
            throw new AppError(404, 'Không tìm thấy nhân viên');
        }

        if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(employee.role)) {
            throw new AppError(400, 'Người được phân công không phải nhân viên');
        }

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                assignedToId: employee.id,
                assignedAt: new Date()
            },
            include: this.orderInclude()
        });

        return this.toPublicOrder(updatedOrder);
    }

    async approveOrder(orderId, approverId) {
        const order = await prisma.order.findUnique({
            where: { publicId: orderId }
        });

        if (!order) {
            throw new AppError(404, 'Không tìm thấy đơn hàng');
        }

        if (order.approvedById) {
            throw new AppError(400, 'Đơn hàng đã được duyệt');
        }

        const approver = await prisma.user.findUnique({
            where: { id: approverId }
        });

        if (!approver) {
            throw new AppError(404, 'Không tìm thấy người duyệt');
        }

        if (!['ADMIN', 'MANAGER'].includes(approver.role)) {
            throw new AppError(403, 'Bạn không có quyền duyệt đơn hàng');
        }

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                approvedById: approver.id,
                approvedAt: new Date()
            },
            include: this.orderInclude()
        });

        return this.toPublicOrder(updatedOrder);
    }

    async unassignOrder(orderId) {
        const order = await prisma.order.findUnique({
            where: { publicId: orderId }
        });

        if (!order) {
            throw new AppError(404, 'Không tìm thấy đơn hàng');
        }

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                assignedToId: null,
                assignedAt: null
            },
            include: this.orderInclude()
        });

        return this.toPublicOrder(updatedOrder);
    }

    async cancelMyOrder(userId, orderId) {
        const order = await prisma.order.findFirst({
            where: {
                publicId: orderId,
                userId
            },
            include: {
                items: true
            }
        });

        if (!order) {
            throw new AppError(404, 'Đơn hàng không tồn tại');
        }

        if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
            throw new AppError(400, 'Không thể hủy đơn hàng ở trạng thái hiện tại');
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        soldCount: { decrement: item.quantity }
                    }
                });
            }

            return tx.order.update({
                where: { id: order.id },
                data: {
                    status: 'CANCELLED',
                    paymentStatus: 'REFUNDED'
                },
                include: this.orderInclude()
            });
        });

        return this.toPublicOrder(updatedOrder);
    }
}

module.exports = new OrderService();
