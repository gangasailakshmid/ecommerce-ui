import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { addToCart } from "../features/cart/cartSlice";
import { getProducts } from "../features/products/productsSlice";
import { QuantityStepper } from "../components/QuantityStepper";
import { isNewArrival } from "../utils/productFlags";
import { getProductImageUrl, getStyleInitials } from "../utils/productMedia";

function formatPrice(price) {
  if (price == null) {
    return "Price unavailable";
  }
  return `$${Number(price).toFixed(2)}`;
}

export function ProductListPage() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((state) => state.products);
  const cartItems = useSelector((state) => state.cart.items);
  const [quantities, setQuantities] = useState({});
  const [filterText, setFilterText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [quickLookProduct, setQuickLookProduct] = useState(null);
  const [quickLookQuantity, setQuickLookQuantity] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (status === "idle") {
      dispatch(getProducts());
    }
  }, [dispatch, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterText]);

  const handleQuantityChange = (productCode, value) => {
    setQuantities((prev) => ({ ...prev, [productCode]: Number(value) || 1 }));
  };

  const handleAddToCart = (product) => {
    const quantity = quantities[product.productCode] || 1;
    dispatch(addToCart({ product, quantity }));
  };

  const openQuickLook = (product) => {
    setQuickLookProduct(product);
    setQuickLookQuantity(1);
  };

  const updateQuickLookQuantity = (nextValue) => {
    const numeric = Number(nextValue);
    if (Number.isNaN(numeric) || numeric < 1) {
      setQuickLookQuantity(1);
      return;
    }
    setQuickLookQuantity(Math.trunc(numeric));
  };

  if (status === "loading") {
    return <p>Loading products...</p>;
  }

  if (status === "failed") {
    return <p className="error">Failed to load products: {error}</p>;
  }

  const normalizedFilter = filterText.trim().toLowerCase();
  const filteredItems = items.filter((product) => {
    if (!normalizedFilter) {
      return true;
    }

    return (
      product.description?.toLowerCase().includes(normalizedFilter) ||
      product.styleName?.toLowerCase().includes(normalizedFilter) ||
      product.styleCode?.toLowerCase().includes(normalizedFilter)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  return (
    <section className="page">
      <div className="page-header">
        <h1>Product List</h1>
        <label className="filter-control">
          Filter
          <input
            type="text"
            placeholder="Search by product or style..."
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
          />
        </label>
      </div>
      <div className="product-grid">
        {paginatedItems.map((product) => {
          const imageUrl = getProductImageUrl(product);
          return (
            <article className="product-card" key={product.productCode}>
              <div className="media-shell">
                {isNewArrival(product.inStoreDate) && (
                  <p className="arrival-ribbon">New Arrival</p>
                )}
                <button
                  className="quick-look-trigger"
                  onClick={() => openQuickLook(product)}
                  aria-label={`Quick look ${product.description}`}
                >
                  Quick Look
                </button>
                {imageUrl ? (
                  <img
                    className="product-media product-image"
                    src={imageUrl}
                    alt={product.description || "Product image"}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      const shell = event.currentTarget.parentElement;
                      const fallback = shell?.querySelector(".product-media-fallback");
                      if (fallback) {
                        fallback.style.display = "grid";
                      }
                    }}
                  />
                ) : null}
                <div
                  className="product-media product-media-fallback"
                  style={{ display: imageUrl ? "none" : "grid" }}
                  aria-hidden="true"
                >
                  <span>{getStyleInitials(product.styleName)}</span>
                </div>
              </div>
              <div className="product-content">
                <p className="product-style">Style: {product.styleName || "N/A"}</p>
                <h2>{product.description}</h2>
                <p className="price">{formatPrice(product.price)}</p>
                <div className="actions product-card-actions">
                  <div className="qty-group">
                    <QuantityStepper
                      value={quantities[product.productCode] || 1}
                      onChange={(next) =>
                        handleQuantityChange(product.productCode, next)
                      }
                    />
                  </div>
                  <button onClick={() => handleAddToCart(product)}>Add to Cart</button>
                </div>
                <Link className="link" to={`/products/${product.productCode}`}>
                  View Details
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {filteredItems.length === 0 && <p>No products match your filter.</p>}
      {filteredItems.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safeCurrentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {safeCurrentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={safeCurrentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
      {quickLookProduct && (
        <div
          className="quick-look-overlay"
          onClick={() => setQuickLookProduct(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuickLookProduct(null);
            }
          }}
        >
          <article
            className="quick-look-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="quick-look-close"
              onClick={() => setQuickLookProduct(null)}
            >
              Close
            </button>
            <p className="product-style">
              Style: {quickLookProduct.styleName || "N/A"}
            </p>
            <h2>{quickLookProduct.description}</h2>
            <p className="price">{formatPrice(quickLookProduct.price)}</p>
            <p className="muted-copy">
              A quick summary view. Open full details for complete information.
            </p>
            <div className="quick-look-actions">
              <QuantityStepper
                value={quickLookQuantity}
                onChange={(next) => updateQuickLookQuantity(next)}
              />
              <button
                type="button"
                onClick={() => {
                  dispatch(
                    addToCart({ product: quickLookProduct, quantity: quickLookQuantity })
                  );
                }}
              >
                Add to Cart
              </button>
              <Link
                className="link quick-look-link"
                to={`/products/${quickLookProduct.productCode}`}
                onClick={() => setQuickLookProduct(null)}
              >
                Go To Details
              </Link>
              {cartItems.length > 0 && (
                <div className="quick-look-secondary-actions">
                  <Link
                    className="button secondary"
                    to="/cart"
                    onClick={() => setQuickLookProduct(null)}
                  >
                    View Cart
                  </Link>
                  <Link
                    className="button"
                    to="/cart"
                    onClick={() => setQuickLookProduct(null)}
                  >
                    Quick Checkout
                  </Link>
                </div>
              )}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
