const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const { generateUniqueCategorySlug } = require('~/utils/slugify');
const { validateCreateCategoryPayload } = require('~/validators/category.validator');

class CategoryService {
    toPublicCategory(category) {
        if (!category) return null;

        return {
            id: category.publicId,
            name: category.name,
            slug: category.slug,
            isActive: category.isActive,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        };
    }

    async getCategories() {
        const categories = await prisma.category.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        return categories.map((category) => this.toPublicCategory(category));
    }

    async getCategoryById(categoryId) {
        const category = await prisma.category.findUnique({
            where: {
                publicId: categoryId
            }
        });

        if (!category) {
            throw new AppError(404, 'Danh mục không tồn tại');
        }

        return this.toPublicCategory(category);
    }

    async createCategory(name) {
        validateCreateCategoryPayload(name);

        const normalizedName = name.trim();

        const existed = await prisma.category.findUnique({
            where: {
                name: normalizedName
            }
        });

        if (existed) {
            throw new AppError(409, 'Danh mục đã tồn tại');
        }

        const slug = await generateUniqueCategorySlug(normalizedName);

        const category = await prisma.category.create({
            data: {
                name: normalizedName,
                slug
            }
        });

        return this.toPublicCategory(category);
    }

    async updateCategory(categoryId, data) {
        const category = await prisma.category.findUnique({
            where: {
                publicId: categoryId
            }
        });

        if (!category) {
            throw new AppError(404, 'Danh mục không tồn tại');
        }

        const updateData = {};

        if (data.name) {
            const normalizedName = data.name.trim();

            if (normalizedName !== category.name) {
                const existed = await prisma.category.findFirst({
                    where: {
                        name: normalizedName,
                        NOT: {
                            id: category.id
                        }
                    }
                });

                if (existed) {
                    throw new AppError(409, 'Danh mục đã tồn tại');
                }

                updateData.name = normalizedName;
                updateData.slug = await generateUniqueCategorySlug(normalizedName);
            }
        }

        if (data.isActive !== undefined) {
            updateData.isActive = Boolean(data.isActive);
        }

        const updatedCategory = await prisma.category.update({
            where: {
                id: category.id
            },
            data: updateData
        });

        return this.toPublicCategory(updatedCategory);
    }

    async deleteCategory(categoryId) {
        const category = await prisma.category.findUnique({
            where: {
                publicId: categoryId
            }
        });

        if (!category) {
            throw new AppError(404, 'Danh mục không tồn tại');
        }

        const productCount = await prisma.product.count({
            where: {
                categoryId: category.id
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
                id: category.id
            }
        });

        return true;
    }
}

module.exports = new CategoryService();
