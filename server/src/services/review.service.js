const prisma = require('~/libs/prisma');
const { AppError } = require('~/errors/AppError');
const { validateCreateReviewPayload, validateUpdateReviewPayload } = require('~/validators/review.validator');

class ReviewService {
    toPublicUser(user) {
        if (!user) return null;

        return {
            id: user.publicId,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl
        };
    }

    toPublicReview(review) {
        if (!review) return null;

        return {
            id: review.publicId,
            rating: review.rating,
            comment: review.comment,
            user: this.toPublicUser(review.user),
            createdAt: review.createdAt,
            updatedAt: review.updatedAt
        };
    }

    async canReview(userId, productId) {
        const product = await prisma.product.findUnique({
            where: {
                publicId: productId
            }
        });

        if (!product) {
            throw new AppError(404, 'Sản phẩm không tồn tại');
        }

        const order = await prisma.order.findFirst({
            where: {
                userId,
                status: 'COMPLETED',
                items: {
                    some: {
                        productId: product.id
                    }
                }
            },
            select: {
                publicId: true
            }
        });

        return {
            canReview: !!order,
            orderId: order?.publicId || null
        };
    }

    async recalculateProductRating(productId) {
        const result = await prisma.review.aggregate({
            where: {
                productId
            },
            _avg: {
                rating: true
            },
            _count: {
                rating: true
            }
        });

        await prisma.product.update({
            where: {
                id: productId
            },
            data: {
                averageRating: result._avg.rating || 0,
                reviewCount: result._count.rating || 0
            }
        });
    }

    async createReview(userId, data) {
        const { productId, orderId, rating, comment } = data;

        validateCreateReviewPayload(data);

        const product = await prisma.product.findUnique({
            where: {
                publicId: productId
            }
        });

        if (!product) {
            throw new AppError(404, 'Sản phẩm không tồn tại');
        }

        const order = await prisma.order.findFirst({
            where: {
                publicId: orderId,
                userId,
                status: 'COMPLETED',
                items: {
                    some: {
                        productId: product.id
                    }
                }
            }
        });

        if (!order) {
            throw new AppError(403, 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đơn hàng đã hoàn tất');
        }

        const existedReview = await prisma.review.findUnique({
            where: {
                userId_productId_orderId: {
                    userId,
                    productId: product.id,
                    orderId: order.id
                }
            }
        });

        if (existedReview) {
            throw new AppError(409, 'Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi');
        }

        const review = await prisma.review.create({
            data: {
                userId,
                productId: product.id,
                orderId: order.id,
                rating,
                comment
            },
            include: {
                user: true
            }
        });

        await this.recalculateProductRating(product.id);

        return this.toPublicReview(review);
    }

    async getProductReviews(productId, query) {
        const product = await prisma.product.findUnique({
            where: {
                publicId: productId
            }
        });

        if (!product) {
            throw new AppError(404, 'Sản phẩm không tồn tại');
        }

        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: {
                    productId: product.id
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    user: true
                }
            }),

            prisma.review.count({
                where: {
                    productId: product.id
                }
            })
        ]);

        return {
            reviews: reviews.map((review) => this.toPublicReview(review)),
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
                publicId: reviewId,
                userId
            }
        });

        if (!review) {
            throw new AppError(404, 'Không tìm thấy đánh giá');
        }

        const updatedReview = await prisma.review.update({
            where: {
                id: review.id
            },
            data: {
                rating,
                comment
            },
            include: {
                user: true
            }
        });

        await this.recalculateProductRating(review.productId);

        return this.toPublicReview(updatedReview);
    }

    async deleteReview(userId, reviewId) {
        const review = await prisma.review.findFirst({
            where: {
                publicId: reviewId,
                userId
            }
        });

        if (!review) {
            throw new AppError(404, 'Không tìm thấy đánh giá');
        }

        await prisma.review.delete({
            where: {
                id: review.id
            }
        });

        await this.recalculateProductRating(review.productId);

        return true;
    }
}

module.exports = new ReviewService();
