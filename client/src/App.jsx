import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import Contact from './pages/Contact';
import AuthLayout from './pages/Auth';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyEmail from './pages/Auth/VerifyEmail';
import Category from './pages/Category';
import Account from './pages/Account';
import AccountOrders from './pages/Account/Orders';
import AccountOrderDetails from './pages/Account/OrderDetails';
import ShoppingCart from './pages/ShoppingCart';

import SiteLayout from '~/layouts/SiteLayout';
import DashboardLayout from '~/layouts/DashboardLayout';
import ProtectedRoute from '~/components/ProtectedRoute';
import DashboardRouteGuard from '~/components/DashboardRouteGuard';
import { dashboardRoutes } from '~/utils/dashboardPermissions';

import Dashboard from '~/pages/Dashboard';
import Employees from '~/pages/Dashboard/Employees';
import Customers from '~/pages/Dashboard/Customers';
import Products from '~/pages/Dashboard/Products';
import Categories from '~/pages/Dashboard/Categories';
import Orders from '~/pages/Dashboard/Orders';
import Blogs from '~/pages/Dashboard/Blogs';
import Media from '~/pages/Dashboard/Media';
import Coupons from '~/pages/Dashboard/Coupons';
import PaymentMethods from '~/pages/Dashboard/PaymentMethods';
import ProductDetails from './pages/ProductDetails';
import Pay from './pages/Pay';
import Payments from './pages/PaymentConfirmation';
import Sepay from './pages/Sepay';

export default function App() {
    const routeByPath = Object.fromEntries(dashboardRoutes.map((route) => [route.path, route]));

    return (
        <Routes>
            <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/category" element={<Category />} />
                <Route path="/cart" element={<ShoppingCart />} />
                <Route path="/product/:slug" element={<ProductDetails />} />
                <Route path="/auth" element={<AuthLayout />}>
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="reset-password" element={<ResetPassword />} />
                </Route>
                <Route path="verify-email" element={<VerifyEmail />} />
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route element={<SiteLayout />}>
                    <Route path="/account" element={<Account />} />
                    <Route path="/account/orders" element={<AccountOrders />} />
                    <Route path="/account/orders/:id" element={<AccountOrderDetails />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'EMPLOYEE']} />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route
                        index
                        element={
                            <DashboardRouteGuard route={routeByPath['/dashboard']}>
                                <Dashboard />
                            </DashboardRouteGuard>
                        }
                    />
                    <Route
                        path="employees"
                        element={
                            <DashboardRouteGuard route={routeByPath['/dashboard/employees']}>
                                <Employees />
                            </DashboardRouteGuard>
                        }
                    />
                    <Route
                        path="customers"
                        element={
                            <DashboardRouteGuard route={routeByPath['/dashboard/customers']}>
                                <Customers />
                            </DashboardRouteGuard>
                        }
                    />
                    <Route
                        path="products"
                        element={
                            <DashboardRouteGuard route={routeByPath['/dashboard/products']}>
                                <Products />
                            </DashboardRouteGuard>
                        }
                    />
                    <Route
                        path="categories"
                        element={
                            <DashboardRouteGuard route={routeByPath['/dashboard/categories']}>
                                <Categories />
                            </DashboardRouteGuard>
                        }
                    />
                    <Route
                        path="orders"
                        element={
                            <DashboardRouteGuard route={routeByPath['/dashboard/orders']}>
                                <Orders />
                            </DashboardRouteGuard>
                        }
                    />
                    <Route
                        path="blogs"
                        element={
                            <DashboardRouteGuard route={routeByPath['/dashboard/blogs']}>
                                <Blogs />
                            </DashboardRouteGuard>
                        }
                    />
                    <Route
                        path="media"
                        element={
                            <DashboardRouteGuard route={routeByPath['/dashboard/media']}>
                                <Media />
                            </DashboardRouteGuard>
                        }
                    />
                    <Route
                        path="coupons"
                        element={
                            <DashboardRouteGuard route={routeByPath['/dashboard/coupons']}>
                                <Coupons />
                            </DashboardRouteGuard>
                        }
                    />
                    <Route
                        path="payment-methods"
                        element={
                            <DashboardRouteGuard route={routeByPath['/dashboard/payment-methods']}>
                                <PaymentMethods />
                            </DashboardRouteGuard>
                        }
                    />
                </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route element={<SiteLayout />}>
                    <Route path="/pay" element={<Pay />} />
                    <Route path="/sepay/" element={<Sepay />} />
                    <Route path="/payment-confirm" element={<Payments />} />
                </Route>
            </Route>
        </Routes>
    );
}
