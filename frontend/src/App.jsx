import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Onboarding, { ONBOARDED_KEY } from './pages/Onboarding';
import { storage } from './lib/clientId';

function RequireOnboarding({ children }) {
  return storage.get(ONBOARDED_KEY) ? children : <Navigate to="/welcome" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Onboarding />} />
      <Route
        path="/"
        element={
          <RequireOnboarding>
            <Home />
          </RequireOnboarding>
        }
      />
      <Route path="/search" element={<Search />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
