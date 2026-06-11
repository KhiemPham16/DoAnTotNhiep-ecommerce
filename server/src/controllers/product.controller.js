const productService = require('~/services/product.service');

class ProductController {
    async index(req, res, next) {
        try {
            const result = await productService.getProducts(req.query);

            return res.status(200).json({
                success: true,
                data: result.products,
                meta: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async show(req, res, next) {
        try {
            const product = await productService.getProductById(req.params.id);

            return res.status(200).json({
                success: true,
                data: product
            });
        } catch (error) {
            next(error);
        }
    }

    async store(req, res, next) {
        try {
            const product = await productService.createProduct(req.body);

            return res.status(201).json({
                success: true,
                message: 'Tạo sản phẩm thành công',
                data: product
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const product = await productService.updateProduct(req.params.id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật sản phẩm thành công',
                data: product
            });
        } catch (error) {
            next(error);
        }
    }

    async destroy(req, res, next) {
        try {
            await productService.deleteProduct(req.params.id);

            return res.status(200).json({
                success: true,
                message: 'Xóa sản phẩm thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();
