import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CartPage } from "./pages/CartPage";
import { HomePage } from "./pages/HomePage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { ProductListPage } from "./pages/ProductListPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";
import { ProfileOrdersPage } from "./pages/ProfileOrdersPage";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage";
import { SigninPage } from "./pages/SigninPage";
import { SignupPage } from "./pages/SignupPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:productCode" element={<ProductDetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/profile/orders" element={<ProfileOrdersPage />} />
        <Route path="/profile/settings" element={<ProfileSettingsPage />} />
        <Route path="/signin" element={<SigninPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
