const { GoogleGenAI } = require('@google/genai');

const prisma = require('~/libs/prisma');
const { buildAiAdvisorPrompt } = require('~/prompts/aiAdvisor.prompt');
const aiConfigs = require('~/configs/ai.config');

class AiAdvisorService {
    constructor() {
        this.ai = new GoogleGenAI({
            apiKey: aiConfigs.GEMINI
        });
    }

    async getAvailableBooks() {
        return prisma.product.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                stock: {
                    gt: 0
                }
            },
            include: {
                category: true
            },
            orderBy: [{ isFeatured: 'desc' }, { soldCount: 'desc' }, { averageRating: 'desc' }, { createdAt: 'desc' }],
            take: 50
        });
    }

    normalizeGeminiJson(text) {
        return text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
    }

    enrichRecommendations(aiResult, books) {
        const recommendations = Array.isArray(aiResult.recommendations) ? aiResult.recommendations : [];

        const bookMap = new Map();

        books.forEach((book) => {
            bookMap.set(book.slug, book);
        });

        const enrichedRecommendations = recommendations
            .map((item) => {
                const book = bookMap.get(item.slug);

                if (!book) return null;

                return {
                    id: book.publicId,
                    title: book.title,
                    slug: book.slug,
                    author: book.author,
                    category: book.category
                        ? {
                              id: book.category.publicId,
                              name: book.category.name,
                              slug: book.category.slug
                          }
                        : null,
                    thumbnail: book.thumbnail,
                    price: Number(book.price),
                    stock: book.stock,
                    soldCount: book.soldCount,
                    averageRating: book.averageRating,
                    reviewCount: book.reviewCount,
                    reason: item.reason,
                    score: Number(item.score) || 0
                };
            })
            .filter(Boolean);

        return {
            reply: aiResult.reply || 'Mình đã tìm được một số sách phù hợp cho bạn.',
            recommendations: enrichedRecommendations
        };
    }

    async advise(message) {
        if (!aiConfigs.GEMINI || aiConfigs.GEMINI === 'your_api_key_here') {
            throw new Error('Thiếu GEMINI_API_KEY trong file .env');
        }

        const books = await this.getAvailableBooks();

        if (!books.length) {
            return {
                reply: 'Hiện tại cửa hàng chưa có sách còn hàng để tư vấn.',
                recommendations: []
            };
        }

        const prompt = buildAiAdvisorPrompt(message, books);

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const text = this.normalizeGeminiJson(response.text || '');
            const aiResult = JSON.parse(text);

            return this.enrichRecommendations(aiResult, books);
        } catch (error) {
            const status = error.status || error.code;
            const message = error.message || '';

            if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
                return {
                    reply: 'AI tư vấn đang hết lượt sử dụng miễn phí. Bạn vui lòng thử lại sau ít phút hoặc quay lại sau.',
                    recommendations: []
                };
            }

            return {
                reply: 'AI tư vấn hiện đang gặp lỗi. Bạn vui lòng thử lại sau.',
                recommendations: []
            };
        }
    }
}

module.exports = new AiAdvisorService();
