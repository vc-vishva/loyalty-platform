import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiError } from '../api/client';
import type { Paginated, Space, SpaceType } from '../types';

export default function SpacesPage() {
  const [data, setData] = useState<Paginated<Space> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [type, setType] = useState<'' | SpaceType>('');
  const [capacity, setCapacity] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: 9 };
      if (search) params.search = search;
      if (type) params.type = type;
      if (capacity) params.capacity = Number(capacity);
      if (date) params.date = date;
      const res = await api.get('/spaces', { params });
      setData(res.data.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <div>
      <h1 className="title">Find a space</h1>
      <p className="subtitle">Browse desks and meeting rooms, then check availability.</p>

      <form className="toolbar" onSubmit={applyFilters}>
        <div className="field">
          <label>Search</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name…" />
        </div>
        <div className="field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as SpaceType | '')}>
            <option value="">Any</option>
            <option value="desk">Desk</option>
            <option value="meeting_room">Meeting room</option>
          </select>
        </div>
        <div className="field">
          <label>Min capacity</label>
          <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
        <div className="field">
          <label>Available on</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button type="submit">Filter</button>
      </form>

      {loading && <p className="muted">Loading…</p>}
      {error && <div className="error">{error}</div>}

      {data && !loading && (
        <>
          {data.results.length === 0 ? (
            <p className="muted">No spaces match your filters.</p>
          ) : (
            <div className="grid">
              {data.results.map((s) => (
                <Link key={s.id} to={`/spaces/${s.id}`} className="card" style={{ display: 'block' }}>
                  <div className="between">
                    <h3>{s.name}</h3>
                    <span className="chip">{s.capacity} ppl</span>
                  </div>
                  <div className="type">{s.type.replace('_', ' ')}</div>
                  <p className="muted" style={{ fontSize: 14 }}>
                    {s.description}
                  </p>
                  <div className="amenities">
                    {s.amenities.map((a) => (
                      <span key={a} className="chip">
                        {a}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="pagination">
            <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <span className="muted">
              Page {data.page} of {Math.max(1, data.totalPages)} · {data.totalResults} spaces
            </span>
            <button
              className="btn-ghost btn-sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
