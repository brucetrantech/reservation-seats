import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSeatStore } from '@/stores/seatStore';
import Header from '@/components/Header';
import { Seat } from '@/models';

export default function SeatsPage() {
  const { isAuthenticated } = useAuth();
  const { seats, fetchSeats, selectSeat, isLoading } = useSeatStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  const handleReserve = (seat: Seat) => {
    selectSeat(seat);
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/seat-detail');
  };

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 border-green-500 text-green-800',
    held: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    reserved: 'bg-red-100 border-red-500 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Seats</h1>

        {isLoading ? (
          <p className="text-gray-500">Loading seats...</p>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {seats.map((seat) => (
              <div
                key={seat.id}
                className={`p-6 border-2 rounded-lg text-center ${statusColors[seat.status]}`}
              >
                <div className="text-4xl mb-2">💺</div>
                <h3 className="font-bold text-lg">Seat {seat.seatNumber}</h3>
                <p className="text-sm capitalize mb-4">{seat.status}</p>
                {seat.status === 'available' && (
                  <button
                    onClick={() => handleReserve(seat)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                  >
                    Reserve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
