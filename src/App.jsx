import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import ProductsPage from './components/dashboard/ProductsPage';
import ProductForm from './components/dashboard/ProductForm';
import CategoriesPage from './components/dashboard/CategoriesPage';
import CategoryForm from './components/dashboard/CategoryForm';
import OrdersPage from './components/dashboard/OrdersPage';
import OrderDetailPage from './components/dashboard/OrderDetailPage';
import UsersPage from './components/dashboard/UsersPage';
import UserDetailPage from './components/dashboard/UserDetailPage';
import InvoicesPage from './components/dashboard/InvoicesPage';
import BlogPage from './components/dashboard/BlogPage';
import BlogPostForm from './components/dashboard/BlogPostForm';
import BlogCategoriesPage from './components/dashboard/BlogCategoriesPage';
import QuotesPage from './components/dashboard/QuotesPage';
import QuoteDetailPage from './components/dashboard/QuoteDetailPage';
import ContactMessagesPage from './components/dashboard/ContactMessagesPage';
import ContactMessageDetail from './components/dashboard/ContactMessageDetail';
import EmailManagementPage from './components/dashboard/EmailManagementPage';
import SettingsPage from './components/dashboard/SettingsPage';



const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/new" element={<CategoryForm />} />
        <Route path="categories/edit/:id" element={<CategoryForm />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/new" element={<BlogPostForm />} />
        <Route path="blog/edit/:id" element={<BlogPostForm />} />
        <Route path="blog/categories" element={<BlogCategoriesPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="quotes/:id" element={<QuoteDetailPage />} />
        <Route path="contact" element={<ContactMessagesPage />} />
        <Route path="contact/:id" element={<ContactMessageDetail />} />
        <Route path="emails" element={<EmailManagementPage />} />
        <Route path="settings" element={<SettingsPage />} />


      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;