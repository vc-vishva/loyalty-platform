import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="nav">
      <NavLink to="/" className="brand">
        Co<span>work</span>
      </NavLink>
      <NavLink to="/" end>
        Spaces
      </NavLink>
      {user?.role === 'member' && <NavLink to="/my-bookings">My Bookings</NavLink>}
      {user?.role === 'admin' && <NavLink to="/admin/spaces">Manage Spaces</NavLink>}
      {user?.role === 'admin' && <NavLink to="/admin/bookings">Booking Queue</NavLink>}
      <span className="spacer" />
      {user ? (
        <>
          <span className="pill">
            {user.name} · {user.role}
          </span>
          <button className="linklike" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </>
      )}
    </nav>
  );
}
