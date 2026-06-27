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
        return String(text || '')
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
    }

    parseAiJson(text) {
        const cleaned = this.normalizeGeminiJson(text);

        try {
            return JSON.parse(cleaned);
        } catch {
            const match = cleaned.match(/\{[\s\S]*\}/);

            if (match) {
                return JSON.parse(match[0]);
            }

            return {
                reply: cleaned || 'AI chưa thể tư vấn lúc này.',
                recommendations: []
            };
        }
    }

    normalizeHistory(history) {
        if (!Array.isArray(history)) return [];

        return history
            .slice(-12)
            .map((item) => ({
                role: item.role === 'assistant' ? 'assistant' : 'user',
                content: String(item.content || '').slice(0, 1500)
            }))
            .filter((item) => item.content);
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

                return this.toPublicRecommendation(book, item.reason, item.score);
            })
            .filter(Boolean);

        return {
            reply: aiResult.reply || 'Mình đã tìm được một số sách phù hợp cho bạn.',
            recommendations: enrichedRecommendations
        };
    }

    toPublicRecommendation(book, reason, score = 0) {
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
            reason: reason || book.description || book.tagline || 'Hiện tại sách này chưa có mô tả chi tiết.',
            score: Number(score) || 0
        };
    }

    getBooksFromHistory(history = [], books = []) {
        if (!Array.isArray(history)) return [];

        const bookMap = new Map();

        books.forEach((book) => {
            bookMap.set(book.slug, book);
        });

        const result = [];
        const seen = new Set();

        for (let i = history.length - 1; i >= 0; i--) {
            const content = history[i]?.content || '';
            const matches = [...content.matchAll(/- Slug:\s*([a-zA-Z0-9-]+)/g)];

            for (const match of matches) {
                const slug = match[1];

                if (seen.has(slug)) continue;

                const book = bookMap.get(slug);

                if (book) {
                    result.push(book);
                    seen.add(slug);
                }
            }

            if (result.length >= 3) break;
        }

        return result;
    }

    getLastRecommendedBookFromHistory(history = [], books = []) {
        const booksFromHistory = this.getBooksFromHistory(history, books);

        return booksFromHistory[0] || null;
    }

    isBookContentQuestion(message) {
        const text = message.toLowerCase();

        return (
            text.includes('nội dung') ||
            text.includes('noi dung') ||
            text.includes('nói về') ||
            text.includes('noi ve') ||
            text.includes('sách đó') ||
            text.includes('sach do') ||
            text.includes('cuốn đó') ||
            text.includes('cuon do') ||
            text.includes('nó là gì') ||
            text.includes('no la gi') ||
            text.includes('nó nói gì') ||
            text.includes('no noi gi')
        );
    }

    isMultiBookQuestion(message) {
        const text = message.toLowerCase();

        return (
            text.includes('2 cuốn') ||
            text.includes('hai cuốn') ||
            text.includes('2 sách') ||
            text.includes('hai sách') ||
            text.includes('cả 2') ||
            text.includes('cả hai') ||
            text.includes('ca 2') ||
            text.includes('ca hai') ||
            text.includes('mấy cuốn') ||
            text.includes('cac cuon') ||
            text.includes('các cuốn')
        );
    }

    getRequestedBookIndex(message) {
        const text = message.toLowerCase();

        if (
            text.includes('cuốn đầu') ||
            text.includes('cuon dau') ||
            text.includes('sách đầu') ||
            text.includes('sach dau') ||
            text.includes('cuốn 1') ||
            text.includes('sách 1') ||
            text.includes('thứ nhất')
        ) {
            return 0;
        }

        if (
            text.includes('cuốn thứ 2') ||
            text.includes('cuốn 2') ||
            text.includes('sách 2') ||
            text.includes('sách thứ 2') ||
            text.includes('thứ hai') ||
            text.includes('cuốn sau') ||
            text.includes('cuon sau')
        ) {
            return 1;
        }

        if (
            text.includes('cuốn thứ 3') ||
            text.includes('cuốn 3') ||
            text.includes('sách 3') ||
            text.includes('sách thứ 3') ||
            text.includes('thứ ba')
        ) {
            return 2;
        }

        return null;
    }

    isPriceQuestion(message) {
        const text = message.toLowerCase();

        return text.includes('giá') || text.includes('bao nhiêu tiền') || text.includes('bao nhieu tien');
    }

    isStockQuestion(message) {
        const text = message.toLowerCase();

        return (
            text.includes('còn hàng') ||
            text.includes('con hang') ||
            text.includes('còn không') ||
            text.includes('ton kho')
        );
    }

    answerBookContent(book) {
        const description = book.description || book.tagline || 'Hiện tại sách này chưa có mô tả chi tiết.';

        return {
            reply: `Cuốn "${book.title}" của ${book.author} có nội dung chính là: ${description}`,
            recommendations: []
        };
    }

    answerMultipleBookContents(books = []) {
        const selectedBooks = books.slice(0, 3);

        if (!selectedBooks.length) {
            return null;
        }

        const reply = selectedBooks
            .map((book, index) => {
                const description = book.description || book.tagline || 'Hiện tại sách này chưa có mô tả chi tiết.';

                return `${index + 1}. "${book.title}" của ${book.author}: ${description}`;
            })
            .join('\n\n');

        return {
            reply,
            recommendations: selectedBooks.map((book) =>
                this.toPublicRecommendation(
                    book,
                    book.description || book.tagline || 'Hiện tại sách này chưa có mô tả chi tiết.',
                    95
                )
            )
        };
    }

    answerBookPrice(book) {
        return {
            reply: `Cuốn "${book.title}" hiện có giá ${Number(book.price).toLocaleString('vi-VN')}đ.`,
            recommendations: []
        };
    }

    answerMultipleBookPrices(books = []) {
        const selectedBooks = books.slice(0, 3);

        const reply = selectedBooks
            .map((book, index) => `${index + 1}. "${book.title}": ${Number(book.price).toLocaleString('vi-VN')}đ`)
            .join('\n');

        return {
            reply,
            recommendations: []
        };
    }

    answerBookStock(book) {
        return {
            reply:
                book.stock > 0
                    ? `Cuốn "${book.title}" hiện còn ${book.stock} quyển trong kho.`
                    : `Cuốn "${book.title}" hiện đã hết hàng.`,
            recommendations: []
        };
    }

    answerMultipleBookStock(books = []) {
        const selectedBooks = books.slice(0, 3);

        const reply = selectedBooks
            .map((book, index) => {
                return book.stock > 0
                    ? `${index + 1}. "${book.title}": còn ${book.stock} quyển.`
                    : `${index + 1}. "${book.title}": hiện đã hết hàng.`;
            })
            .join('\n');

        return {
            reply,
            recommendations: []
        };
    }

    tryAnswerFromHistory(message, history, books) {
        const booksFromHistory = this.getBooksFromHistory(history, books);
        const lastBook = booksFromHistory[0] || null;
        const requestedIndex = this.getRequestedBookIndex(message);

        if (!booksFromHistory.length) {
            return null;
        }

        if (this.isMultiBookQuestion(message)) {
            if (this.isBookContentQuestion(message)) {
                return this.answerMultipleBookContents(booksFromHistory);
            }

            if (this.isPriceQuestion(message)) {
                return this.answerMultipleBookPrices(booksFromHistory);
            }

            if (this.isStockQuestion(message)) {
                return this.answerMultipleBookStock(booksFromHistory);
            }
        }

        if (requestedIndex !== null) {
            const book = booksFromHistory[requestedIndex];

            if (!book) return null;

            if (this.isBookContentQuestion(message)) {
                return this.answerBookContent(book);
            }

            if (this.isPriceQuestion(message)) {
                return this.answerBookPrice(book);
            }

            if (this.isStockQuestion(message)) {
                return this.answerBookStock(book);
            }

            return {
                reply: `Bạn đang hỏi về cuốn "${book.title}" của ${book.author}. Bạn muốn xem nội dung, giá hay tình trạng còn hàng của cuốn này?`,
                recommendations: [
                    this.toPublicRecommendation(
                        book,
                        book.description || book.tagline || 'Hiện tại sách này chưa có mô tả chi tiết.',
                        95
                    )
                ]
            };
        }

        if (lastBook) {
            if (this.isBookContentQuestion(message)) {
                return this.answerBookContent(lastBook);
            }

            if (this.isPriceQuestion(message)) {
                return this.answerBookPrice(lastBook);
            }

            if (this.isStockQuestion(message)) {
                return this.answerBookStock(lastBook);
            }
        }

        return null;
    }

    isItOrientationQuestion(message) {
        const text = message.toLowerCase();

        return (
            text.includes('nhập môn it') ||
            text.includes('nhap mon it') ||
            text.includes('bắt đầu từ đâu') ||
            text.includes('bat dau tu dau') ||
            text.includes('nên theo mảng nào') ||
            text.includes('nen theo mang nao') ||
            text.includes('theo mảng nào') ||
            text.includes('theo mang nao') ||
            text.includes('mảng nào') ||
            text.includes('mang nao')
        );
    }

    answerItOrientation(books = []) {
        const preferredSlugs = ['lap-trinh-javascript', 'clean-code'];

        const selectedBooks = preferredSlugs.map((slug) => books.find((book) => book.slug === slug)).filter(Boolean);

        return {
            reply: 'Nếu bạn mới nhập môn IT và chưa biết bắt đầu từ đâu, mình khuyên nên bắt đầu với lập trình web/frontend. Lý do là frontend dễ nhìn thấy kết quả, dễ thực hành và phù hợp để xây nền tảng HTML, CSS, JavaScript trước khi học sâu hơn sang backend, database hoặc AI. Bạn có thể bắt đầu với JavaScript, sau đó học cách viết code sạch để phát triển lâu dài.',
            recommendations: selectedBooks.map((book, index) =>
                this.toPublicRecommendation(
                    book,
                    index === 0
                        ? 'Cuốn này phù hợp để bắt đầu với JavaScript, một nền tảng quan trọng khi học lập trình web và frontend.'
                        : 'Cuốn này giúp bạn hình thành tư duy viết code sạch, dễ đọc và dễ bảo trì sau khi đã có kiến thức lập trình cơ bản.',
                    index === 0 ? 95 : 88
                )
            )
        };
    }

    async advise(message, history = []) {
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

        const safeHistory = this.normalizeHistory(history);

        const historyAnswer = this.tryAnswerFromHistory(message, safeHistory, books);

        if (historyAnswer) {
            return historyAnswer;
        }

        if (this.isItOrientationQuestion(message)) {
            return this.answerItOrientation(books);
        }

        const prompt = buildAiAdvisorPrompt(message, books, safeHistory);

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: prompt
            });

            const aiResult = this.parseAiJson(response.text || '');

            return this.enrichRecommendations(aiResult, books);
        } catch (error) {
            const status = error.status || error.code;
            const messageError = error.message || '';

            console.error('AI Advisor Error:', {
                status,
                message: messageError,
                stack: error.stack
            });

            if (status === 429 || messageError.includes('RESOURCE_EXHAUSTED') || messageError.includes('quota')) {
                return {
                    reply: 'AI tư vấn đang quá tải hoặc hết lượt miễn phí. Bạn vui lòng thử lại sau khoảng 1 phút.',
                    recommendations: []
                };
            }

            if (error instanceof SyntaxError) {
                return {
                    reply: 'AI đã phản hồi nhưng dữ liệu chưa đúng định dạng. Bạn vui lòng gửi lại câu hỏi ngắn gọn hơn.',
                    recommendations: []
                };
            }

            return {
                reply: 'AI tư vấn hiện đang gặp lỗi kỹ thuật. Bạn vui lòng thử lại sau.',
                recommendations: []
            };
        }
    }
}

module.exports = new AiAdvisorService();
