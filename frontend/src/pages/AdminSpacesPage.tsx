import { FormEvent, useEffect, useState } from 'react';
import api, { apiError } from '../api/client';
import type { Space, SpaceType } from '../types';

interface SpaceForm {
  id?: string;
  name: string;
  type: SpaceType;
  capacity: number;
  description: string;
  amenities: string;
}

const empty: SpaceForm = { name: '', type: 'desk', capacity: 1, description: '', amenities: '' };

export default function AdminSpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState<SpaceForm | null>(null);
  const [maint, setMaint] = useState<{ spaceId: string; startTime: string; endTime: string; reason: string } | null>(
    null
  );
  const [modalErr, setModalErr] = useState('');

  async function load() {
    try {
      const res = await api.get('/spaces', { params: { limit: 100 } });
      setSpaces(res.data.data.results);
    } catch (err) {
      setError(apiError(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setModalErr('');
    setForm({ ...empty });
  }
  function openEdit(s: Space) {
    setModalErr('');
    setForm({
      id: s.id,
      name: s.name,
      type: s.type,
      capacity: s.capacity,
      description: s.description,
      amenities: s.amenities.join(', '),
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setModalErr('');
    const payload = {
      name: form.name,
      type: form.type,
      capacity: Number(form.capacity),
      description: form.description,
      amenities: form.amenities
        ? form.amenities.split(',').map((a) => a.trim()).filter(Boolean)
        : [],
    };
    try {
      if (form.id) await api.put(`/spaces/${form.id}`, payload);
      else await api.post('/spaces', payload);
      setForm(null);
      await load();
    } catch (err) {
      setModalErr(apiError(err));
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this space? This removes its bookings too.')) return;
    try {
      await api.delete(`/spaces/${id}`);
      await load();
    } catch (err) {
      alert(apiError(err));
    }
  }

  async function saveMaint(e: FormEvent) {
    e.preventDefault();
    if (!maint) return;
    setModalErr('');
    try {
      await api.post(`/spaces/${maint.spaceId}/maintenance`, {
        startTime: new Date(maint.startTime).toISOString(),
        endTime: new Date(maint.endTime).toISOString(),
        reason: maint.reason,
      });
      setMaint(null);
    } catch (err) {
      setModalErr(apiError(err));
    }
  }

  return (
    <div>
      <div className="between">
        <div>
          <h1 className="title">Manage spaces</h1>
          <p className="subtitle">Create, edit, delete spaces and block maintenance windows.</p>
        </div>
        <button onClick={openCreate}>+ New space</button>
      </div>
      {error && <div className="error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Amenities</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {spaces.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.type.replace('_', ' ')}</td>
                <td>{s.capacity}</td>
                <td className="muted">{s.amenities.join(', ')}</td>
                <td>
                  <div className="row">
                    <button className="btn-ghost btn-sm" onClick={() => openEdit(s)}>
                      Edit
                    </button>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() =>
                        setMaint({ spaceId: s.id, startTime: '', endTime: '', reason: '' })
                      }
                    >
                      Maintenance
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => remove(s.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="modal-backdrop" onClick={() => setForm(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h3>{form.id ? 'Edit space' : 'New space'}</h3>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SpaceType })}>
                  <option value="desk">Desk</option>
                  <option value="meeting_room">Meeting room</option>
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Amenities (comma-separated)</label>
              <input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
            </div>
            {modalErr && <div className="error">{modalErr}</div>}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>
                Cancel
              </button>
              <button type="submit">Save</button>
            </div>
          </form>
        </div>
      )}

      {maint && (
        <div className="modal-backdrop" onClick={() => setMaint(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={saveMaint}>
            <h3>Block maintenance window</h3>
            <div className="field">
              <label>Start</label>
              <input
                type="datetime-local"
                value={maint.startTime}
                onChange={(e) => setMaint({ ...maint, startTime: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>End</label>
              <input
                type="datetime-local"
                value={maint.endTime}
                onChange={(e) => setMaint({ ...maint, endTime: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Reason</label>
              <input value={maint.reason} onChange={(e) => setMaint({ ...maint, reason: e.target.value })} required />
            </div>
            {modalErr && <div className="error">{modalErr}</div>}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn-ghost" onClick={() => setMaint(null)}>
                Cancel
              </button>
              <button type="submit">Block</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
