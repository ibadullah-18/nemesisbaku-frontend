import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import LoginPage from "../pages/auth/LoginPage";

function PageShell({ children }) {
  return (
    <div className="animate-[pageSlideIn_0.38s_cubic-bezier(0.22,1,0.36,1)_both]">
      {children}
    </div>
  );
}

function HomeTemp() {
  return (
    <div className="min-h-screen bg-[#fafafa] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-[1180px]">
        <h1 className="text-[42px] font-extrabold leading-[1.08] tracking-[-0.035em] text-zinc-950 md:text-[64px]">
          NemesisBaku
        </h1>
        <p className="mt-3 max-w-[520px] text-[15px] leading-7 text-zinc-600 md:text-[17px]">
          Home page növbəti addımda qurulacaq.
        </p>
      </div>
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
            <HomeTemp />
          </Layout>
        }
      />

      <Route
        path="/favorites"
        element={
          <Layout>
            <FavoritesTemp />
          </Layout>
        }
      />

      <Route
        path="/basket"
        element={
          <Layout>
            <BasketTemp />
          </Layout>
        }
      />

      <Route
        path="/profile"
        element={
          <Layout>
            <ProfileTemp />
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

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}