const prisma = require('~/libs/prisma');

const { AppError } = require('~/errors/AppError');
const { generateUniqueSlugPrisma } = require('~/utils/slugify');

const publicRequiredFields = [
    ['title', 'Tiêu đề'],
    ['bodyHtml', 'Nội dung']
];

class PostService {
    getInclude() {
        return {
            author: {
                select: {
                    publicId: true,
                    fullName: true
                }
            }
        };
    }

    toPublicUser(user) {
        if (!user) return null;

        return {
            id: user.publicId,
            fullName: user.fullName
        };
    }

    toPublicBlogCategory(category) {
        if (!category) return null;

        return {
            id: category.publicId,
            name: category.name,
            slug: category.slug,
            isActive: category.isActive
        };
    }

    toPublicPost(post) {
        if (!post) return null;

        return {
            id: post.publicId,
            slug: post.slug,
            title: post.title || '',
            dek: post.dek || '',
            excerpt: post.excerpt || '',
            bodyHtml: post.bodyHtml || '',
            coverImageUrl: post.coverImageUrl || '',
            readMinutes: post.readMinutes || 1,
            featured: post.featured,
            viewCount: post.viewCount || 0,
            publishedAt: post.publishedAt,
            status: post.status,
            author: this.toPublicUser(post.author),
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
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

        if (Object.prototype.hasOwnProperty.call(postData, 'title')) {
            postData.title = postData.title?.trim() || '';
        }

        ['dek', 'excerpt', 'bodyHtml', 'coverImageUrl'].forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(postData, field)) {
                postData[field] = postData[field]?.trim() || null;
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

    validatePublishable(postData, currentPost = {}) {
        const mergedPost = {
            ...currentPost,
            ...postData
        };
        const missingField = publicRequiredFields.find(([field]) => !String(mergedPost[field] || '').trim());

        if (missingField) {
            throw new AppError(400, `${missingField[1]} là bắt buộc khi public bài viết`);
        }
    }

    async getPosts() {
        const posts = await prisma.post.findMany({
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

        return posts.map((post) => this.toPublicPost(post));
    }

    async getAdminPosts() {
        const posts = await prisma.post.findMany({
            include: this.getInclude(),
            orderBy: {
                createdAt: 'desc'
            }
        });

        return posts.map((post) => this.toPublicPost(post));
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

        const viewedPost = await prisma.post.update({
            where: {
                id: post.id
            },
            data: {
                viewCount: {
                    increment: 1
                }
            },
            include: this.getInclude()
        });

        return this.toPublicPost(viewedPost);
    }

    async getAdminPostById(postId) {
        const post = await prisma.post.findUnique({
            where: {
                publicId: postId
            },
            include: this.getInclude()
        });

        if (!post) {
            throw new AppError(404, 'Bài viết không tồn tại');
        }

        return this.toPublicPost(post);
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

        return this.toPublicPost(post);
    }

    async createPost(authorId, data) {
        const postData = this.buildPostData(data);

        if (postData.status === 'PUBLISHED') {
            this.validatePublishable(postData);
        }

        const slug = await generateUniqueSlugPrisma(postData.title || `draft-${Date.now()}`, 'post');

        const post = await prisma.post.create({
            data: {
                ...postData,
                slug,
                authorId
            },
            include: this.getInclude()
        });

        return this.toPublicPost(post);
    }

    async createDraft(authorId) {
        const slug = await generateUniqueSlugPrisma(`draft-${Date.now()}`, 'post');

        const post = await prisma.post.create({
            data: {
                slug,
                title: '',
                status: 'DRAFT',
                authorId
            },
            include: this.getInclude()
        });

        return this.toPublicPost(post);
    }

    async updatePost(postId, data) {
        const post = await prisma.post.findUnique({
            where: {
                publicId: postId
            }
        });

        if (!post) {
            throw new AppError(404, 'Bài viết không tồn tại');
        }

        const postData = this.buildPostData(data, post);

        if (postData.status === 'PUBLISHED') {
            this.validatePublishable(postData, post);
        }

        if (Object.prototype.hasOwnProperty.call(postData, 'title') && postData.title && postData.title !== post.title) {
            postData.slug = await generateUniqueSlugPrisma(postData.title, 'post');
        }

        const updatedPost = await prisma.post.update({
            where: {
                id: post.id
            },
            data: postData,
            include: this.getInclude()
        });

        return this.toPublicPost(updatedPost);
    }

    async deletePost(postId) {
        const post = await prisma.post.findUnique({
            where: {
                publicId: postId
            }
        });

        if (!post) {
            throw new AppError(404, 'Bài viết không tồn tại');
        }

        await prisma.post.delete({
            where: {
                id: post.id
            }
        });

        return true;
    }
}

module.exports = new PostService();
