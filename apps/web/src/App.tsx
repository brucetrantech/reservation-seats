import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/pages/LoginPage';
import SeatsPage from '@/pages/SeatsPage';
import SeatDetailPage from '@/pages/SeatDetailPage';
import PaymentPage from '@/pages/PaymentPage';
import ConfirmationPage from '@/pages/ConfirmationPage';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/seats" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/seats" element={<SeatsPage />} />
      <Route path="/seat-detail" element={<SeatDetailPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/confirmation" element={<ConfirmationPage />} />
    </Routes>
  );
}

export default App;
