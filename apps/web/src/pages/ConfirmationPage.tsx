import { useSearchParams, Link } from 'react-router-dom';
import Header from '@/components/Header';

export default function ConfirmationPage() {
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Reservation Confirmed!
        </h1>
        <p className="text-gray-600 mb-6">
          Your seat has been successfully reserved.
        </p>
        {bookingId && (
          <p className="text-sm text-gray-500 mb-6">
            Booking ID: <code className="bg-gray-100 px-2 py-1 rounded">{bookingId}</code>
          </p>
        )}
        <Link
          to="/seats"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Back to Seats
        </Link>
      </div>
      </div>
    </div>
  );
}
