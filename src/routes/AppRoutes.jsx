import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import LoginPage from "../pages/auth/LoginPage";
import SearchPage from "../components/common/SearchOverlay";
import ProductDiscoveryBar from "../components/product/ProductDiscoveryBar";

function PageShell({ children }) {
  return (
    <div className="animate-[pageSlideIn_0.38s_cubic-bezier(0.22,1,0.36,1)_both]">
      {children}
    </div>
  );
}

function HomeTemp() {
  const [products, setProducts] = useState([]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ProductDiscoveryBar onProductsChange={setProducts} />

      <div className="mx-auto max-w-[1180px] px-5 py-8 md:px-8">
        <h1 className="text-[42px] font-extrabold leading-[1.08] tracking-[-0.035em] text-zinc-950 md:text-[64px]">
          NemesisBaku
        </h1>

        <p className="mt-3 max-w-[520px] text-[15px] leading-7 text-zinc-600 md:text-[17px]">
          Home page növbəti addımda qurulacaq.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => {
            const image =
              product.mainImageUrl ||
              product.imageUrl ||
              product.images?.[0]?.imageUrl ||
              product.images?.[0]?.url;

            return (
              <div
                key={product.id}
                className="overflow-hidden rounded-[22px] border border-zinc-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)]"
              >
                <div className="aspect-square bg-zinc-50">
                  {image ? (
                    <img
                      src={image}
                      alt={product.name || "NemesisBaku product"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm font-bold text-zinc-300">
                      NemesisBaku
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-bold leading-5 text-zinc-950">
                    {product.name || product.productName || "Məhsul"}
                  </p>

                  <p className="mt-1 text-sm font-extrabold text-[#244989]">
                    {product.discountPrice || product.price} ₼
                  </p>
                </div>
              </div>
            );
          })}
        </div>
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