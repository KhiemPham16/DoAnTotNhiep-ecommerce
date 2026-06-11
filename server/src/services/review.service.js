const prisma = require('~/libs/prisma');
const { validateCreateReviewPayload, validateUpdateReviewPayload } = require('~/validators/review.validator');

const createError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

class ReviewService {
    async canReview(userId, productId) {
        const order = await prisma.order.findFirst({
            where: {
                userId,
                status: 'COMPLETED',
                items: {
                    some: {
                        productId
                    }
                }
            },
            select: {
                id: true
            }
        });

        return {
            canReview: !!order,
            orderId: order?.id || null
        };
    }

    async recalculateProductRating(productId) {
        const result = await prisma.review.aggregate({
            where: { productId },
            _avg: { rating: true },
            _count: { rating: true }
        });

        await prisma.product.update({
            where: { id: productId },
            data: {
                averageRating: result._avg.rating || 0,
                reviewCount: result._count.rating || 0
            }
        });
    }

    async createReview(userId, data) {
        const { productId, orderId, rating, comment } = data;

        validateCreateReviewPayload(data);

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
                status: 'COMPLETED',
                items: {
                    some: {
                        productId
                    }
                }
            }
        });

        if (!order) {
            throw createError(403, 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đơn hàng đã hoàn tất');
        }

        const existedReview = await prisma.review.findUnique({
            where: {
                userId_productId_orderId: {
                    userId,
                    productId,
                    orderId
                }
            }
        });

        if (existedReview) {
            throw createError(409, 'Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi');
        }

        const review = await prisma.review.create({
            data: {
                userId,
                productId,
                orderId,
                rating,
                comment
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true
                    }
                }
            }
        });

        await this.recalculateProductRating(productId);

        return review;
    }

    async getProductReviews(productId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { productId },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            avatarUrl: true
                        }
                    }
                }
            }),

            prisma.review.count({
                where: { productId }
            })
        ]);

        return {
            reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async updateReview(userId, reviewId, data) {
        const { rating, comment } = data;

        validateUpdateReviewPayload(data);

        const review = await prisma.review.findFirst({
            where: {
                id: reviewId,
                userId
            }
        });

        if (!review) {
            throw createError(404, 'Không tìm thấy đánh giá');
        }

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating,
                comment
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true
                    }
                }
            }
        });

        await this.recalculateProductRating(review.productId);

        return updatedReview;
    }

    async deleteReview(userId, reviewId) {
        const review = await prisma.review.findFirst({
            where: {
                id: reviewId,
                userId
            }
        });

        if (!review) {
            throw createError(404, 'Không tìm thấy đánh giá');
        }

        await prisma.review.delete({
            where: { id: reviewId }
        });

        await this.recalculateProductRating(review.productId);
    }
}

module.exports = new ReviewService();
