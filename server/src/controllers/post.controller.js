const postService = require('~/services/post.service');

class PostController {
    async index(req, res, next) {
        try {
            const posts = await postService.getPosts();

            return res.status(200).json({
                success: true,
                data: posts
            });
        } catch (error) {
            next(error);
        }
    }

    async getAdminPosts(req, res, next) {
        try {
            const posts = await postService.getAdminPosts();

            res.json({
                success: true,
                data: posts
            });
        } catch (error) {
            next(error);
        }
    }

    async show(req, res, next) {
        try {
            const post = await postService.getPostBySlug(req.params.slug);

            return res.status(200).json({
                success: true,
                data: post
            });
        } catch (error) {
            next(error);
        }
    }

    async store(req, res, next) {
        try {
            const post = await postService.createPost(req.user.id, req.body);

            return res.status(201).json({
                success: true,
                message: 'Tạo bài viết thành công',
                data: post
            });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const post = await postService.updatePost(req.params.id, req.body);

            return res.status(200).json({
                success: true,
                message: 'Cập nhật bài viết thành công',
                data: post
            });
        } catch (error) {
            next(error);
        }
    }

    async destroy(req, res, next) {
        try {
            await postService.deletePost(req.params.id);

            return res.status(200).json({
                success: true,
                message: 'Xóa bài viết thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PostController();
