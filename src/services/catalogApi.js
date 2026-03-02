const API_BASE_URL = import.meta.env.VITE_CATALOG_API_BASE_URL || "/api/v1";

async function request(path) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function getLatestPrice(ticketPrices) {
  if (!Array.isArray(ticketPrices) || ticketPrices.length === 0) {
    return null;
  }
  return ticketPrices[0]?.ticketPrice ?? null;
}

export async function fetchProducts() {
  const products = await request("/products");
  const prices = await Promise.all(
    products.map(async (product) => {
      try {
        const ticketPrices = await request(`/ticket-prices/${product.productCode}`);
        return {
          productCode: product.productCode,
          price: getLatestPrice(ticketPrices),
        };
      } catch (_error) {
        return { productCode: product.productCode, price: null };
      }
    })
  );

  const pricesByCode = prices.reduce((acc, item) => {
    acc[item.productCode] = item.price;
    return acc;
  }, {});

  return products.map((product) => ({
    ...product,
    price: pricesByCode[product.productCode] ?? null,
  }));
}

export async function fetchProductByCode(productCode) {
  const product = await request(`/products/${productCode}`);

  let price = null;
  try {
    const ticketPrices = await request(`/ticket-prices/${productCode}`);
    price = getLatestPrice(ticketPrices);
  } catch (_error) {
    price = null;
  }

  return { ...product, price };
}
