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

    async createOrder(userId, data) {
        const { addressId, paymentMethodId, items, couponCode, note } = data;

        validateCreateOrderPayload(data);

        const address = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId
            }
        });

        if (!address) {
            throw new AppError(404, 'Địa chỉ giao hàng không tồn tại');
        }

        const paymentMethod = await prisma.paymentMethod.findFirst({
            where: {
                id: paymentMethodId,
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
                    id: item.productId,
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
                    addressId,
                    paymentMethodId,
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
                include: {
                    items: true,
                    address: true,
                    paymentMethod: true,
                    coupon: true
                }
            });

            for (const item of orderItems) {
                await tx.product.update({
                    where: {
                        id: item.productId
                    },
                    data: {
                        stock: {
                            decrement: item.quantity
                        },
                        soldCount: {
                            increment: item.quantity
                        }
                    }
                });
            }

            if (coupon) {
                await tx.coupon.update({
                    where: {
                        id: coupon.id
                    },
                    data: {
                        usedCount: {
                            increment: 1
                        }
                    }
                });
            }

            return createdOrder;
        });

        return order;
    }

    async getMyOrders(userId) {
        return prisma.order.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                thumbnail: true
                            }
                        }
                    }
                },
                paymentMethod: true,
                coupon: true
            }
        });
    }

    async getOrderById(userId, orderId) {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                thumbnail: true
                            }
                        }
                    }
                },
                address: true,
                paymentMethod: true,
                coupon: true
            }
        });

        if (!order) {
            throw new AppError(404, 'Đơn hàng không tồn tại');
        }

        return order;
    }

    async getOrders() {
        return prisma.order.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true
                    }
                },
                address: true,
                paymentMethod: true,
                coupon: true,
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                thumbnail: true
                            }
                        }
                    }
                }
            }
        });
    }

    async updateStatus(orderId, status) {
        const nextStatus = this.normalizeStatus(status);

        validateOrderStatusPayload(nextStatus);

        const allowedStatus = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

        const order = await prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                items: true
            }
        });

        if (!order) {
            throw new AppError(404, 'Đơn hàng không tồn tại');
        }

        const oldStatus = order.status;

        if (oldStatus === nextStatus) {
            return order;
        }

        return prisma.$transaction(async (tx) => {
            if (nextStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
                for (const item of order.items) {
                    await tx.product.update({
                        where: {
                            id: item.productId
                        },
                        data: {
                            stock: {
                                increment: item.quantity
                            },
                            soldCount: {
                                decrement: item.quantity
                            }
                        }
                    });
                }
            }

            if (oldStatus === 'CANCELLED' && nextStatus !== 'CANCELLED') {
                for (const item of order.items) {
                    const product = await tx.product.findUnique({
                        where: {
                            id: item.productId
                        }
                    });

                    if (!product) {
                        throw new AppError(404, `Sản phẩm "${item.title}" không tồn tại`);
                    }

                    if (product.stock < item.quantity) {
                        throw new AppError(400, `Sản phẩm "${item.title}" không đủ tồn kho`);
                    }

                    await tx.product.update({
                        where: {
                            id: item.productId
                        },
                        data: {
                            stock: {
                                decrement: item.quantity
                            },
                            soldCount: {
                                increment: item.quantity
                            }
                        }
                    });
                }
            }

            return tx.order.update({
                where: {
                    id: orderId
                },
                data: {
                    status: nextStatus
                },
                include: {
                    items: true,
                    paymentMethod: true,
                    coupon: true
                }
            });
        });
    }

    async updatePaymentStatus(orderId, paymentStatus) {
        const nextStatus = paymentStatus.toUpperCase();

        validatePaymentStatusPayload(nextStatus);

        const allowedStatus = ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'];

        const order = await prisma.order.findUnique({
            where: {
                id: orderId
            }
        });

        if (!order) {
            throw new AppError(404, 'Đơn hàng không tồn tại');
        }

        return prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                paymentStatus: nextStatus
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true
                    }
                },
                address: true,
                paymentMethod: true,
                coupon: true,
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                thumbnail: true
                            }
                        }
                    }
                }
            }
        });
    }

    async cancelMyOrder(userId, orderId) {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
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

        if (order.status === 'CANCELLED') {
            return order;
        }

        return prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                await tx.product.update({
                    where: {
                        id: item.productId
                    },
                    data: {
                        stock: {
                            increment: item.quantity
                        },
                        soldCount: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            return tx.order.update({
                where: {
                    id: orderId
                },
                data: {
                    status: 'CANCELLED',
                    paymentStatus: 'REFUNDED'
                },
                include: {
                    items: true,
                    paymentMethod: true,
                    coupon: true
                }
            });
        });
    }
}

module.exports = new OrderService();
