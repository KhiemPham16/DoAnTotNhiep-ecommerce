import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import { BsChatRightDots } from 'react-icons/bs';

import { aiAdvisorService } from '~/services/aiAdvisorService';
import { getImageUrl } from '~/utils/dashboardUtils';

import styles from './BookAdvisorPopup.module.scss';

const cx = classNames.bind(styles);

const STORAGE_KEY = 'ai_book_advisor_chat';
const LAST_BOOKS_KEY = 'ai_book_advisor_last_books';

const defaultMessages = [
    {
        role: 'ai',
        reply: 'Chào bạn, bạn cần tư vấn sách gì ạ?',
        recommendations: []
    }
];

const quickQuestions = [
    'Tôi muốn học lập trình cho người mới bắt đầu',
    'Tôi không biết nên mua sách gì',
    'Tôi muốn mua sách tặng bạn gái'
];

export default function BookAdvisorPopup() {
    const location = useLocation();

    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);

        if (!saved) return defaultMessages;

        try {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }

            return defaultMessages;
        } catch {
            return defaultMessages;
        }
    });

    const shouldHide = useMemo(() => {
        const path = location.pathname;

        return path.startsWith('/auth') || path.startsWith('/dashboard');
    }, [location.pathname]);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    if (shouldHide) return null;

    const getLastBooks = () => {
        const raw = sessionStorage.getItem(LAST_BOOKS_KEY);

        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);

            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const saveLastBooks = (books) => {
        if (!Array.isArray(books) || books.length === 0) return;

        sessionStorage.setItem(LAST_BOOKS_KEY, JSON.stringify(books));
    };

    const buildBookHistoryText = (books, title = 'Sách đã gợi ý') => {
        if (!Array.isArray(books) || books.length === 0) return '';

        return books
            .map((book) => {
                return `
${title}:
- Tên: ${book.title}
- Slug: ${book.slug}
- Tác giả: ${book.author}
- Giá: ${book.price}
- Tồn kho: ${book.stock}
- Danh mục: ${book.category?.name || ''}
- Rating: ${book.averageRating || 0}
- Số lượt đánh giá: ${book.reviewCount || 0}
- Nội dung/Lý do: ${book.reason}
`;
            })
            .join('\n');
    };

    const buildHistory = () => {
        const normalHistory = messages
            .filter((item) => item.reply)
            .map((item) => {
                let content = item.reply;

                if (item.recommendations?.length > 0) {
                    content += `\n${buildBookHistoryText(item.recommendations, 'Sách đã gợi ý trong hội thoại')}`;
                }

                return {
                    role: item.role === 'ai' ? 'assistant' : 'user',
                    content
                };
            });

        const lastBooks = getLastBooks();

        if (lastBooks.length > 0) {
            normalHistory.push({
                role: 'assistant',
                content: buildBookHistoryText(lastBooks, 'Sách vừa được gợi ý gần nhất')
            });
        }

        return normalHistory;
    };

    const sendMessage = async (content) => {
        const text = content.trim();

        if (!text || loading) return;

        const nextUserMessage = {
            role: 'user',
            reply: text,
            recommendations: []
        };

        const history = buildHistory();

        setMessages((prev) => [...prev, nextUserMessage]);
        setMessage('');
        setLoading(true);

        try {
            const res = await aiAdvisorService.advise({
                message: text,
                history
            });

            const data = res.data;

            if (data.recommendations?.length > 0) {
                saveLastBooks(data.recommendations);
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'ai',
                    reply: data.reply,
                    recommendations: data.recommendations || []
                }
            ]);
        } catch (error) {
            const status = error.response?.status;

            setMessages((prev) => [
                ...prev,
                {
                    role: 'ai',
                    reply:
                        status === 429
                            ? 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng chờ một chút rồi thử lại.'
                            : 'Hiện tại AI tư vấn đang gặp lỗi. Bạn vui lòng thử lại sau.',
                    recommendations: []
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages(defaultMessages);
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(LAST_BOOKS_KEY);
    };

    return (
        <>
            <button className={cx('floatingButton')} onClick={() => setIsOpen(true)} aria-label="AI tư vấn sách">
                <BsChatRightDots />
            </button>

            {isOpen && (
                <div className={cx('popup')}>
                    <div className={cx('header')}>
                        <div>
                            <strong>AI tư vấn sách</strong>
                            <span>Gợi ý sách phù hợp với nhu cầu của bạn</span>
                        </div>

                        <div className={cx('headerActions')}>
                            <button type="button" onClick={clearChat}>
                                Xóa
                            </button>
                            <button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng">
                                ×
                            </button>
                        </div>
                    </div>

                    <div className={cx('body')}>
                        {messages.map((item, index) => (
                            <div key={index} className={cx('messageGroup', item.role)}>
                                <div className={cx('message')}>{item.reply}</div>

                                {item.role === 'ai' && index === 0 && (
                                    <div className={cx('quickQuestions')}>
                                        {quickQuestions.map((question) => (
                                            <button key={question} type="button" onClick={() => sendMessage(question)}>
                                                {question}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {item.recommendations?.length > 0 && (
                                    <div className={cx('books')}>
                                        {item.recommendations.map((book) => (
                                            <div key={book.id || book.slug} className={cx('book')}>
                                                <img src={getImageUrl(book.thumbnail)} alt={book.title} />

                                                <div className={cx('bookInfo')}>
                                                    <h4>{book.title}</h4>
                                                    <p>{book.author}</p>

                                                    <div className={cx('meta')}>
                                                        <span>{Number(book.price).toLocaleString('vi-VN')}đ</span>
                                                        <span>
                                                            {book.averageRating || 0}/5 ({book.reviewCount || 0})
                                                        </span>
                                                    </div>

                                                    <div className={cx('score')}>Phù hợp {book.score}%</div>

                                                    <p className={cx('reason')}>{book.reason}</p>

                                                    <Link to={`/product/${book.slug}`} onClick={() => setIsOpen(false)}>
                                                        Xem chi tiết
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && <div className={cx('loading')}>AI đang tư vấn...</div>}
                    </div>

                    <div className={cx('footer')}>
                        <input
                            value={message}
                            placeholder="Nhập nhu cầu tìm sách..."
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    sendMessage(message);
                                }
                            }}
                        />

                        <button type="button" onClick={() => sendMessage(message)} disabled={loading}>
                            Gửi
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
