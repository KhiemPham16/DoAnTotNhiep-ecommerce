const reviewService = require('~/services/review.service');

class ReviewController {
    async canReview(req, res, next) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;

            const result = await reviewService.canReview(userId, productId);

            res.json({
                success: true,
                message: 'Kiểm tra quyền đánh giá thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async createReview(req, res, next) {
        try {
            const userId = req.user.id;

            const review = await reviewService.createReview(userId, req.body);

            res.status(201).json({
                success: true,
                message: 'Đánh giá sản phẩm thành công',
                data: review
            });
        } catch (error) {
            next(error);
        }
    }

    async getProductReviews(req, res, next) {
        try {
            const result = await reviewService.getProductReviews(req.params.productId, req.query);

            res.json({
                success: true,
                message: 'Lấy danh sách đánh giá thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async updateReview(req, res, next) {
        try {
            const userId = req.user.id;

            const review = await reviewService.updateReview(userId, req.params.id, req.body);

            res.json({
                success: true,
                message: 'Cập nhật đánh giá thành công',
                data: review
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteReview(req, res, next) {
        try {
            const userId = req.user.id;

            await reviewService.deleteReview(userId, req.params.id);

            res.json({
                success: true,
                message: 'Xóa đánh giá thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReviewController();
