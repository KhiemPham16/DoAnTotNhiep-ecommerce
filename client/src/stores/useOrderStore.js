import { create } from 'zustand';
import { toast } from 'sonner';

import { orderStatusLabels } from '~/utils/dashboardUtils';
import { orderService } from '~/services/orderService';

const updateOrderInState = (orders, orderId, updatedOrder) =>
    orders.map((item) =>
        item.id === orderId
            ? {
                  ...item,
                  ...updatedOrder
              }
            : item
    );

export const useOrderStore = create((set, get) => ({
    orders: [],
    selectedOrder: null,
    myOrdersPagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    myOrderStatusCounts: {},
    myOrderParams: {},

    loading: false,
    creating: false,
    updatingId: null,
    payingId: null,

    createOrder: async (payload) => {
        try {
            set({ creating: true });

            const data = await orderService.createOrder(payload);

            set({
                selectedOrder: data.data || null
            });

            toast.success('Đặt hàng thành công');

            return data.data || null;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tạo được đơn hàng');
            return null;
        } finally {
            set({ creating: false });
        }
    },

    createSepayCheckout: async (orderId) => {
        try {
            set({ payingId: orderId });

            const data = await orderService.createSepayCheckout(orderId);
            const checkoutData = data.data;

            if (!checkoutData?.checkoutURL || !checkoutData?.checkoutFormFields) {
                toast.error('Dữ liệu thanh toán không hợp lệ');
                return false;
            }

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = checkoutData.checkoutURL;

            Object.entries(checkoutData.checkoutFormFields).forEach(([key, value]) => {
                const input = document.createElement('input');

                input.type = 'hidden';
                input.name = key;
                input.value = String(value);

                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tạo được thanh toán SePay');
            return false;
        } finally {
            set({ payingId: null });
        }
    },

    fetchMyOrders: async (params = get().myOrderParams) => {
        try {
            set({ loading: true });

            const data = await orderService.getMyOrders(params);

            set({
                orders: data.data || [],
                myOrdersPagination: data.meta?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
                myOrderStatusCounts: data.meta?.statusCounts || {},
                myOrderParams: params
            });

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được đơn hàng của bạn');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    fetchMyOrderDetail: async (id) => {
        try {
            set({ loading: true });

            const data = await orderService.getMyOrderById(id);

            set({
                selectedOrder: data.data || null
            });

            return data.data || null;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được chi tiết đơn hàng');
            return null;
        } finally {
            set({ loading: false });
        }
    },

    cancelMyOrder: async (id) => {
        try {
            set({ updatingId: id });

            await orderService.cancelMyOrder(id);

            toast.success('Hủy đơn hàng thành công');

            await get().fetchMyOrders();

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không hủy được đơn hàng');
            return false;
        } finally {
            set({ updatingId: null });
        }
    },

    fetchOrders: async () => {
        try {
            set({ loading: true });

            const data = await orderService.getOrders();

            set({
                orders: data.data || []
            });

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không tải được danh sách đơn hàng');
            return false;
        } finally {
            set({ loading: false });
        }
    },

    updatePaymentStatus: async (order, paymentStatus) => {
        if (!paymentStatus || order.paymentStatus === paymentStatus) {
            return false;
        }

        try {
            set({ updatingId: order.id });

            const data = await orderService.updatePaymentStatus(order.id, paymentStatus);
            const updatedOrder = data.data;

            set((state) => ({
                orders: updateOrderInState(state.orders, order.id, updatedOrder)
            }));

            toast.success('Cập nhật thanh toán thành công');

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không cập nhật được trạng thái thanh toán');
            return false;
        } finally {
            set({ updatingId: null });
        }
    },

    updateOrderStatus: async (order, status) => {
        if (!status || order.status === status) {
            return false;
        }

        try {
            set({ updatingId: order.id });

            const data = await orderService.updateOrderStatus(order.id, status);
            const updatedOrder = data.data;

            set((state) => ({
                orders: updateOrderInState(state.orders, order.id, updatedOrder)
            }));

            toast.success(`Đã chuyển đơn hàng sang "${orderStatusLabels[status]}"`);

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không cập nhật được trạng thái đơn hàng');
            return false;
        } finally {
            set({ updatingId: null });
        }
    },

    approveOrder: async (order) => {
        try {
            set({ updatingId: order.id });

            const data = await orderService.approveOrder(order.id);
            const updatedOrder = data.data;

            set((state) => ({
                orders: updateOrderInState(state.orders, order.id, updatedOrder),
                selectedOrder:
                    state.selectedOrder?.id === order.id
                        ? {
                              ...state.selectedOrder,
                              ...updatedOrder
                          }
                        : state.selectedOrder
            }));

            toast.success('Duyệt đơn hàng thành công');

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không duyệt được đơn hàng');
            return false;
        } finally {
            set({ updatingId: null });
        }
    },

    assignOrder: async (order, employeeId) => {
        try {
            set({ updatingId: order.id });

            const data = await orderService.assignOrder(order.id, employeeId);
            const updatedOrder = data.data;

            set((state) => ({
                orders: updateOrderInState(state.orders, order.id, updatedOrder),
                selectedOrder:
                    state.selectedOrder?.id === order.id
                        ? {
                              ...state.selectedOrder,
                              ...updatedOrder
                          }
                        : state.selectedOrder
            }));

            toast.success('Phân công nhân viên thành công');

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không phân công được đơn hàng');
            return false;
        } finally {
            set({ updatingId: null });
        }
    },

    unassignOrder: async (order) => {
        try {
            set({ updatingId: order.id });

            const data = await orderService.unassignOrder(order.id);
            const updatedOrder = data.data;

            set((state) => ({
                orders: updateOrderInState(state.orders, order.id, updatedOrder),
                selectedOrder:
                    state.selectedOrder?.id === order.id
                        ? {
                              ...state.selectedOrder,
                              ...updatedOrder
                          }
                        : state.selectedOrder
            }));

            toast.success('Hủy phân công thành công');

            return true;
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Không hủy phân công được đơn hàng');
            return false;
        } finally {
            set({ updatingId: null });
        }
    }
}));
