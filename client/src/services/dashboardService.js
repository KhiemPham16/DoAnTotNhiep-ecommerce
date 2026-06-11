import { orderService } from '~/services/orderService';
import { productService } from '~/services/productService';
import { userService } from '~/services/userService';

export const dashboardService = {
    getOverview: async () => {
        const [orders, products, users] = await Promise.all([
            orderService.getOrders(),
            productService.getProducts({ limit: 100 }),
            userService.getUsers()
        ]);

        return {
            orders: orders.data || [],
            products: products.data || [],
            users: users.data || []
        };
    }
};
