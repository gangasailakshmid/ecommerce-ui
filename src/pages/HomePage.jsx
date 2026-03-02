import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <section className="page home-hero-layout">
      <article className="hero-page">
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
      </article>
      <aside className="home-visual" aria-hidden="true">
        <img src="/product-images/1234001.svg" alt="" className="home-img home-img-main" />
        <img src="/product-images/1234005.svg" alt="" className="home-img home-img-top" />
        <img src="/product-images/1234010.svg" alt="" className="home-img home-img-bottom" />
      </aside>
      <div className="home-ambient-shape" aria-hidden="true" />
      <div className="home-ambient-shape home-ambient-shape-2" aria-hidden="true" />
    </section>
  );
}
