const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const { generateUniqueSlugPrisma } = require('~/utils/slugify');

class PostService {
    getInclude() {
        return {
            author: {
                select: {
                    id: true,
                    fullName: true
                }
            },
            categories: {
                include: {
                    category: true
                }
            }
        };
    }

    buildPostData(data, currentPost = null) {
        const allowedFields = [
            'title',
            'dek',
            'excerpt',
            'bodyHtml',
            'coverImageUrl',
            'readMinutes',
            'featured',
            'status'
        ];

        const postData = {};

        allowedFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(data, field)) {
                postData[field] = data[field];
            }
        });

        if (Object.prototype.hasOwnProperty.call(postData, 'readMinutes')) {
            postData.readMinutes = Number(postData.readMinutes || 1);
        }

        if (Object.prototype.hasOwnProperty.call(postData, 'featured')) {
            postData.featured =
                postData.featured === true ||
                postData.featured === 'true' ||
                postData.featured === 1 ||
                postData.featured === '1';
        }

        if (Object.prototype.hasOwnProperty.call(postData, 'status')) {
            postData.status = String(postData.status).toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

            if (postData.status === 'PUBLISHED' && !currentPost?.publishedAt) {
                postData.publishedAt = new Date();
            }

            if (postData.status === 'DRAFT') {
                postData.publishedAt = null;
            }
        }

        return postData;
    }

    async getPosts() {
        return prisma.post.findMany({
            where: {
                status: 'PUBLISHED'
            },
            include: this.getInclude(),
            orderBy: [
                {
                    featured: 'desc'
                },
                {
                    publishedAt: 'desc'
                }
            ]
        });
    }

    async getAdminPosts() {
        return prisma.post.findMany({
            include: this.getInclude(),
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async getPostBySlug(slug) {
        const post = await prisma.post.findUnique({
            where: {
                slug
            },
            include: this.getInclude()
        });

        if (!post || post.status !== 'PUBLISHED') {
            throw new AppError(404, 'Bài viết không tồn tại');
        }

        return post;
    }

    async getAdminPostBySlug(slug) {
        const post = await prisma.post.findUnique({
            where: {
                slug
            },
            include: this.getInclude()
        });

        if (!post) {
            throw new AppError(404, 'Bài viết không tồn tại');
        }

        return post;
    }

    async createPost(authorId, data) {
        const { categoryIds = [] } = data;
        const postData = this.buildPostData(data);

        if (!postData.title) {
            throw new AppError(400, 'Tiêu đề là bắt buộc');
        }

        const slug = await generateUniqueSlugPrisma(postData.title, 'post');

        return prisma.post.create({
            data: {
                ...postData,
                slug,
                authorId,
                categories: {
                    create: categoryIds.map((categoryId) => ({
                        categoryId
                    }))
                }
            },
            include: this.getInclude()
        });
    }

    async updatePost(postId, data) {
        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });

        if (!post) {
            throw new AppError(404, 'Bài viết không tồn tại');
        }

        const { categoryIds, ...payload } = data;
        const postData = this.buildPostData(payload, post);

        if (Object.prototype.hasOwnProperty.call(postData, 'title')) {
            if (!postData.title) {
                throw new AppError(400, 'Tiêu đề là bắt buộc');
            }

            if (postData.title !== post.title) {
                postData.slug = await generateUniqueSlugPrisma(postData.title, 'post');
            }
        }

        return prisma.post.update({
            where: {
                id: postId
            },
            data: {
                ...postData,

                ...(Array.isArray(categoryIds)
                    ? {
                          categories: {
                              deleteMany: {},
                              create: categoryIds.map((categoryId) => ({
                                  categoryId
                              }))
                          }
                      }
                    : {})
            },
            include: this.getInclude()
        });
    }

    async deletePost(postId) {
        const post = await prisma.post.findUnique({
            where: {
                id: postId
            }
        });

        if (!post) {
            throw new AppError(404, 'Bài viết không tồn tại');
        }

        await prisma.post.delete({
            where: {
                id: postId
            }
        });

        return true;
    }
}

module.exports = new PostService();
