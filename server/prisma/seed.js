const bcrypt = require('bcrypt');

require('dotenv').config();
require('module-alias/register');

const prisma = require('~/libs/prisma');

const getMimeType = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'gif') return 'image/gif';

    return 'image/jpeg';
};

const getFileNameFromUrl = (url) => {
    return url.split('/').pop();
};

async function main() {
    prisma.initPrisma();

    const password = await bcrypt.hash('123456', 10);

    const users = [
        {
            username: 'admin',
            fullName: 'System Administrator',
            email: 'admin@bookstore.com',
            phone: '0900000001',
            role: 'ADMIN'
        },
        {
            username: 'manager',
            fullName: 'Store Manager',
            email: 'manager@bookstore.com',
            phone: '0900000002',
            role: 'MANAGER'
        },
        {
            username: 'employee1',
            fullName: 'Nguyễn Văn Nhân Viên',
            email: 'employee1@bookstore.com',
            phone: '0900000003',
            role: 'EMPLOYEE'
        },
        {
            username: 'employee2',
            fullName: 'Trần Thị Bán Hàng',
            email: 'employee2@bookstore.com',
            phone: '0900000004',
            role: 'EMPLOYEE'
        },
        {
            username: 'customer1',
            fullName: 'Lê Minh Khách',
            email: 'customer1@gmail.com',
            phone: '0900000005',
            role: 'CUSTOMER'
        },
        {
            username: 'customer2',
            fullName: 'Phạm Quốc Mua Sách',
            email: 'customer2@gmail.com',
            phone: '0900000006',
            role: 'CUSTOMER'
        }
    ];

    for (const userData of users) {
        const user = await prisma.user.upsert({
            where: {
                email: userData.email
            },
            update: {},
            create: {
                ...userData,
                password,
                emailVerifiedAt: new Date()
            }
        });

        if (user.role === 'CUSTOMER') {
            await prisma.address.upsert({
                where: {
                    userId: user.id
                },
                update: {},
                create: {
                    userId: user.id,
                    receiverName: user.fullName,
                    receiverPhone: user.phone,
                    provinceCity: 'TP Hồ Chí Minh',
                    ward: 'Phường Bến Nghé',
                    specificAddress: '123 Nguyễn Huệ',
                    isDefault: true
                }
            });
        }
    }

    console.log('Seed users completed');

    const admin = await prisma.user.findUnique({
        where: {
            email: 'admin@bookstore.com'
        }
    });

    if (!admin) {
        throw new Error('Admin user not found');
    }

    const categories = [];

    const categorySeeds = [
        {
            name: 'Tiểu thuyết',
            slug: 'tieu-thuyet'
        },
        {
            name: 'Kinh doanh',
            slug: 'kinh-doanh'
        },
        {
            name: 'Công nghệ',
            slug: 'cong-nghe'
        },
        {
            name: 'Thiếu nhi',
            slug: 'thieu-nhi'
        },
        {
            name: 'Phát triển bản thân',
            slug: 'phat-trien-ban-than'
        }
    ];

    for (const categoryData of categorySeeds) {
        const category = await prisma.category.upsert({
            where: {
                slug: categoryData.slug
            },
            update: {},
            create: categoryData
        });

        categories.push(category);
    }

    console.log('Seed categories completed');

    const cod = await prisma.paymentMethod.upsert({
        where: {
            code: 'COD'
        },
        update: {
            name: 'Thanh toán khi nhận hàng',
            description: 'Khách hàng thanh toán khi nhận hàng',
            isActive: true
        },
        create: {
            name: 'Thanh toán khi nhận hàng',
            code: 'COD',
            description: 'Khách hàng thanh toán khi nhận hàng',
            isActive: true
        }
    });

    await prisma.paymentMethod.upsert({
        where: {
            code: 'SEPAY'
        },
        update: {
            name: 'Chuyển khoản SePay',
            description: 'Thanh toán qua SePay',
            isActive: true
        },
        create: {
            name: 'Chuyển khoản SePay',
            code: 'SEPAY',
            description: 'Thanh toán qua SePay',
            isActive: true
        }
    });

    console.log('Seed payment methods completed');

    const products = [];

    const productSeeds = [
        {
            title: 'Đắc Nhân Tâm',
            slug: 'dac-nhan-tam',
            tagline: 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử.',
            author: 'Dale Carnegie',
            price: 120000,
            stock: 100,
            thumbnail: '/uploads/media/products/dac-nhan-tam.webp',
            categoryId: categories[1].id,
            description: `
            Đắc Nhân Tâm là một trong những cuốn sách phát triển bản thân nổi tiếng nhất thế giới.
            Nội dung tập trung vào nghệ thuật giao tiếp, xây dựng mối quan hệ và tạo ảnh hưởng tích cực
            trong công việc cũng như cuộc sống.
        `,
            isFeatured: true
        },
        {
            title: 'Clean Code',
            slug: 'clean-code',
            tagline: 'Nghệ thuật viết mã nguồn sạch dành cho mọi lập trình viên.',
            author: 'Robert C. Martin',
            price: 250000,
            stock: 50,
            thumbnail: '/uploads/media/products/clean-code.webp',
            categoryId: categories[2].id,
            description: `
            Clean Code giúp lập trình viên hiểu cách đặt tên biến, tổ chức hàm,
            quản lý class và xây dựng hệ thống dễ bảo trì.
            Đây là cuốn sách nền tảng dành cho mọi developer chuyên nghiệp.
        `,
            isFeatured: true
        },
        {
            title: 'Lập Trình JavaScript',
            slug: 'lap-trinh-javascript',
            tagline: 'Hành trình từ JavaScript cơ bản đến xây dựng ứng dụng hiện đại.',
            author: 'F8 Team',
            price: 180000,
            stock: 80,
            thumbnail: '/uploads/media/products/js-pro.webp',
            categoryId: categories[2].id,
            description: `
            Cuốn sách hướng dẫn JavaScript từ nền tảng đến nâng cao,
            bao gồm ES6+, bất đồng bộ, DOM, module và các kỹ thuật thực chiến.
            Phù hợp cho sinh viên và lập trình viên frontend.
        `,
            isFeatured: true
        },
        {
            title: 'Harry Potter Và Hòn Đá Phù Thủy',
            slug: 'harry-potter',
            tagline: 'Bước vào thế giới phép thuật kỳ diệu cùng Harry Potter.',
            author: 'J.K. Rowling',
            price: 200000,
            stock: 60,
            thumbnail: '/uploads/media/products/harry-potter.webp',
            categoryId: categories[0].id,
            description: `
            Tập đầu tiên trong loạt truyện Harry Potter nổi tiếng toàn cầu.
            Cuốn sách mở ra hành trình đầy phép thuật, tình bạn và những cuộc phiêu lưu hấp dẫn.
        `,
            isFeatured: true
        },
        {
            title: 'Atomic Habits',
            slug: 'atomic-habits',
            tagline: 'Xây dựng thói quen nhỏ để tạo nên thay đổi lớn mỗi ngày.',
            author: 'James Clear',
            price: 160000,
            stock: 70,
            thumbnail: '/uploads/media/products/atomic-habits.webp',
            categoryId: categories[4].id,
            description: `
            Atomic Habits trình bày cách hình thành thói quen tốt, loại bỏ thói quen xấu và cải thiện bản thân
            thông qua những thay đổi nhỏ nhưng đều đặn. Cuốn sách phù hợp với người muốn học tập, làm việc
            và phát triển bản thân một cách bền vững.
        `,
            isFeatured: true
        }
    ];

    for (const productData of productSeeds) {
        const product = await prisma.product.upsert({
            where: {
                slug: productData.slug
            },
            update: productData,
            create: productData
        });

        products.push(product);
    }

    console.log('Seed products completed');

    await prisma.media.deleteMany({
        where: {
            folder: 'products'
        }
    });

    await prisma.media.createMany({
        data: products
            .filter((product) => product.thumbnail)
            .map((product) => {
                const fileName = getFileNameFromUrl(product.thumbnail);

                return {
                    fileName,
                    originalName: fileName,
                    mimeType: getMimeType(fileName),
                    size: 0,
                    url: product.thumbnail,
                    type: 'IMAGE',
                    alt: product.title,
                    folder: 'products',
                    uploadedById: admin.id
                };
            })
    });

    console.log('Seed product media completed');

    const coupon50k = await prisma.coupon.upsert({
        where: {
            code: 'KHIEM50K'
        },
        update: {
            couponType: 'CUSTOM',
            type: 'FIXED',
            value: 50000,
            minOrderAmount: 300000,
            usageLimit: 100,
            expiresAt: new Date('2027-12-31T23:59:59.000Z'),
            isActive: true
        },
        create: {
            couponType: 'CUSTOM',
            code: 'KHIEM50K',
            type: 'FIXED',
            value: 50000,
            minOrderAmount: 300000,
            usageLimit: 100,
            expiresAt: new Date('2027-12-31T23:59:59.000Z'),
            isActive: true
        }
    });

    await prisma.coupon.upsert({
        where: {
            code: 'SALE10'
        },
        update: {
            couponType: 'CUSTOM',
            type: 'PERCENT',
            value: 10,
            minOrderAmount: 200000,
            maxDiscountAmount: 100000,
            usageLimit: 100,
            expiresAt: new Date('2027-12-31T23:59:59.000Z'),
            isActive: true
        },
        create: {
            couponType: 'CUSTOM',
            code: 'SALE10',
            type: 'PERCENT',
            value: 10,
            minOrderAmount: 200000,
            maxDiscountAmount: 100000,
            usageLimit: 100,
            expiresAt: new Date('2027-12-31T23:59:59.000Z'),
            isActive: true
        }
    });

    console.log('Seed coupons completed');

    const customer = await prisma.user.findUnique({
        where: {
            email: 'customer1@gmail.com'
        }
    });

    const address = await prisma.address.findUnique({
        where: {
            userId: customer.id
        }
    });

    const existedOrder = await prisma.order.findFirst({
        where: {
            userId: customer.id
        }
    });

    if (!existedOrder) {
        await prisma.order.create({
            data: {
                userId: customer.id,
                addressId: address.id,
                paymentMethodId: cod.id,
                couponId: coupon50k.id,

                status: 'PENDING',
                paymentStatus: 'UNPAID',

                totalAmount: 490000,
                discountAmount: 50000,
                finalAmount: 440000,

                note: 'Đơn hàng test',

                items: {
                    create: [
                        {
                            productId: products[0].id,
                            title: products[0].title,
                            price: products[0].price,
                            quantity: 2,
                            subtotal: 240000
                        },
                        {
                            productId: products[1].id,
                            title: products[1].title,
                            price: products[1].price,
                            quantity: 1,
                            subtotal: 250000
                        }
                    ]
                }
            }
        });
    }

    console.log('Seed orders completed');

    const customer1 = await prisma.user.findUnique({
        where: {
            email: 'customer1@gmail.com'
        }
    });

    const customerOrder = await prisma.order.findFirst({
        where: {
            userId: customer1.id
        }
    });

    if (customerOrder) {
        const reviewSeeds = [
            {
                productId: products[0].id,
                rating: 5,
                comment: 'Nội dung rất thực tế, đọc xong áp dụng được ngay vào cuộc sống và công việc.'
            },
            {
                productId: products[1].id,
                rating: 5,
                comment: 'Cuốn sách bắt buộc nên đọc với lập trình viên. Nhiều kiến thức vẫn còn giá trị đến hiện nay.'
            }
        ];

        for (const reviewData of reviewSeeds) {
            await prisma.review.upsert({
                where: {
                    userId_productId_orderId: {
                        userId: customer1.id,
                        productId: reviewData.productId,
                        orderId: customerOrder.id
                    }
                },
                update: {
                    rating: reviewData.rating,
                    comment: reviewData.comment
                },
                create: {
                    userId: customer1.id,
                    productId: reviewData.productId,
                    orderId: customerOrder.id,
                    rating: reviewData.rating,
                    comment: reviewData.comment
                }
            });
        }
    }

    console.log('Seed reviews completed');

    const postSeeds = [
        {
            title: 'Top 10 cuốn sách nên đọc năm 2026',
            slug: 'top-10-cuon-sach-nen-doc-2026',
            dek: 'Những cuốn sách đáng đọc nhất năm 2026.',
            excerpt: 'Gợi ý những cuốn sách phù hợp cho sinh viên, dân văn phòng và người mới bắt đầu đọc sách.',
            bodyHtml: `
                <h2>Top 10 cuốn sách nên đọc năm 2026</h2>
                <p>Danh sách này phù hợp cho người muốn phát triển bản thân, học tập và nâng cấp tư duy.</p>
                <p>Một số đầu sách nổi bật gồm Đắc Nhân Tâm, Atomic Habits, Clean Code và Nhà Giả Kim.</p>
            `,
            coverImageUrl: '/uploads/media/posts/4321582bd3e68545c9bdb4c89d235aaa.webp',
            readMinutes: 5,
            featured: true,
            publishedAt: new Date(),
            status: 'PUBLISHED'
        },
        {
            title: 'Clean Code có còn đáng đọc?',
            slug: 'clean-code-co-con-dang-doc',
            dek: 'Đánh giá Clean Code trong thời đại AI.',
            excerpt: 'Clean Code vẫn là một cuốn sách nền tảng giúp lập trình viên viết code dễ đọc, dễ bảo trì hơn.',
            bodyHtml: `
                <h2>Clean Code có còn đáng đọc?</h2>
                <p>Clean Code vẫn đáng đọc, đặc biệt với sinh viên IT và lập trình viên mới đi làm.</p>
                <p>AI có thể sinh code nhanh, nhưng tư duy đặt tên biến, tách hàm và tổ chức module vẫn là kỹ năng lõi.</p>
            `,
            coverImageUrl: '/uploads/media/posts/93a7e97ba6f72741fd0849bd712c84a9.webp',
            readMinutes: 4,
            featured: true,
            publishedAt: new Date(),
            status: 'PUBLISHED'
        },
        {
            title: 'Atomic Habits và cách xây dựng thói quen học lập trình',
            slug: 'atomic-habits-lap-trinh',
            dek: 'Áp dụng Atomic Habits để học lập trình hiệu quả.',
            excerpt: 'Học lập trình không cần học quá nhiều một ngày, quan trọng là duy trì thói quen đều đặn.',
            bodyHtml: `
                <h2>Atomic Habits và việc học lập trình</h2>
                <p>Mỗi ngày code một ít, đọc tài liệu một ít và sửa lỗi một ít sẽ tạo ra tiến bộ lớn sau vài tháng.</p>
                <p>Thói quen nhỏ nhưng đều đặn thường hiệu quả hơn việc học dồn trong vài ngày.</p>
            `,
            coverImageUrl: '/uploads/media/posts/de97344349f58b604309080a05ef913e.webp',
            readMinutes: 6,
            featured: false,
            publishedAt: new Date(),
            status: 'PUBLISHED'
        }
    ];

    const posts = [];

    for (const postData of postSeeds) {
        const post = await prisma.post.upsert({
            where: {
                slug: postData.slug
            },
            update: {
                ...postData,
                authorId: admin.id
            },
            create: {
                ...postData,
                authorId: admin.id
            }
        });

        posts.push(post);
    }

    console.log('Seed posts completed');

    await prisma.media.deleteMany({
        where: {
            folder: 'posts'
        }
    });

    await prisma.media.createMany({
        data: posts
            .filter((post) => post.coverImageUrl)
            .map((post) => {
                const fileName = getFileNameFromUrl(post.coverImageUrl);

                return {
                    fileName,
                    originalName: fileName,
                    mimeType: getMimeType(fileName),
                    size: 0,
                    url: post.coverImageUrl,
                    type: 'IMAGE',
                    alt: post.title,
                    folder: 'posts',
                    uploadedById: admin.id
                };
            })
    });

    console.log('Seed post media completed');

    console.log('Seed completed');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        if (prisma.$disconnect) {
            await prisma.$disconnect();
        }
    });
