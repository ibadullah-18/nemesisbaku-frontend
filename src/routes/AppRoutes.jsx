import { lazy, Suspense, useLayoutEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const SearchPage = lazy(() => import("../components/common/SearchOverlay"));
const HomePage = lazy(() => import("../pages/home/HomePage"));

const SuperAdminLogin = lazy(() => import("../pages/admin/SuperAdminLogin"));
import AdminLayout from "../components/admin/AdminLayout";
import AdminProtectedRoute from "../components/admin/AdminProtectedRoute";
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("../pages/admin/AdminProducts"));
const AdminProductDetails = lazy(() => import("../pages/admin/AdminProductDetails"));
const AdminAddProduct = lazy(() => import("../pages/admin/AdminAddProduct"));
const AdminEditProduct = lazy(() => import("../pages/admin/AdminEditProduct"));
const AdminCampaigns = lazy(() => import("../pages/admin/AdminCampaigns"));
const AdminPromoForm = lazy(() => import("../pages/admin/AdminPromoForm"));
const AdminOrders = lazy(() => import("../pages/admin/AdminOrders"));
const AdminOrderDetails = lazy(() => import("../pages/admin/AdminOrderDetails"));
const AdminAuditLogs = lazy(() => import("../pages/admin/AdminAuditLogs"));
const AdminCategories = lazy(() => import("../pages/admin/AdminCategories"));
const AdminBrands = lazy(() => import("../pages/admin/AdminBrands"));
const AdminUsers = lazy(() => import("../pages/admin/AdminUsers"));
const AdminSizes = lazy(() => import("../pages/admin/AdminSizes"));
const AdminColors = lazy(() => import("../pages/admin/AdminColors"));
const AdminHomeSections = lazy(() => import("../pages/admin/AdminHomeSections"));
const AdminHomeSectionForm = lazy(() => import("../pages/admin/AdminHomeSectionForm"));
const AdminPromoCodes = lazy(() => import("../pages/admin/AdminPromoCodes"));
const AdminEmailAnnouncements = lazy(() => import("../pages/admin/AdminEmailAnnouncements"));
const AdminCouriers = lazy(() => import("../pages/admin/AdminCouriers"));
const AdminLogin = lazy(() => import("../pages/admin/AdminLogin"));

const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const ProductDetailsPage = lazy(() => import("../pages/product/ProductDetailsPage"));
const FavoritesPage = lazy(() => import("../pages/favorites/FavoritesPage"));
const BasketPage = lazy(() => import("../pages/basket/BasketPage"));
const MyOrdersPage = lazy(() => import("../pages/orders/MyOrdersPage"));
const OrderDetailsPage = lazy(() => import("../pages/orders/OrderDetailsPage"));
const AddressesPage = lazy(() => import("../pages/profile/AddressesPage"));
const ProfileSettingsPage = lazy(() => import("../pages/profile/ProfileSettingsPage"));
const CheckoutPage = lazy(() => import("../pages/checkout/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("../pages/checkout/OrderSuccessPage"));
const OrderFailedPage = lazy(() => import("../pages/checkout/OrderFailedPage"));
const AccountSettingsPage = lazy(() => import("../pages/profile/AccountSettingsPage"));
const SecuritySettingsPage = lazy(() => import("../pages/profile/SecuritySettingsPage"));
const LoyaltyCardInfoPage = lazy(() => import("../pages/profile/LoyaltyCardPage"));
const PromoPage = lazy(() => import("../pages/promo/PromoPage"));
const NotFoundPage = lazy(() => import("../pages/error/NotFoundPage"));

const InfoAddressPage = lazy(() => import("../pages/info/InfoAddressPage"));
const DeliveryPage = lazy(() => import("../pages/info/DeliveryPage"));
const ReturnPolicyPage = lazy(() => import("../pages/info/ReturnPolicyPage"));
const AboutPage = lazy(() => import("../pages/info/AboutPage"));
const CareerPage = lazy(() => import("../pages/info/CareerPage"));
const StoresPage = lazy(() => import("../pages/info/StoresPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));

function RouteFallback() {
  return (
    <div
      className="min-h-[calc(100dvh-72px)] bg-[#fafafa]"
      aria-hidden="true"
    />
  );
}

function PageShell({ children }) {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === "POP") return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.key, navigationType]);

  return <div>{children}</div>;
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

function NotFoundRedirect() {
  const location = useLocation();

  return (
    <Navigate
      to="/404"
      replace
      state={{ from: `${location.pathname}${location.search}` }}
    />
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
        path="/profile/settings/security"
        element={
          <Layout>
            <SecuritySettingsPage />
          </Layout>
        }
      />

      <Route
        path="/profile/loyalty-card"
        element={
          <Layout>
            <LoyaltyCardInfoPage />
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

      <Route
        path="/404"
        element={
          <Layout>
            <NotFoundPage />
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
              panel="super"
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

        <Route
          path="*"
          element={<NotFoundRedirect />}
        />
      </Route>

      <Route path="/Admin/login" element={<AdminLogin />} />

      <Route
        path="/Admin"
        element={
          <AdminProtectedRoute panel="admin">
            <AdminLayout
              basePath="/Admin"
              panel="admin"
              panelTitle="Admin Panel"
            />
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

        <Route path="*" element={<NotFoundRedirect />} />
      </Route>

      <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </Suspense>
  );
}
