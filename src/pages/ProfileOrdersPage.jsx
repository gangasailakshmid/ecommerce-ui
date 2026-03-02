import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getProducts } from "../features/products/productsSlice";
import { cancelOrder, getOrdersForProfile } from "../services/orderApi";

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

function getStatusClass(status) {
  switch (status) {
    case "CREATED":
      return "status-created";
    case "CONFIRMED":
      return "status-confirmed";
    case "SHIPPED":
      return "status-shipped";
    case "DELIVERED":
      return "status-delivered";
    case "CANCELLED":
      return "status-cancelled";
    default:
      return "status-default";
  }
}

export function ProfileOrdersPage() {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.auth.profile);
  const products = useSelector((state) => state.products.items);
  const productsStatus = useSelector((state) => state.products.status);
  const [state, setState] = useState({
    status: "idle",
    orders: [],
    error: "",
  });
  const [filterText, setFilterText] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const statusFilterRef = useRef(null);
  const statusOptions = [
    "CREATED",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];
  const [cancelingOrderNumber, setCancelingOrderNumber] = useState(null);

  useEffect(() => {
    if (productsStatus === "idle") {
      dispatch(getProducts());
    }
  }, [dispatch, productsStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusFilterRef.current &&
        !statusFilterRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const descriptionByCode = products.reduce((acc, product) => {
    acc[product.productCode] = product.description;
    return acc;
  }, {});

  const filteredOrders = state.orders.filter((order) => {
    const statusMatch =
      selectedStatuses.length === 0
        ? true
        : selectedStatuses.includes(order.status);
    const normalized = filterText.trim().toLowerCase();
    if (!normalized) {
      return statusMatch;
    }
    const productDescription = descriptionByCode[order.productCode] || "";
    const textMatch =
      order.orderNumber?.toLowerCase().includes(normalized) ||
      order.productCode?.toLowerCase().includes(normalized) ||
      productDescription.toLowerCase().includes(normalized);
    return statusMatch && textMatch;
  });

  const handleCancelOrder = async (order) => {
    setCancelingOrderNumber(order.orderNumber);
    try {
      const updated = await cancelOrder(order);
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((item) =>
          item.orderNumber === order.orderNumber ? updated : item
        ),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message || "Unable to cancel order.",
      }));
    } finally {
      setCancelingOrderNumber(null);
    }
  };

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((item) => item !== status)
        : [...prev, status]
    );
  };

  const selectAllStatuses = () => {
    setSelectedStatuses(statusOptions);
  };

  const clearStatuses = () => {
    setSelectedStatuses([]);
  };

  const statusButtonLabel =
    selectedStatuses.length === 0
      ? "All Statuses"
      : selectedStatuses.length <= 2
      ? selectedStatuses.join(", ")
      : `${selectedStatuses.length} statuses selected`;

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
        <div className="order-filter-bar">
          <label className="filter-control">
            Search
            <input
              type="text"
              placeholder="Order # or product..."
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
            />
          </label>
          <div className="filter-control status-filter-wrap" ref={statusFilterRef}>
            <button
              type="button"
              className="multi-filter-button"
              onClick={() => setStatusDropdownOpen((prev) => !prev)}
              aria-expanded={statusDropdownOpen}
            >
              <span>{statusButtonLabel}</span>
              <span className="multi-filter-caret">
                {statusDropdownOpen ? "▲" : "▼"}
              </span>
            </button>
            {statusDropdownOpen && (
              <div className="multi-filter-menu">
                <div className="multi-filter-header">
                  <button
                    type="button"
                    className="multi-filter-selectall"
                    onClick={selectAllStatuses}
                    title="Select all"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="multi-filter-clear"
                    onClick={clearStatuses}
                    title="Clear selection"
                  >
                    ✕
                  </button>
                </div>
                {statusOptions.map((status) => (
                  <label key={status} className="multi-filter-option">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                    />
                    {status}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        {state.status === "success" && (
          <div className="orders-stats">
            <p className="stat-chip">Orders: {filteredOrders.length}</p>
            <p className="stat-chip">
              Total Spend:{" "}
              {formatCurrency(
                filteredOrders.reduce(
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
      {state.status === "success" && filteredOrders.length === 0 && (
        <p>No orders found for your profile.</p>
      )}
      {state.status === "success" && filteredOrders.length > 0 && (
        <div className="orders-grid">
          {filteredOrders.map((order) => (
            <article key={order.orderNumber} className="order-card">
              <div className="order-top-row">
                <p className="order-number">{order.orderNumber}</p>
                <p className={`status-pill ${getStatusClass(order.status)}`}>
                  {order.status}
                </p>
              </div>
              <p className="order-line">
                <strong>Product:</strong>{" "}
                {descriptionByCode[order.productCode] || order.productCode}
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
              {!["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status) && (
                <button
                  className="danger order-cancel-btn"
                  onClick={() => handleCancelOrder(order)}
                  disabled={cancelingOrderNumber === order.orderNumber}
                >
                  {cancelingOrderNumber === order.orderNumber
                    ? "Cancelling..."
                    : "Cancel Order"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
