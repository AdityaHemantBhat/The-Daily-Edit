import { lazy } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../../presentation/layouts/MainLayout';
import { AdminLayout } from '../../presentation/layouts/AdminLayout';

// Route-level code splitting
const HomePage = lazy(() => import('../../modules/home/HomePage'));
const ArticlePage = lazy(() => import('../../modules/articles/ArticlePage'));
const CategoryPage = lazy(() => import('../../modules/categories/CategoryPage'));
const AuthorPage = lazy(() => import('../../modules/authors/AuthorPage'));
const SearchPage = lazy(() => import('../../modules/search/SearchPage'));
const ToolsDirectoryPage = lazy(() => import('../../modules/tools/ToolsDirectoryPage'));
const ToolPage = lazy(() => import('../../modules/tools/ToolPage'));
const LegalPage = lazy(() => import('../../modules/legal/LegalPage'));
const ContactPage = lazy(() => import('../../modules/legal/ContactPage'));
const AdminMessages = lazy(() => import('../../modules/admin/AdminMessages'));
const AboutPage = lazy(() => import('../../modules/legal/AboutPage'));
const AdminLogin = lazy(() => import('../../modules/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('../../modules/admin/AdminDashboard'));
const AdminArticles = lazy(() => import('../../modules/admin/AdminArticles'));
const ArticleEditor = lazy(() => import('../../modules/admin/ArticleEditor'));
const AdminCategories = lazy(() => import('../../modules/admin/AdminCategories'));
const AdminTags = lazy(() => import('../../modules/admin/AdminTags'));
const AdminAuthors = lazy(() => import('../../modules/admin/AdminAuthors'));
const AdminMedia = lazy(() => import('../../modules/admin/AdminMedia'));
const AdminTools = lazy(() => import('../../modules/admin/AdminTools'));
const AdminComments = lazy(() => import('../../modules/admin/AdminComments'));
const AdminNewsletter = lazy(() => import('../../modules/admin/AdminNewsletter'));
const AdminAds = lazy(() => import('../../modules/admin/AdminAds'));
const AdminSettings = lazy(() => import('../../modules/admin/AdminSettings'));
const AdminUsers = lazy(() => import('../../modules/admin/AdminUsers'));

import { Header } from '../../presentation/components/Header';
import { Footer } from '../../presentation/components/Footer';

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-48 text-center">
          <p className="font-serif text-7xl font-bold text-rule-dark">404</p>
          <h1 className="mt-4 font-serif text-3xl font-semibold">Page not found</h1>
          <p className="mt-2 text-ink-500">The page you're looking for doesn't exist or has moved.</p>
          <Link to="/" className="mt-6 inline-block font-semibold text-gold-700 hover:underline">← Back to the homepage</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

const LEGAL_ROUTES = ['/privacy-policy', '/terms', '/disclaimer', '/editorial-policy', '/cookie-policy'];

export function Router({ adminPath = '/admin' }: { adminPath?: string }) {
  return (
    <Routes>
      <Route path={adminPath} element={<AdminLayout />}>
        <Route index element={<AdminLogin />} />
        <Route path="login" element={<Navigate to={adminPath} replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="articles" element={<AdminArticles />} />
        <Route path="articles/new" element={<ArticleEditor />} />
        <Route path="articles/:id/edit" element={<ArticleEditor />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="tags" element={<AdminTags />} />
        <Route path="authors" element={<AdminAuthors />} />
        <Route path="media" element={<AdminMedia />} />
        <Route path="tools" element={<AdminTools />} />
        <Route path="comments" element={<AdminComments />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="newsletter" element={<AdminNewsletter />} />
        <Route path="ads" element={<AdminAds />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="articles/:slug" element={<ArticlePage />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="authors/:slug" element={<AuthorPage />} />
        <Route path="tools" element={<ToolsDirectoryPage />} />
        <Route path="tools/:slug" element={<ToolPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        {LEGAL_ROUTES.map((path) => (
          <Route key={path} path={path} element={<LegalPage />} />
        ))}
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
