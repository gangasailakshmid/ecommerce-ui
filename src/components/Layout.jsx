import { Link, NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { logout } from "../features/auth/authSlice";

export function Layout({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const cartItems = useSelector((state) => state.cart.items);
  const profile = useSelector((state) => state.auth.profile);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef(null);
  const displayName = profile?.fullName || profile?.email || "Profile";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <header className="header">
        <Link to="/" className="logo">
          Ecommerce Portal
        </Link>
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileNavOpen((prev) => !prev)}
          aria-expanded={mobileNavOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileNavOpen ? "Close" : "Menu"}
        </button>
        <nav className={`nav ${mobileNavOpen ? "nav-open" : ""}`}>
          <NavLink to="/" className="nav-link">
            Home
          </NavLink>
          <NavLink to="/products" className="nav-link">
            Products
          </NavLink>
          <NavLink to="/cart" className="nav-link cart-link">
            Cart <span className="cart-count">{totalItems}</span>
          </NavLink>
          {profile ? (
            <div className="profile-menu" ref={menuRef}>
              <button
                className="user-chip"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="user-avatar" aria-hidden="true">
                  {initials || "U"}
                </span>
                <span>{displayName}</span>
              </button>
              {menuOpen && (
                <div className="profile-dropdown" role="menu">
                  <NavLink
                    to="/profile/orders"
                    className="dropdown-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Orders
                  </NavLink>
                  <NavLink
                    to="/profile/settings"
                    className="dropdown-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </NavLink>
                  <button
                    className="dropdown-item dropdown-logout"
                    onClick={() => {
                      dispatch(logout());
                      setMenuOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/signin" className="nav-link">
                Sign In
              </NavLink>
              <NavLink to="/signup" className="nav-link">
                Sign Up
              </NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
