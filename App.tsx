
import React from 'react';
// Fix for 'no exported member' errors: Using namespace import for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import CalculatorPage from './pages/Calculator';
import ComplaintsPage from './pages/Complaints';
import About from './pages/About';

const { HashRouter, Routes, Route, Navigate } = ReactRouterDOM as any;

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/auth" element={<Auth />} />
        <Route 
          path="/calculator" 
          element={
            <ProtectedRoute>
              <CalculatorPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/complaints" 
          element={
            <ProtectedRoute>
              <ComplaintsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
