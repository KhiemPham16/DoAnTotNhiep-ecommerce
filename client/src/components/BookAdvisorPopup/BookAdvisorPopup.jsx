import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';

import { aiAdvisorService } from '~/services/aiAdvisorService';
import { getImageUrl } from '~/utils/dashboardUtils';
import { BsChatRightDots } from 'react-icons/bs';

import styles from './BookAdvisorPopup.module.scss';

const cx = classNames.bind(styles);

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

    const [messages, setMessages] = useState([
        {
            role: 'ai',
            reply: 'Chào bạn, bạn cần tư vấn sách gì ạ?',
            recommendations: []
        }
    ]);

    const shouldHide = useMemo(() => {
        const path = location.pathname;

        return path.startsWith('/auth') || path.startsWith('/dashboard');
    }, [location.pathname]);

    if (shouldHide) return null;

    const sendMessage = async (content) => {
        const text = content.trim();

        if (!text || loading) return;

        setMessages((prev) => [
            ...prev,
            {
                role: 'user',
                reply: text,
                recommendations: []
            }
        ]);

        setMessage('');
        setLoading(true);

        try {
            const res = await aiAdvisorService.advise(text);
            const data = res.data;

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

    return (
        <>
            <button className={cx('floatingButton')} onClick={() => setIsOpen(true)}>
                <BsChatRightDots />
            </button>

            {isOpen && (
                <div className={cx('popup')}>
                    <div className={cx('header')}>
                        <div>
                            <strong>AI tư vấn sách</strong>
                            <span>Gợi ý sách phù hợp với nhu cầu của bạn</span>
                        </div>

                        <button type="button" onClick={() => setIsOpen(false)}>
                            ×
                        </button>
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

                                                    <Link to={`/product/${book.slug}`}>Xem chi tiết</Link>
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
