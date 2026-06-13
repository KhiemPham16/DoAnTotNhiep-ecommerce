const { SePayPgClient } = require('sepay-pg-node');

const prisma = require('~/libs/prisma');
const sepayConfig = require('~/configs/sepay.config');
const appConfig = require('~/configs/app.config');
const { AppError } = require('~/errors/AppError');

const client = new SePayPgClient({
    env: sepayConfig.env,
    merchant_id: sepayConfig.merchant_id,
    secret_key: sepayConfig.secret_key
});

function normalizeAmount(value) {
    return Math.round(Number(value || 0));
}

async function createSepayCheckout(orderId) {
    const order = await prisma.order.findUnique({
        where: {
            publicId: orderId
        }
    });

    if (!order) {
        throw new AppError(404, 'Không tìm thấy đơn hàng');
    }

    if (order.paymentStatus === 'PAID') {
        throw new AppError(400, 'Đơn hàng đã được thanh toán');
    }

    if (order.status === 'CANCELLED') {
        throw new AppError(400, 'Đơn hàng đã bị hủy');
    }

    const checkoutURL = client.checkout.initCheckoutUrl();

    const checkoutFormFields = client.checkout.initOneTimePaymentFields({
        payment_method: 'BANK_TRANSFER',
        order_invoice_number: order.publicId,
        order_amount: normalizeAmount(order.finalAmount),
        currency: 'VND',
        order_description: `Thanh toan don hang ${order.publicId}`,
        success_url: `${appConfig.frontendUrl}/payment-confirm?payment=success&orderId=${order.publicId}`,
        error_url: `${appConfig.frontendUrl}/payment-confirm?payment=error&orderId=${order.publicId}`,
        cancel_url: `${appConfig.frontendUrl}/payment-confirm?payment=cancel&orderId=${order.publicId}`
    });

    await prisma.order.update({
        where: {
            id: order.id
        },
        data: {
            paymentStatus: 'UNPAID'
        }
    });

    return {
        checkoutURL,
        checkoutFormFields
    };
}

async function handleSepayWebhook(payload) {
    console.log('SEPAY WEBHOOK PAYLOAD:', JSON.stringify(payload, null, 2));

    if (payload?.notification_type && payload.notification_type !== 'ORDER_PAID') {
        return {
            ignored: true,
            reason: 'Notification type is not ORDER_PAID'
        };
    }

    if (payload?.order?.order_status && payload.order.order_status !== 'CAPTURED') {
        return {
            ignored: true,
            reason: 'Order status is not CAPTURED'
        };
    }

    if (payload?.transaction?.transaction_status && payload.transaction.transaction_status !== 'APPROVED') {
        return {
            ignored: true,
            reason: 'Transaction status is not APPROVED'
        };
    }

    const orderPublicId =
        payload?.order?.order_invoice_number ||
        payload?.order_invoice_number ||
        payload?.invoice_number ||
        payload?.orderId ||
        payload?.order_id;

    const amount = normalizeAmount(
        payload?.transaction?.transaction_amount ||
            payload?.order?.order_amount ||
            payload?.amount ||
            payload?.order_amount ||
            payload?.transferAmount ||
            payload?.transfer_amount
    );

    if (!orderPublicId) {
        throw new AppError(400, 'Webhook thiếu mã đơn hàng');
    }

    const order = await prisma.order.findUnique({
        where: {
            publicId: orderPublicId
        }
    });

    if (!order) {
        throw new AppError(404, 'Không tìm thấy đơn hàng');
    }

    if (order.paymentStatus === 'PAID') {
        return order;
    }

    const expectedAmount = normalizeAmount(order.finalAmount);

    if (expectedAmount !== amount) {
        throw new AppError(400, 'Số tiền thanh toán không khớp');
    }

    return prisma.order.update({
        where: {
            id: order.id
        },
        data: {
            paymentStatus: 'PAID',
            status: order.status === 'PENDING' ? 'CONFIRMED' : order.status
        }
    });
}

module.exports = {
    createSepayCheckout,
    handleSepayWebhook
};
