import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { QuantityStepper } from "../components/QuantityStepper";
import { addToCart } from "../features/cart/cartSlice";
import {
  getProductDetails,
  getProducts,
} from "../features/products/productsSlice";
import { isNewArrival } from "../utils/productFlags";
import { getProductImageUrl, getStyleInitials } from "../utils/productMedia";

function formatPrice(price) {
  if (price == null) {
    return "Price unavailable";
  }
  return `$${Number(price).toFixed(2)}`;
}

function getDescriptionSimilarityScore(baseDescription, candidateDescription) {
  if (!baseDescription || !candidateDescription) {
    return 0;
  }

  const baseTerms = new Set(baseDescription.toLowerCase().split(/\s+/).filter(Boolean));
  const candidateTerms = candidateDescription.toLowerCase().split(/\s+/).filter(Boolean);
  return candidateTerms.reduce(
    (score, term) => score + (baseTerms.has(term) ? 1 : 0),
    0
  );
}

export function ProductDetailsPage() {
  const { productCode } = useParams();
  const dispatch = useDispatch();
  const { items, status, selectedProduct, detailsStatus, error } = useSelector((state) => state.products);
  const cartItems = useSelector((state) => state.cart.items);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(getProductDetails(productCode));
  }, [dispatch, productCode]);

  useEffect(() => {
    if (status === "idle") {
      dispatch(getProducts());
    }
  }, [dispatch, status]);

  const handleAddToCart = () => {
    if (!selectedProduct) {
      return;
    }
    dispatch(addToCart({ product: selectedProduct, quantity }));
  };

  if (detailsStatus === "loading") {
    return <p>Loading product details...</p>;
  }

  if (detailsStatus === "failed") {
    return <p className="error">Failed to load product details: {error}</p>;
  }

  if (!selectedProduct) {
    return <p>No product found.</p>;
  }

  const imageUrl = getProductImageUrl(selectedProduct);
  const cartSubtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.product.price);
    if (Number.isNaN(price)) {
      return sum;
    }
    return sum + price * item.quantity;
  }, 0);
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const relatedProducts = items
    .filter((product) => product.productCode !== selectedProduct.productCode)
    .map((product) => {
      const styleMatch =
        product.styleId && selectedProduct.styleId
          ? product.styleId === selectedProduct.styleId
          : product.styleName === selectedProduct.styleName;
      const score =
        (styleMatch ? 100 : 0) +
        getDescriptionSimilarityScore(
          selectedProduct.description,
          product.description
        );
      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((entry) => entry.product);

  return (
    <section className="page">
      <h1>Product Details</h1>
      <div className="details-layout">
        <article className="detail-card detail-main">
          <div className="media-shell detail-media-shell">
            {isNewArrival(selectedProduct.inStoreDate) && (
              <p className="arrival-ribbon">New Arrival</p>
            )}
            {imageUrl ? (
              <img
                className="detail-image"
                src={imageUrl}
                alt={selectedProduct.description || "Product image"}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  const shell = event.currentTarget.parentElement;
                  const fallback = shell?.querySelector(".detail-image-fallback");
                  if (fallback) {
                    fallback.style.display = "grid";
                  }
                }}
              />
            ) : null}
            <div
              className="detail-image detail-image-fallback"
              style={{ display: imageUrl ? "none" : "grid" }}
              aria-hidden="true"
            >
              <span>{getStyleInitials(selectedProduct.styleName)}</span>
            </div>
          </div>
          <h2>{selectedProduct.description}</h2>
          <p>
            <strong>Style:</strong> {selectedProduct.styleName || "N/A"}
          </p>
          <p className="price">{formatPrice(selectedProduct.price)}</p>
          <div className="actions">
            <div className="qty-group">
              <span className="qty-label">Qty</span>
              <QuantityStepper value={quantity} onChange={(next) => setQuantity(next)} />
            </div>
            <button onClick={handleAddToCart}>Add to Cart</button>
          </div>
          <Link className="link" to="/products">
            Back to Product List
          </Link>
        </article>

        <aside className="detail-card quick-cart-panel">
          <h2>Quick Checkout</h2>
          <p>
            <strong>Items:</strong> {cartItemsCount}
          </p>
          <p className="price">${cartSubtotal.toFixed(2)}</p>
          {cartItems.length === 0 ? (
            <p className="muted-copy">Your cart is empty. Add this product to continue.</p>
          ) : (
            <div className="quick-cart-items">
              {cartItems.slice(0, 3).map((item) => (
                <p key={item.product.productCode} className="quick-cart-line">
                  {item.quantity} x {item.product.description}
                </p>
              ))}
              {cartItems.length > 3 && (
                <p className="quick-cart-line">+{cartItems.length - 3} more items</p>
              )}
            </div>
          )}
          <Link className="button" to="/cart">
            Go to Cart Checkout
          </Link>
        </aside>
      </div>
      {relatedProducts.length > 0 && (
        <section className="related-section">
          <h2>Related Products</h2>
          <div className="related-scroller">
            {relatedProducts.map((product) => {
              const relatedImageUrl = getProductImageUrl(product);
              return (
                <article key={product.productCode} className="related-card">
                  <div className="media-shell related-media-shell">
                    {isNewArrival(product.inStoreDate) && (
                      <p className="arrival-ribbon">New Arrival</p>
                    )}
                    {relatedImageUrl ? (
                      <img
                        className="related-image"
                        src={relatedImageUrl}
                        alt={product.description || "Related product image"}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          const shell = event.currentTarget.parentElement;
                          const fallback = shell?.querySelector(
                            ".related-image-fallback"
                          );
                          if (fallback) {
                            fallback.style.display = "grid";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="related-image related-image-fallback"
                      style={{ display: relatedImageUrl ? "none" : "grid" }}
                      aria-hidden="true"
                    >
                      <span>{getStyleInitials(product.styleName)}</span>
                    </div>
                  </div>
                  <p className="product-style">{product.styleName || "N/A"}</p>
                  <h3>{product.description}</h3>
                  <p className="price">{formatPrice(product.price)}</p>
                  <button
                    className="related-quick-add"
                    onClick={() => dispatch(addToCart({ product, quantity: 1 }))}
                  >
                    Quick Add to Cart
                  </button>
                  <Link className="link" to={`/products/${product.productCode}`}>
                    View Product
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
