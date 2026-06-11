const categoryService = require('~/services/category.service');

class CategoryController {
    async index(req, res, next) {
        try {
            const categories = await categoryService.getCategories();

            return res.status(200).json({
                success: true,
                data: categories
            });
        } catch (error) {
            next(error);
        }
    }

    async show(req, res, next) {
        try {
            const category = await categoryService.getCategoryById(req.params.id);

            return res.status(200).json({
                success: true,
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    async store(req, res, next) {
        try {
            const category = await categoryService.createCategory(req.body.name);

            return res.status(201).json({
                success: true,
                message: 'Tạo danh mục thành công',
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const category = await categoryService.updateCategory(req.params.id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật danh mục thành công',
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    async destroy(req, res, next) {
        try {
            await categoryService.deleteCategory(req.params.id);

            return res.status(200).json({
                success: true,
                message: 'Xóa danh mục thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CategoryController();
