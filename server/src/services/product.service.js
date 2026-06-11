const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const { generateUniqueSlugPrisma } = require('~/utils/slugify');
const { validateCreateProductPayload } = require('~/validators/product.validator');

class ProductService {
    async getProducts(query) {
        const { keyword, categoryId, isActive, minPrice, maxPrice, page = 1, limit = 10 } = query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const skip = (pageNumber - 1) * limitNumber;

        const where = {};

        if (keyword) {
            where.title = {
                contains: keyword
            };
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        if (minPrice || maxPrice) {
            where.price = {};

            if (minPrice) {
                where.price.gte = Number(minPrice);
            }

            if (maxPrice) {
                where.price.lte = Number(maxPrice);
            }
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limitNumber
            }),

            prisma.product.count({ where })
        ]);

        return {
            products,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(total / limitNumber)
            }
        };
    }

    async getProductById(productId) {
        const product = await prisma.product.findUnique({
            where: {
                id: productId
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        });

        if (!product) {
            throw new AppError(404, 'Sản phẩm không tồn tại');
        }

        return product;
    }

    async createProduct(data) {
        const {
            title,
            categoryId,
            author,
            publisher,
            isbn,
            description,
            thumbnail,
            images,
            price,
            stock,
            isFeatured,
            isActive
        } = data;

        validateCreateProductPayload(data);

        const category = await prisma.category.findFirst({
            where: {
                id: categoryId,
                isActive: true
            }
        });

        if (!category) {
            throw new AppError(404, 'Danh mục không tồn tại hoặc đã bị tắt');
        }

        const slug = await generateUniqueSlugPrisma(title, 'product');

        return prisma.product.create({
            data: {
                title,
                slug,
                categoryId,
                author,
                publisher,
                isbn,
                description,
                thumbnail,
                images,
                price: Number(price),
                stock: stock !== undefined ? Number(stock) : 0,
                isFeatured: isFeatured ?? false,
                isActive: isActive ?? true
            }
        });
    }

    async updateProduct(productId, data) {
        const id = productId;

        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            throw new AppError(404, 'Sản phẩm không tồn tại');
        }

        const updateData = {};

        if (data.categoryId !== undefined) {
            const category = await prisma.category.findFirst({
                where: {
                    id: data.categoryId,
                    isActive: true
                }
            });

            if (!category) {
                throw new AppError(404, 'Danh mục không tồn tại hoặc đã bị tắt');
            }

            updateData.categoryId = data.categoryId;
        }

        if (data.title && data.title !== product.title) {
            updateData.title = data.title;
            updateData.slug = await generateUniqueSlugPrisma(data.title, 'product');
        }

        const allowedFields = [
            'author',
            'publisher',
            'isbn',
            'description',
            'thumbnail',
            'images',
            'price',
            'stock',
            'isFeatured',
            'isActive'
        ];

        allowedFields.forEach((field) => {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        });

        if (updateData.price !== undefined) {
            updateData.price = Number(updateData.price);
        }

        if (updateData.stock !== undefined) {
            updateData.stock = Number(updateData.stock);
        }

        return prisma.product.update({
            where: { id },
            data: updateData
        });
    }

    async deleteProduct(productId) {
        const id = productId;

        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            throw new AppError(404, 'Sản phẩm không tồn tại');
        }

        await prisma.product.delete({
            where: { id }
        });

        return true;
    }
}

module.exports = new ProductService();
