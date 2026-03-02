const ORDER_API_BASE_URL =
  import.meta.env.VITE_ORDER_API_BASE_URL || "/order-api/api/v1";

const DEFAULT_CUSTOMER_CODE =
  import.meta.env.VITE_DEFAULT_CUSTOMER_CODE || "WEB-CUSTOMER";
const DEFAULT_PROFILE_ID = import.meta.env.VITE_DEFAULT_PROFILE_ID || "1001";

function toUnitPrice(price) {
  const parsed = Number(price);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Number(parsed.toFixed(2));
}

function randomToken(length = 8) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, length).toUpperCase();
  }
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}

function toMaxLength(value, max) {
  if (value == null) {
    return "";
  }
  return String(value).slice(0, max);
}

function toProfileId(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return Math.trunc(parsed);
}

function buildOrderNumber(productCode, index) {
  const safeCode = (productCode || "ITEM")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6);
  const timePart = Date.now().toString(36).toUpperCase().slice(-6);
  const indexPart = (index + 1).toString(36).toUpperCase();
  const randomPart = randomToken(10);
  const orderNumber = `ORD-${timePart}${indexPart}-${safeCode}-${randomPart}`;

  return orderNumber.slice(0, 40);
}

function buildPayload(item, index, authContext = {}) {
  const productId = Number(item?.product?.id);
  if (Number.isNaN(productId) || productId <= 0) {
    throw new Error(
      `Cannot checkout: invalid product id for "${item?.product?.description || "item"}".`
    );
  }
  const productCode = toMaxLength(item?.product?.productCode, 40);
  if (!productCode) {
    throw new Error("Cannot checkout: one or more cart items have invalid product code.");
  }

  const unitPrice = toUnitPrice(item?.product?.price);
  if (unitPrice == null || unitPrice <= 0) {
    throw new Error(
      `Cannot checkout: price is unavailable for "${item?.product?.description || productId}".`
    );
  }

  const profileId = toProfileId(authContext.profileId ?? DEFAULT_PROFILE_ID);
  if (!profileId) {
    throw new Error("Please sign in before checkout.");
  }
  const customerCode = toMaxLength(
    authContext.customerCode ?? DEFAULT_CUSTOMER_CODE,
    40
  );

  return {
    orderNumber: buildOrderNumber(productCode, index),
    customerCode: customerCode || "WEB-CUSTOMER",
    profileId,
    productId: Math.trunc(productId),
    productCode,
    quantity: Number(item.quantity) || 1,
    unitPrice,
    status: "CREATED",
  };
}

async function postOrder(payload) {
  const response = await fetch(`${ORDER_API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return response.json();
  }

  const errorBody = await response.text();
  const error = new Error(
    `Order API error (${response.status}): ${errorBody || response.statusText}`
  );
  error.status = response.status;
  throw error;
}

async function getOrders() {
  const response = await fetch(`${ORDER_API_BASE_URL}/orders`);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Order API error (${response.status}): ${errorBody || response.statusText}`
    );
  }
  return response.json();
}

async function postOrderWithRetry(item, index, authContext = {}) {
  const payload = buildPayload(item, index, authContext);
  try {
    return await postOrder(payload);
  } catch (error) {
    if (error.status === 409) {
      const retryPayload = {
        ...payload,
        orderNumber: buildOrderNumber(payload.productCode, index + 50),
      };
      return postOrder(retryPayload);
    }
    throw error;
  }
}

export async function placeOrdersFromCart(cartItems, authContext = {}) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Cart is empty");
  }

  const responses = [];
  for (let i = 0; i < cartItems.length; i += 1) {
    const response = await postOrderWithRetry(cartItems[i], i, authContext);
    responses.push(response);
  }
  return responses;
}

export async function getOrdersForProfile(authContext = {}) {
  const profileId = toProfileId(authContext.profileId ?? DEFAULT_PROFILE_ID);
  const customerCode = toMaxLength(
    authContext.customerCode ?? DEFAULT_CUSTOMER_CODE,
    40
  );
  if (!profileId) {
    throw new Error("Please sign in to view orders.");
  }

  const orders = await getOrders();
  return orders.filter(
    (order) =>
      Number(order.profileId) === profileId ||
      order.customerCode === customerCode
  );
}

export async function cancelOrder(order) {
  const payload = {
    orderNumber: order.orderNumber,
    customerCode: order.customerCode,
    profileId: Number(order.profileId),
    productId: Number(order.productId),
    productCode: order.productCode,
    quantity: Number(order.quantity),
    unitPrice: Number(order.unitPrice),
    status: "CANCELLED",
  };

  const response = await fetch(`${ORDER_API_BASE_URL}/orders/${order.orderNumber}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Order API error (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return response.json();
}
