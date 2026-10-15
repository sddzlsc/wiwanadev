import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import FloatingContact from '@/components/contact/FloatingContact';

import { routes } from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <IntersectObserver />
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex-1 min-w-0 overflow-x-hidden">
          <Routes>
            {routes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={route.element}
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
      <FloatingContact />
      <Toaster />
    </Router>
  );
};

export default App;
