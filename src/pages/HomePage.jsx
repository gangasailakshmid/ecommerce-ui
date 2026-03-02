import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <section className="page hero-page">
      <p className="eyebrow">Spring Collection 2026</p>
      <h1>Welcome to Ecommerce Portal</h1>
      <p className="hero-copy">
        Browse curated products from the catalog, check details, and build your
        cart in a clean shopping flow.
      </p>
      <div className="actions home-actions">
        <Link className="button" to="/products">
          Shop Products
        </Link>
        <Link className="button secondary" to="/cart">
          View Cart
        </Link>
      </div>
    </section>
  );
}
