import { useEffect, useState } from 'react';
import api, { apiError } from '../api/client';
import type { Booking } from '../types';

function fmt(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id: string) {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      await load();
    } catch (err) {
      alert(apiError(err));
    }
  }

  const canCancel = (b: Booking) =>
    (b.status === 'pending' || b.status === 'approved') && new Date(b.startTime).getTime() > Date.now();

  return (
    <div>
      <h1 className="title">My bookings</h1>
      <p className="subtitle">Track your requests and cancel upcoming ones.</p>
      {error && <div className="error">{error}</div>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="muted">You have no bookings yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Space</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.space?.name ?? b.spaceId.slice(0, 8)}</td>
                  <td>{fmt(b.startTime)}</td>
                  <td>{fmt(b.endTime)}</td>
                  <td>
                    <span className={`badge ${b.status}`}>{b.status}</span>
                  </td>
                  <td>
                    {canCancel(b) && (
                      <button className="btn-danger btn-sm" onClick={() => cancel(b.id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
