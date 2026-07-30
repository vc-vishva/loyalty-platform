import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { apiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Availability, Space } from '../types';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00–20:00

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [space, setSpace] = useState<Space | null>(null);
  const [date, setDate] = useState(todayISO());
  const [avail, setAvail] = useState<Availability | null>(null);
  const [error, setError] = useState('');

  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [bookMsg, setBookMsg] = useState('');
  const [bookErr, setBookErr] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAvail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/spaces/${id}/availability`, { params: { date } });
      setAvail(res.data.data);
    } catch (err) {
      setError(apiError(err));
    }
  }, [id, date]);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/spaces/${id}`)
      .then((res) => setSpace(res.data.data))
      .catch((err) => setError(apiError(err)));
  }, [id]);

  useEffect(() => {
    loadAvail();
  }, [loadAvail]);

  async function book(e: FormEvent) {
    e.preventDefault();
    setBookMsg('');
    setBookErr('');
    setBusy(true);
    try {
      const startTime = new Date(`${date}T${start}:00`).toISOString();
      const endTime = new Date(`${date}T${end}:00`).toISOString();
      await api.post('/bookings', { spaceId: id, startTime, endTime });
      setBookMsg('Booking requested! Track it under My Bookings.');
      await loadAvail();
    } catch (err) {
      setBookErr(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  function eventsForHour(hour: number) {
    if (!avail) return [];
    const items: { label: string; kind: string }[] = [];
    const hourStart = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).getTime();
    const hourEnd = hourStart + 3600_000;
    const covers = (s: string, e: string) =>
      new Date(s).getTime() < hourEnd && new Date(e).getTime() > hourStart;
    avail.maintenanceBlocks.forEach((m) => {
      if (covers(m.startTime, m.endTime)) items.push({ label: `Maintenance: ${m.reason}`, kind: 'maintenance' });
    });
    avail.bookings.forEach((b) => {
      if (covers(b.startTime, b.endTime)) items.push({ label: `Booking (${b.status})`, kind: b.status });
    });
    return items;
  }

  if (error) return <div className="error">{error}</div>;
  if (!space) return <p className="muted">Loading…</p>;

  return (
    <div>
      <button className="btn-ghost btn-sm" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="between" style={{ marginTop: 12 }}>
        <div>
          <h1 className="title">{space.name}</h1>
          <p className="subtitle">
            {space.type.replace('_', ' ')} · capacity {space.capacity}
          </p>
        </div>
      </div>
      <p>{space.description}</p>
      <div className="amenities" style={{ marginBottom: 24 }}>
        {space.amenities.map((a) => (
          <span key={a} className="chip">
            {a}
          </span>
        ))}
      </div>

      <div className="between" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Availability</h3>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 'auto' }} />
      </div>

      <div className="calendar">
        {HOURS.map((h) => {
          const events = eventsForHour(h);
          return (
            <div className="cal-row" key={h}>
              <div className="cal-hour">{String(h).padStart(2, '0')}:00</div>
              <div className="cal-slot">
                {events.map((ev, i) => (
                  <div key={i} className={`cal-event ${ev.kind}`}>
                    {ev.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={{ marginTop: 28 }}>Book this space</h3>
      {!user && <p className="muted">Please log in as a member to book.</p>}
      {user?.role === 'admin' && <p className="muted">Admins manage bookings; log in as a member to book.</p>}
      {user?.role === 'member' && (
        <form onSubmit={book} className="card" style={{ maxWidth: 460 }}>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Start</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="field">
              <label>End</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          {bookErr && <div className="error">{bookErr}</div>}
          {bookMsg && <div className="success">{bookMsg}</div>}
          <button type="submit" disabled={busy}>
            {busy ? 'Requesting…' : 'Request booking'}
          </button>
        </form>
      )}
    </div>
  );
}
