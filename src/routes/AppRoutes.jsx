import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import LoginPage from "../pages/auth/LoginPage";
import SearchPage from "../components/common/SearchOverlay";
import HomePage from "../pages/home/HomePage";
import SuperAdminLogin from "../pages/admin/SuperAdminLogin";
import AdminLayout from "../components/admin/AdminLayout";
import AdminProtectedRoute from "../components/admin/AdminProtectedRoute";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminAddProduct from "../pages/admin/AdminAddProduct";
import AdminEditProduct from "../pages/admin/AdminEditProduct";
import AdminCampaigns from "../pages/admin/AdminCampaigns";
import AdminOrders from "../pages/admin/AdminOrders"; 
import AdminAuditLogs from "../pages/admin/AdminAuditLogs";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminBrands from "../pages/admin/AdminBrands";
import ProfilePage from "../pages/profile/ProfilePage";
import ProductDetailsPage from "../pages/product/ProductDetailsPage";
import FavoritesPage from "../pages/favorites/FavoritesPage";
import BasketPage from "../pages/basket/BasketPage";

function PageShell({ children }) {
  return (
    <div className="animate-[pageSlideIn_0.38s_cubic-bezier(0.22,1,0.36,1)_both]">
      {children}
    </div>
  );
}

function FavoritesTemp() {
  return (
    <div className="min-h-screen bg-[#fafafa] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-[1180px]">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-zinc-950">
          Favorilər
        </h1>
      </div>
    </div>
  );
}

function BasketTemp() {
  return (
    <div className="min-h-screen bg-[#fafafa] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-[1180px]">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-zinc-950">
          Səbət
        </h1>
      </div>
    </div>
  );
}

function ProfileTemp() {
  return (
    <div className="min-h-screen bg-[#fafafa] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-[1180px]">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-zinc-950">
          Profil
        </h1>
      </div>
    </div>
  );
}

function Layout({ children }) {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <PageShell key={location.pathname}>{children}</PageShell>
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

      <Route path="*" element={<Navigate to="/" />} />

      {/* Admin Routes */ }

      <Route path="/SuperAdmin" element={<SuperAdminLogin />} />

      <Route
        path="/SuperAdmin"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="add-product" element={<AdminAddProduct />} />  
        <Route path="products/:id" element={<AdminEditProduct />} />
        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="brands" element={<AdminBrands />} />
      </Route>




    </Routes>
    
  );
}