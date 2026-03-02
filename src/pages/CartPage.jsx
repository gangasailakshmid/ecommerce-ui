import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QuantityStepper } from "../components/QuantityStepper";
import {
  clearCart,
  removeFromCart,
  updateCartQuantity,
} from "../features/cart/cartSlice";
import {
  createShippingForOrders,
  getCoupons,
  getStateTaxes,
  placeOrdersFromCart,
  validateCoupon,
} from "../services/orderApi";
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
  const [couponState, setCouponState] = useState({
    list: [],
    loading: true,
    error: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupons, setAppliedCoupons] = useState([]);
  const [couponMessage, setCouponMessage] = useState({ status: "idle", text: "" });
  const [taxState, setTaxState] = useState({
    list: [],
    loading: true,
    error: "",
  });
  const [shipping, setShipping] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA",
  });

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.product.price);
    if (Number.isNaN(price)) {
      return sum;
    }
    return sum + price * item.quantity;
  }, 0);
  const discountRate = useMemo(() => {
    const combined = appliedCoupons.reduce(
      (sum, coupon) => sum + Number(coupon?.discountPercentage || 0),
      0
    );
    return Math.min(combined, 100) / 100;
  }, [appliedCoupons]);
  const discountAmount = subtotal * discountRate;
  const taxableTotal = Math.max(0, subtotal - discountAmount);
  const matchedTax = useMemo(() => {
    const shippingState = shipping.state.trim().toUpperCase();
    if (!shippingState) {
      return null;
    }
    return taxState.list.find((item) => item.stateCode?.toUpperCase() === shippingState) || null;
  }, [shipping.state, taxState.list]);
  const taxRate = Number(matchedTax?.taxPercentage || 0) / 100;
  const taxAmount = taxableTotal * taxRate;
  const grandTotal = taxableTotal + taxAmount;

  useEffect(() => {
    let active = true;
    async function loadCoupons() {
      setCouponState((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const coupons = await getCoupons();
        if (!active) {
          return;
        }
        setCouponState({
          list: Array.isArray(coupons) ? coupons : [],
          loading: false,
          error: "",
        });
      } catch (error) {
        if (!active) {
          return;
        }
        setCouponState({
          list: [],
          loading: false,
          error: error.message || "Failed to load coupons.",
        });
      }
    }
    loadCoupons();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadStateTaxes() {
      setTaxState((prev) => ({ ...prev, loading: true, error: "" }));
      try {
        const taxes = await getStateTaxes();
        if (!active) {
          return;
        }
        setTaxState({
          list: Array.isArray(taxes) ? taxes : [],
          loading: false,
          error: "",
        });
      } catch (error) {
        if (!active) {
          return;
        }
        setTaxState({
          list: [],
          loading: false,
          error: error.message || "Failed to load tax rates.",
        });
      }
    }
    loadStateTaxes();
    return () => {
      active = false;
    };
  }, []);

  const applyValidatedCoupon = (validated) => {
    const nextCode = String(validated.couponCode || "").toUpperCase();
    const alreadyApplied = appliedCoupons.some(
      (coupon) => String(coupon.couponCode || "").toUpperCase() === nextCode
    );
    if (alreadyApplied) {
      setCouponMessage({
        status: "success",
        text: `${nextCode} is already applied.`,
      });
      return;
    }

    if (appliedCoupons.length === 0) {
      setAppliedCoupons([validated]);
      setCouponMessage({
        status: "success",
        text: `Coupon applied: ${nextCode}`,
      });
      return;
    }

    if (appliedCoupons.length === 1) {
      const existing = appliedCoupons[0];
      const canCombine = Boolean(existing?.combinable) && Boolean(validated?.combinable);
      if (canCombine) {
        setAppliedCoupons([existing, validated]);
        setCouponMessage({
          status: "success",
          text: `Coupons combined: ${existing.couponCode} + ${nextCode}`,
        });
      } else {
        setAppliedCoupons([validated]);
        setCouponMessage({
          status: "success",
          text: `Coupon replaced: ${nextCode}`,
        });
      }
      return;
    }

    setAppliedCoupons([validated]);
    setCouponMessage({
      status: "success",
      text: `Max two coupons allowed. Replaced with ${nextCode}.`,
    });
  };

  const handleApplyCoupon = async () => {
    setCouponMessage({ status: "loading", text: "" });
    try {
      const validated = await validateCoupon(couponCode);
      if (!validated.valid) {
        setCouponMessage({
          status: "failed",
          text: validated.message || "Coupon is not valid.",
        });
        return;
      }
      setCouponCode(validated.couponCode || couponCode.trim().toUpperCase());
      applyValidatedCoupon(validated);
    } catch (error) {
      setCouponMessage({
        status: "failed",
        text: error.message || "Coupon validation failed.",
      });
    }
  };

  const handleQuickApplyCoupon = async (couponCodeToApply) => {
    setCouponMessage({ status: "loading", text: "" });
    setCouponCode(couponCodeToApply);
    try {
      const validated = await validateCoupon(couponCodeToApply);
      if (!validated.valid) {
        setCouponMessage({
          status: "failed",
          text: validated.message || "Coupon is not valid.",
        });
        return;
      }
      applyValidatedCoupon(validated);
    } catch (error) {
      setCouponMessage({
        status: "failed",
        text: error.message || "Coupon validation failed.",
      });
    }
  };

  const handleClearCoupon = () => {
    setCouponCode("");
    setAppliedCoupons([]);
    setCouponMessage({ status: "idle", text: "" });
  };

  const handleCheckout = async () => {
    if (
      !shipping.addressLine1.trim() ||
      !shipping.city.trim() ||
      !shipping.state.trim() ||
      !shipping.postalCode.trim() ||
      !shipping.country.trim()
    ) {
      setCheckoutState({
        status: "failed",
        message: "Enter shipping address details before checkout.",
      });
      return;
    }
    setCheckoutState({ status: "loading", message: "" });
    try {
      const createdOrders = await placeOrdersFromCart(cartItems, {
        profileId: profile?.id,
        customerCode: profile?.customerCode,
      });
      try {
        await createShippingForOrders(createdOrders, {
          ...shipping,
          state: shipping.state.trim().toUpperCase(),
        });
      } catch (shippingError) {
        console.error(shippingError);
      }
      dispatch(clearCart());
      setAppliedCoupons([]);
      setCouponCode("");
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
      <div className="cart-page-layout">
        <div>
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
                      className="danger icon-danger-btn"
                      aria-label={`Remove ${item.product.description || "item"} from cart`}
                      title="Remove item"
                      onClick={() => dispatch(removeFromCart(item.product.productCode))}
                    >
                      <svg
                        className="trash-icon"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-hidden="true"
                      >
                        <path
                          d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9zm-1 12h12l1-14H5l1 14z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="cart-summary-card">
            <p className="subtotal">
              <strong>Actual Total:</strong> ${subtotal.toFixed(2)}
            </p>
            <p className="subtotal coupon-discount-row">
              <strong>Coupon Discount:</strong> -${discountAmount.toFixed(2)}
            </p>
            <p className="subtotal">
              <strong>Tax {matchedTax ? `(${matchedTax.stateCode})` : ""}:</strong> +$
              {taxAmount.toFixed(2)}
            </p>
            <p className="subtotal grand-total">
              <strong>
                Grand Total
                {matchedTax
                  ? ` (incl. ${matchedTax.stateCode} tax ${matchedTax.taxPercentage}%)`
                  : ""}
                :
              </strong>{" "}
              ${grandTotal.toFixed(2)}
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
          </div>
        </div>

        <aside className="coupon-panel">
          <div className="coupon-card">
            <h2>Coupons</h2>
            <p className="muted-copy">Apply a coupon code and save instantly.</p>

            <div className="coupon-apply-row">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponMessage.status === "loading"}
              >
                {couponMessage.status === "loading" ? "Checking..." : "Apply"}
              </button>
              <button className="secondary coupon-clear-btn" onClick={handleClearCoupon}>
                Clear
              </button>
            </div>

            {couponMessage.status === "success" && (
              <p className="success-msg coupon-msg">{couponMessage.text}</p>
            )}
            {couponMessage.status === "failed" && (
              <p className="error coupon-msg">{couponMessage.text}</p>
            )}

            {appliedCoupons.length > 0 && (
              <p className="applied-coupon">
                Applied:{" "}
                <strong>
                  {appliedCoupons
                    .map(
                      (coupon) =>
                        `${coupon.couponCode} (${Number(coupon.discountPercentage || 0)}%)`
                    )
                    .join(" + ")}
                </strong>
              </p>
            )}

            <div className="coupon-table-wrap">
              {couponState.loading ? (
                <p className="muted-copy">Loading coupons...</p>
              ) : couponState.error ? (
                <p className="error">{couponState.error}</p>
              ) : (
                <table className="coupon-table">
                  <thead>
                    <tr>
                      <th>Coupon</th>
                      <th>Discount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponState.list.map((coupon) => (
                      <tr key={coupon.couponCode} className="coupon-row">
                        <td>{coupon.couponCode}</td>
                        <td>{Number(coupon.discountPercentage || 0)}%</td>
                        <td>
                          <button
                            className="coupon-quick-apply"
                            onClick={() => handleQuickApplyCoupon(coupon.couponCode)}
                            disabled={couponMessage.status === "loading"}
                          >
                            Quick Apply
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <h3 className="shipping-title">Shipping</h3>
            <div className="shipping-grid">
              <input
                type="text"
                placeholder="Address Line 1"
                value={shipping.addressLine1}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, addressLine1: event.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Address Line 2"
                value={shipping.addressLine2}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, addressLine2: event.target.value }))
                }
              />
              <input
                type="text"
                placeholder="City"
                value={shipping.city}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, city: event.target.value }))
                }
              />
              <select
                value={shipping.state}
                onChange={(event) =>
                  setShipping((prev) => ({
                    ...prev,
                    state: event.target.value.toUpperCase(),
                  }))
                }
                disabled={taxState.loading}
              >
                <option value="">
                  {taxState.loading ? "Loading states..." : "Select State"}
                </option>
                {taxState.list.map((tax) => (
                  <option key={tax.stateCode} value={tax.stateCode}>
                    {tax.stateCode} - {tax.stateName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Postal Code"
                value={shipping.postalCode}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, postalCode: event.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Country"
                value={shipping.country}
                onChange={(event) =>
                  setShipping((prev) => ({ ...prev, country: event.target.value }))
                }
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
