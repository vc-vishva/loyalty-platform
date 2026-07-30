import { useEffect, useState } from 'react';
import api, { apiError } from '../api/client';
import type { Booking, BookingStatus, Paginated, Space } from '../types';

function fmt(iso: string): string {
  return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminBookingsPage() {
  const [data, setData] = useState<Paginated<Booking> | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [error, setError] = useState('');

  const [status, setStatus] = useState<'' | BookingStatus>('pending');
  const [date, setDate] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (status) params.status = status;
      if (date) params.date = date;
      if (spaceId) params.spaceId = spaceId;
      const res = await api.get('/bookings', { params });
      setData(res.data.data);
    } catch (err) {
      setError(apiError(err));
    }
  }

  useEffect(() => {
    api.get('/spaces', { params: { limit: 100 } }).then((res) => setSpaces(res.data.data.results));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, date, spaceId]);

  async function act(id: string, action: 'approve' | 'reject') {
    try {
      await api.patch(`/bookings/${id}/${action}`);
      await load();
    } catch (err) {
      alert(apiError(err));
    }
  }

  return (
    <div>
      <h1 className="title">Booking queue</h1>
      <p className="subtitle">Approve or reject requests. Approving auto-rejects overlapping pending requests.</p>

      <div className="toolbar">
        <div className="field">
          <label>Status</label>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as BookingStatus | '');
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setPage(1);
              setDate(e.target.value);
            }}
          />
        </div>
        <div className="field">
          <label>Space</label>
          <select
            value={spaceId}
            onChange={(e) => {
              setPage(1);
              setSpaceId(e.target.value);
            }}
          >
            <option value="">All</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Space</th>
              <th>Member</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data?.results.map((b) => (
              <tr key={b.id}>
                <td>{b.space?.name ?? b.spaceId.slice(0, 8)}</td>
                <td className="muted">{b.member?.name ?? b.memberId.slice(0, 8)}</td>
                <td>{fmt(b.startTime)}</td>
                <td>{fmt(b.endTime)}</td>
                <td>
                  <span className={`badge ${b.status}`}>{b.status}</span>
                </td>
                <td>
                  {b.status === 'pending' && (
                    <div className="row">
                      <button className="btn-green btn-sm" onClick={() => act(b.id, 'approve')}>
                        Approve
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => act(b.id, 'reject')}>
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {data && data.results.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No bookings match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="pagination">
          <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <span className="muted">
            Page {data.page} of {Math.max(1, data.totalPages)} · {data.totalResults} bookings
          </span>
          <button
            className="btn-ghost btn-sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
