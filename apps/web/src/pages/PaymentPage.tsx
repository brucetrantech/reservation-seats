import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBookingStore } from '@/stores/bookingStore';
import { PaymentMethod } from '@/models';
import Header from '@/components/Header';

export default function PaymentPage() {
  const { isAuthenticated } = useAuth();
  const { currentBooking, createPayment, cancelBooking, isLoading, error } =
    useBookingStore();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mock');

  useEffect(() => {
    if (!isAuthenticated || !currentBooking) {
      navigate('/seats');
    }
  }, [isAuthenticated, currentBooking, navigate]);

  useEffect(() => {
    if (!currentBooking?.expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(currentBooking.expiresAt!).getTime() - Date.now()) / 1000,
        ),
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        navigate('/seats');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentBooking, navigate]);

  if (!currentBooking) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h1>
        <p className="text-gray-600 mb-6">
          Your seat is held for{' '}
          <span className="font-mono font-bold text-orange-600">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </p>

        <div className="bg-gray-50 rounded p-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Seat reservation</span>
            <span className="font-medium">50,000 VND</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment method
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="method"
                value="mock"
                checked={selectedMethod === 'mock'}
                onChange={() => setSelectedMethod('mock')}
                className="text-green-600"
              />
              <div>
                <span className="font-medium text-gray-900">Quick Pay (Demo)</span>
                <p className="text-xs text-gray-500">Instant mock transaction — no redirect</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="method"
                value="napas"
                checked={selectedMethod === 'napas'}
                onChange={() => setSelectedMethod('napas')}
                className="text-green-600"
              />
              <div>
                <span className="font-medium text-gray-900">Napas / VNPay</span>
                <p className="text-xs text-gray-500">Redirect to online banking gateway</p>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={() => createPayment(currentBooking.id, selectedMethod)}
          disabled={isLoading}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Pay Now'}
        </button>

        <button
          onClick={() => {
            cancelBooking(currentBooking.id);
            navigate('/seats');
          }}
          className="w-full mt-3 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
      </div>
    </div>
  );
}
