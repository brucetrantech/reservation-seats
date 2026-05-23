import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSeatStore } from '@/stores/seatStore';
import { useBookingStore } from '@/stores/bookingStore';
import Header from '@/components/Header';

export default function SeatDetailPage() {
  const { isAuthenticated } = useAuth();
  const { selectedSeat } = useSeatStore();
  const { holdSeat, currentBooking, isLoading, error } = useBookingStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedSeat) {
      navigate('/seats');
    }
  }, [isAuthenticated, selectedSeat, navigate]);

  useEffect(() => {
    if (currentBooking) {
      navigate('/payment');
    }
  }, [currentBooking, navigate]);

  if (!selectedSeat) return null;

  const handlePay = async () => {
    await holdSeat(selectedSeat.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-lg mx-auto py-12 px-4">
        <button
          onClick={() => navigate('/seats')}
          className="text-sm text-blue-600 hover:text-blue-800 mb-6 inline-flex items-center gap-1"
        >
          ← Back to seats
        </button>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">💺</div>
            <h1 className="text-2xl font-bold text-gray-900">
              Seat {selectedSeat.seatNumber}
            </h1>
            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full capitalize">
              {selectedSeat.status}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Seat number</span>
              <span className="font-medium">{selectedSeat.seatNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price</span>
              <span className="font-medium">50,000 VND</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Hold duration</span>
              <span className="font-medium">5 minutes</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={isLoading || selectedSeat.status !== 'available'}
            className="w-full mt-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Reserving...' : 'Pay the seat'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Clicking "Pay the seat" will hold this seat for 5 minutes while you complete payment.
          </p>
        </div>
      </div>
    </div>
  );
}
