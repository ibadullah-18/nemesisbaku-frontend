import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import LoginPage from "../pages/auth/LoginPage";
import SearchPage from "../components/common/SearchOverlay";
import HomePage from "../pages/home/HomePage";

import SuperAdminLogin from "../pages/admin/SuperAdminLogin";
import AdminLayout from "../components/admin/AdminLayout";
import AdminProtectedRoute from "../components/admin/AdminProtectedRoute";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminProductDetails from "../pages/admin/AdminProductDetails";
import AdminAddProduct from "../pages/admin/AdminAddProduct";
import AdminEditProduct from "../pages/admin/AdminEditProduct";
import AdminCampaigns from "../pages/admin/AdminCampaigns";
import AdminPromoForm from "../pages/admin/AdminPromoForm";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminOrderDetails from "../pages/admin/AdminOrderDetails";
import AdminAuditLogs from "../pages/admin/AdminAuditLogs";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminBrands from "../pages/admin/AdminBrands";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminSizes from "../pages/admin/AdminSizes";
import AdminColors from "../pages/admin/AdminColors";
import AdminHomeSections from "../pages/admin/AdminHomeSections";
import AdminHomeSectionForm from "../pages/admin/AdminHomeSectionForm";
import AdminPromoCodes from "../pages/admin/AdminPromoCodes";
import AdminEmailAnnouncements from "../pages/admin/AdminEmailAnnouncements";
import AdminCouriers from "../pages/admin/AdminCouriers";
import AdminLogin from "../pages/admin/AdminLogin";

import ProfilePage from "../pages/profile/ProfilePage";
import ProductDetailsPage from "../pages/product/ProductDetailsPage";
import FavoritesPage from "../pages/favorites/FavoritesPage";
import BasketPage from "../pages/basket/BasketPage";
import MyOrdersPage from "../pages/orders/MyOrdersPage";
import OrderDetailsPage from "../pages/orders/OrderDetailsPage";
import AddressesPage from "../pages/profile/AddressesPage";
import ProfileSettingsPage from "../pages/profile/ProfileSettingsPage";
import CheckoutPage from "../pages/checkout/CheckoutPage";
import OrderSuccessPage from "../pages/checkout/OrderSuccessPage";
import OrderFailedPage from "../pages/checkout/OrderFailedPage";
import AccountSettingsPage from "../pages/profile/AccountSettingsPage";
import LoyaltyCardPage from "../pages/profile/LoyaltyCardPage";
import SecuritySettingsPage from "../pages/profile/SecuritySettingsPage";
import PromoPage from "../pages/promo/PromoPage";

import InfoAddressPage from "../pages/info/InfoAddressPage";
import DeliveryPage from "../pages/info/DeliveryPage";
import ReturnPolicyPage from "../pages/info/ReturnPolicyPage";
import AboutPage from "../pages/info/AboutPage";
import CareerPage from "../pages/info/CareerPage";
import StoresPage from "../pages/info/StoresPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";

function PageShell({ children }) {
  const location = useLocation();

  useEffect(() => {
    const shouldRestoreProduct =
      location.pathname === "/" &&
      sessionStorage.getItem("nemesis_return_product_id");

    if (shouldRestoreProduct) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return (
    <div className="animate-[pageSlideIn_0.38s_cubic-bezier(0.22,1,0.36,1)_both]">
      {children}
    </div>
  );
}

function Layout({ children }) {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <PageShell>{children}</PageShell>
      <Footer />
    </>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <HomePage />
          </Layout>
        }
      />

      <Route
        path="/search"
        element={
          <Layout>
            <SearchPage />
          </Layout>
        }
      />

      <Route
        path="/favorites"
        element={
          <Layout>
            <FavoritesPage />
          </Layout>
        }
      />

      <Route
        path="/basket"
        element={
          <Layout>
            <BasketPage />
          </Layout>
        }
      />

      <Route
        path="/profile"
        element={
          <Layout>
            <ProfilePage />
          </Layout>
        }
      />

      <Route
        path="/login"
        element={
          <Layout>
            <LoginPage />
          </Layout>
        }
      />

      <Route
        path="/products/:id"
        element={
          <Layout>
            <ProductDetailsPage />
          </Layout>
        }
      />

      <Route
        path="/orders"
        element={
          <Layout>
            <MyOrdersPage />
          </Layout>
        }
      />

      <Route
        path="/orders/:id"
        element={
          <Layout>
            <OrderDetailsPage />
          </Layout>
        }
      />

      <Route
        path="/checkout"
        element={
          <Layout>
            <CheckoutPage />
          </Layout>
        }
      />

      <Route
        path="/order-success"
        element={
          <Layout>
            <OrderSuccessPage />
          </Layout>
        }
      />

      <Route
        path="/order-failed"
        element={
          <Layout>
            <OrderFailedPage />
          </Layout>
        }
      />

      <Route
        path="/profile/settings"
        element={
          <Layout>
            <ProfileSettingsPage />
          </Layout>
        }
      />

      <Route
        path="/profile/settings/addresses"
        element={
          <Layout>
            <AddressesPage />
          </Layout>
        }
      />

      <Route
        path="/profile/settings/account"
        element={
          <Layout>
            <AccountSettingsPage />
          </Layout>
        }
      />

      <Route
        path="/profile/loyalty-card"
        element={
          <Layout>
            <LoyaltyCardPage />
          </Layout>
        }
      />

      <Route
        path="/profile/settings/security"
        element={
          <Layout>
            <SecuritySettingsPage />
          </Layout>
        }
      />

      <Route
        path="/infoAddress"
        element={
          <Layout>
            <InfoAddressPage />
          </Layout>
        }
      />

      <Route
        path="/delivery"
        element={
          <Layout>
            <DeliveryPage />
          </Layout>
        }
      />

      <Route
        path="/return-policy"
        element={
          <Layout>
            <ReturnPolicyPage />
          </Layout>
        }
      />

      <Route
        path="/about"
        element={
          <Layout>
            <AboutPage />
          </Layout>
        }
      />

      <Route
        path="/career"
        element={
          <Layout>
            <CareerPage />
          </Layout>
        }
      />

      <Route
        path="/stores"
        element={
          <Layout>
            <StoresPage />
          </Layout>
        }
      />

      <Route
        path="/register"
        element={
          <Layout>
            <RegisterPage />
          </Layout>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <Layout>
            <ForgotPasswordPage />
          </Layout>
        }
      />
      <Route
        path="/promo/:id"
        element={
          <Layout>
            <PromoPage />
          </Layout>
        }
      />

      <Route path="/SuperAdmin/login" element={<SuperAdminLogin />} />

      <Route
        path="/SuperAdmin"
        element={
          <AdminProtectedRoute panel="super">
            <AdminLayout
              basePath="/SuperAdmin"
              panelTitle="Super Admin Panel"
            />
          </AdminProtectedRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/SuperAdmin/dashboard" replace />}
        />

        <Route path="dashboard" element={<AdminDashboard />} />

        <Route path="products" element={<AdminProducts />} />
        <Route path="products/details/:id" element={<AdminProductDetails />} />
        <Route path="add-product" element={<AdminAddProduct />} />
        <Route path="products/:id" element={<AdminEditProduct />} />

        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route
          path="campaigns/create"
          element={<AdminPromoForm mode="create" />}
        />
        <Route path="campaigns/:id" element={<AdminPromoForm mode="edit" />} />

        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetails />} />

        <Route path="audit-logs" element={<AdminAuditLogs />} />

        <Route path="categories" element={<AdminCategories />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="sizes" element={<AdminSizes />} />
        <Route path="colors" element={<AdminColors />} />

        <Route path="users" element={<AdminUsers />} />

        <Route path="promo-codes" element={<AdminPromoCodes />} />

        <Route
          path="email-announcements"
          element={<AdminEmailAnnouncements />}
        />

        <Route path="couriers" element={<AdminCouriers />} />

        <Route path="home-sections" element={<AdminHomeSections />} />

        <Route
          path="home-sections/create"
          element={<AdminHomeSectionForm mode="create" />}
        />

        <Route
          path="home-sections/:id"
          element={<AdminHomeSectionForm mode="edit" />}
        />
      </Route>

      <Route path="/Admin/login" element={<AdminLogin />} />

      <Route
        path="/Admin"
        element={
          <AdminProtectedRoute panel="admin">
            <AdminLayout basePath="/Admin" panelTitle="Admin Panel" />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/Admin/orders" replace />} />

        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetails />} />

        <Route path="couriers" element={<AdminCouriers />} />

        <Route path="products" element={<AdminProducts />} />
        <Route path="products/details/:id" element={<AdminProductDetails />} />
        <Route path="add-product" element={<AdminAddProduct />} />
        <Route path="products/:id" element={<AdminEditProduct />} />

        <Route path="categories" element={<AdminCategories />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="sizes" element={<AdminSizes />} />
        <Route path="colors" element={<AdminColors />} />

        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route
          path="campaigns/create"
          element={<AdminPromoForm mode="create" />}
        />
        <Route path="campaigns/:id" element={<AdminPromoForm mode="edit" />} />

        <Route path="home-sections" element={<AdminHomeSections />} />

        <Route
          path="home-sections/create"
          element={<AdminHomeSectionForm mode="create" />}
        />

        <Route
          path="home-sections/:id"
          element={<AdminHomeSectionForm mode="edit" />}
        />

        <Route path="promo-codes" element={<AdminPromoCodes />} />

        <Route
          path="email-announcements"
          element={<AdminEmailAnnouncements />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}