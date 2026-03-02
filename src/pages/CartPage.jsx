import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QuantityStepper } from "../components/QuantityStepper";
import {
  clearCart,
  removeFromCart,
  updateCartQuantity,
} from "../features/cart/cartSlice";
import { placeOrdersFromCart } from "../services/orderApi";
import { isNewArrival } from "../utils/productFlags";
import { getProductImageUrl, getStyleInitials } from "../utils/productMedia";

function formatPrice(price) {
  if (price == null) {
    return "N/A";
  }
  return `$${Number(price).toFixed(2)}`;
}

export function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  const profile = useSelector((state) => state.auth.profile);
  const [checkoutState, setCheckoutState] = useState({
    status: "idle",
    message: "",
  });

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.product.price);
    if (Number.isNaN(price)) {
      return sum;
    }
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    setCheckoutState({ status: "loading", message: "" });
    try {
      const createdOrders = await placeOrdersFromCart(cartItems, {
        profileId: profile?.id,
        customerCode: profile?.customerCode,
      });
      dispatch(clearCart());
      navigate("/order-confirmation", {
        state: { orders: createdOrders },
      });
    } catch (error) {
      setCheckoutState({
        status: "failed",
        message: error.message || "Checkout failed. Please try again.",
      });
    }
  };

  if (cartItems.length === 0) {
    return (
      <section className="page">
        <h1>Cart</h1>
        <p>Your cart is empty.</p>
        <Link className="button" to="/products">
          Browse Products
        </Link>
      </section>
    );
  }

  return (
    <section className="page">
      <h1>Cart</h1>
      <div className="cart-list">
        {cartItems.map((item) => {
          const imageUrl = getProductImageUrl(item.product);
          return (
            <article key={item.product.productCode} className="cart-item">
              <div className="media-shell cart-media-shell">
                {isNewArrival(item.product.inStoreDate) && (
                  <p className="arrival-ribbon">New Arrival</p>
                )}
                {imageUrl ? (
                  <img
                    className="cart-thumb"
                    src={imageUrl}
                    alt={item.product.description || "Product image"}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      const shell = event.currentTarget.parentElement;
                      const fallback = shell?.querySelector(".cart-thumb-fallback");
                      if (fallback) {
                        fallback.style.display = "grid";
                      }
                    }}
                  />
                ) : null}
                <div
                  className="cart-thumb cart-thumb-fallback"
                  style={{ display: imageUrl ? "none" : "grid" }}
                  aria-hidden="true"
                >
                  <span>{getStyleInitials(item.product.styleName)}</span>
                </div>
              </div>
              <div>
                <h2>{item.product.description}</h2>
                <p>{item.product.styleName || "N/A"}</p>
                <p>
                  <strong>Unit Price:</strong> {formatPrice(item.product.price)}
                </p>
              </div>
              <div className="actions">
                <div className="qty-group">
                  <span className="qty-label">Qty</span>
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(next) =>
                      dispatch(
                        updateCartQuantity({
                          productCode: item.product.productCode,
                          quantity: next,
                        })
                      )
                    }
                  />
                </div>
                <button
                  className="danger"
                  onClick={() => dispatch(removeFromCart(item.product.productCode))}
                >
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="subtotal">
        <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
      </p>
      <div className="checkout-actions">
        <button
          className="checkout-button"
          onClick={handleCheckout}
          disabled={checkoutState.status === "loading" || !profile}
        >
          {checkoutState.status === "loading" ? "Placing Order..." : "Checkout"}
        </button>
        {!profile && (
          <p className="muted-copy">
            Please <Link to="/signin">sign in</Link> to continue checkout.
          </p>
        )}
      </div>
      {checkoutState.status === "success" && (
        <p className="success-msg">{checkoutState.message}</p>
      )}
      {checkoutState.status === "failed" && (
        <p className="error">{checkoutState.message}</p>
      )}
    </section>
  );
}
