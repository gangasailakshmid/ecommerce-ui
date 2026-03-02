import { Link, useLocation } from "react-router-dom";

export function OrderConfirmationPage() {
  const location = useLocation();
  const orders = location.state?.orders || [];

  return (
    <section className="page confirmation-page">
      <article className="confirmation-card">
        <p className="eyebrow">Checkout Complete</p>
        <h1>Order Confirmed</h1>
        {orders.length > 0 ? (
          <>
            <p className="muted-copy">
              Your order has been placed successfully. Reference IDs:
            </p>
            <div className="confirmation-ids">
              {orders.map((order) => (
                <p key={order.orderNumber || order.id} className="confirmation-id">
                  Order ID: {order.id ?? "N/A"} | Order Number:{" "}
                  {order.orderNumber ?? "N/A"}
                </p>
              ))}
            </div>
          </>
        ) : (
          <p className="muted-copy">
            Your order has been placed successfully.
          </p>
        )}
        <div className="actions">
          <Link className="button" to="/profile/orders">
            View My Orders
          </Link>
          <Link className="button secondary" to="/products">
            Continue Shopping
          </Link>
        </div>
      </article>
    </section>
  );
}
