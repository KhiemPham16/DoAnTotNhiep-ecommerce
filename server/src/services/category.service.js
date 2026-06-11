const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const { generateUniqueCategorySlug } = require('~/utils/slugify');
const { validateCreateCategoryPayload } = require('~/validators/category.validator');

class CategoryService {
    async getCategories() {
        return prisma.category.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async getCategoryById(categoryId) {
        const category = await prisma.category.findUnique({
            where: {
                id: categoryId
            }
        });

        if (!category) {
            throw new AppError(404, 'Danh mục không tồn tại');
        }

        return category;
    }

    async createCategory(name) {
        validateCreateCategoryPayload(name);

        const existed = await prisma.category.findUnique({
            where: {
                name
            }
        });

        if (existed) {
            throw new AppError(409, 'Danh mục đã tồn tại');
        }

        const slug = await generateUniqueCategorySlug(name);

        return prisma.category.create({
            data: {
                name,
                slug
            }
        });
    }

    async updateCategory(categoryId, data) {
        const category = await prisma.category.findUnique({
            where: {
                id: categoryId
            }
        });

        if (!category) {
            throw new AppError(404, 'Danh mục không tồn tại');
        }

        const updateData = {};

        if (data.name && data.name !== category.name) {
            const existed = await prisma.category.findFirst({
                where: {
                    name: data.name,
                    NOT: {
                        id: categoryId
                    }
                }
            });

            if (existed) {
                throw new AppError(409, 'Danh mục đã tồn tại');
            }

            updateData.name = data.name;
            updateData.slug = await generateUniqueCategorySlug(data.name);
        }

        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive;
        }

        return prisma.category.update({
            where: {
                id: categoryId
            },
            data: updateData
        });
    }

    async deleteCategory(categoryId) {
        const category = await prisma.category.findUnique({
            where: {
                id: categoryId
            }
        });

        if (!category) {
            throw new AppError(404, 'Danh mục không tồn tại');
        }

        const productCount = await prisma.product.count({
            where: {
                categoryId
            }
        });

        if (productCount > 0) {
            throw new AppError(
                400,
                'Danh mục đang chứa sản phẩm, không thể xóa. Hãy tắt trạng thái hoạt động thay thế.'
            );
        }

        await prisma.category.delete({
            where: {
                id: categoryId
            }
        });

        return true;
    }
}

module.exports = new CategoryService();
