const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const { generateUniqueSlugPrisma } = require('~/utils/slugify');
const { validateCreateProductPayload } = require('~/validators/product.validator');

class ProductService {
    toPublicCategory(category) {
        if (!category) return null;

        return {
            id: category.publicId,
            name: category.name,
            slug: category.slug
        };
    }

    toPublicProduct(product) {
        if (!product) return null;

        return {
            id: product.publicId,
            title: product.title,
            slug: product.slug,
            author: product.author,
            publisher: product.publisher,
            isbn: product.isbn,
            description: product.description,
            tagline: product.tagline,
            thumbnail: product.thumbnail,
            images: product.images,
            price: product.price,
            stock: product.stock,
            soldCount: product.soldCount,
            isFeatured: product.isFeatured,
            isActive: product.isActive,
            averageRating: product.averageRating,
            reviewCount: product.reviewCount,
            category: this.toPublicCategory(product.category),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };
    }

    async getProducts(query) {
        const { keyword, categoryId, isActive, minPrice, maxPrice, page = 1, limit = 10 } = query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const skip = (pageNumber - 1) * limitNumber;

        const where = {
            deletedAt: null
        };

        if (keyword) {
            where.title = {
                contains: keyword
            };
        }

        if (categoryId) {
            const category = await prisma.category.findUnique({
                where: {
                    publicId: categoryId
                }
            });

            if (!category) {
                throw new AppError(404, 'Danh mục không tồn tại');
            }

            where.categoryId = category.id;
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
                    category: true
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
            products: products.map((product) => this.toPublicProduct(product)),
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(total / limitNumber)
            }
        };
    }

    async getProductBySlug(slug) {
        const product = await prisma.product.findFirst({
            where: {
                slug
            },
            include: { category: true }
        });

        if (!product) {
            throw new AppError(404, 'Sản phẩm không tồn tại');
        }

        return this.toPublicProduct(product);
    }

    async createProduct(data) {
        const {
            title,
            categoryId,
            author,
            publisher,
            isbn,
            tagline,
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
                publicId: categoryId,
                isActive: true
            }
        });

        if (!category) {
            throw new AppError(404, 'Danh mục không tồn tại hoặc đã bị tắt');
        }

        const normalizedTitle = title.trim();
        const slug = await generateUniqueSlugPrisma(normalizedTitle, 'product');

        const product = await prisma.product.create({
            data: {
                title: normalizedTitle,
                slug,
                categoryId: category.id,
                author,
                publisher,
                isbn,
                tagline,
                description,
                thumbnail,
                images,
                price: Number(price),
                stock: stock !== undefined ? Number(stock) : 0,
                isFeatured: isFeatured ?? false,
                isActive: isActive ?? true
            },
            include: {
                category: true
            }
        });

        return this.toPublicProduct(product);
    }

    async updateProduct(productId, data) {
        const product = await prisma.product.findUnique({
            where: {
                publicId: productId
            }
        });

        if (!product) {
            throw new AppError(404, 'Sản phẩm không tồn tại');
        }

        const updateData = {};

        if (data.categoryId !== undefined) {
            const category = await prisma.category.findFirst({
                where: {
                    publicId: data.categoryId,
                    isActive: true
                }
            });

            if (!category) {
                throw new AppError(404, 'Danh mục không tồn tại hoặc đã bị tắt');
            }

            updateData.categoryId = category.id;
        }

        if (data.title) {
            const normalizedTitle = data.title.trim();

            if (normalizedTitle !== product.title) {
                updateData.title = normalizedTitle;
                updateData.slug = await generateUniqueSlugPrisma(normalizedTitle, 'product');
            }
        }

        const allowedFields = [
            'author',
            'publisher',
            'isbn',
            'tagline',
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

        const updatedProduct = await prisma.product.update({
            where: {
                id: product.id
            },
            data: updateData,
            include: {
                category: true
            }
        });

        return this.toPublicProduct(updatedProduct);
    }

    async deleteProduct(productId) {
        const product = await prisma.product.findUnique({
            where: {
                publicId: productId
            }
        });

        if (!product) {
            throw new AppError(404, 'Sản phẩm không tồn tại');
        }

        await prisma.product.delete({
            where: {
                id: product.id
            }
        });

        return true;
    }
}

module.exports = new ProductService();
