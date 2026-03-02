import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getOrdersForProfile } from "../services/orderApi";

function formatCurrency(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "N/A";
  }
  return `$${numeric.toFixed(2)}`;
}

function formatOrderDate(value) {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleDateString();
}

export function ProfileOrdersPage() {
  const profile = useSelector((state) => state.auth.profile);
  const [state, setState] = useState({
    status: "idle",
    orders: [],
    error: "",
  });

  useEffect(() => {
    if (!profile) {
      return;
    }
    let mounted = true;
    const loadOrders = async () => {
      setState((prev) => ({ ...prev, status: "loading", error: "" }));
      try {
        const orders = await getOrdersForProfile({
          profileId: profile.id,
          customerCode: profile.customerCode,
        });
        if (mounted) {
          setState({ status: "success", orders, error: "" });
        }
      } catch (error) {
        if (mounted) {
          setState({
            status: "failed",
            orders: [],
            error: error.message || "Unable to load orders.",
          });
        }
      }
    };
    loadOrders();
    return () => {
      mounted = false;
    };
  }, [profile]);

  if (!profile) {
    return (
      <section className="page">
        <h1>My Orders</h1>
        <p>
          Please <Link to="/signin">sign in</Link> to view your order history.
        </p>
      </section>
    );
  }

  return (
    <section className="page profile-shell">
      <div className="profile-hero">
        <h1>My Orders</h1>
        <p className="muted-copy">
          Track recent purchases and review quantities, status, and totals.
        </p>
        {state.status === "success" && (
          <div className="orders-stats">
            <p className="stat-chip">Orders: {state.orders.length}</p>
            <p className="stat-chip">
              Total Spend:{" "}
              {formatCurrency(
                state.orders.reduce(
                  (sum, order) => sum + Number(order.unitPrice || 0) * Number(order.quantity || 0),
                  0
                )
              )}
            </p>
          </div>
        )}
      </div>
      {state.status === "loading" && <p>Loading orders...</p>}
      {state.status === "failed" && <p className="error">{state.error}</p>}
      {state.status === "success" && state.orders.length === 0 && (
        <p>No orders found for your profile.</p>
      )}
      {state.status === "success" && state.orders.length > 0 && (
        <div className="orders-grid">
          {state.orders.map((order) => (
            <article key={order.orderNumber} className="order-card">
              <div className="order-top-row">
                <p className="order-number">{order.orderNumber}</p>
                <p className="status-pill">{order.status}</p>
              </div>
              <p className="order-line">
                <strong>Product:</strong> {order.productCode}
              </p>
              <p className="order-line">
                <strong>Date:</strong> {formatOrderDate(order.orderDate)}
              </p>
              <div className="order-meta">
                <p>
                  <strong>Qty</strong> {order.quantity}
                </p>
                <p>
                  <strong>Unit</strong> {formatCurrency(order.unitPrice)}
                </p>
                <p>
                  <strong>Total</strong>{" "}
                  {formatCurrency(Number(order.unitPrice || 0) * Number(order.quantity || 0))}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
