# Ecommerce Portal UI

React + Redux ecommerce portal UI integrated with the `product-catalog` microservice.

## Features
- Home page with portal navigation
- Product list page
- Product details page
- Add to cart with quantity on list and details pages
- Cart page with added products and quantity updates

## Prerequisites
- Node.js 20+
- `product-catalog` service running on `http://localhost:8081`

## Run
```bash
npm install
npm run dev
```

The UI runs on Vite default port `5173`.

## API Configuration
Default API base URL:
- `/api/v1` (proxied by Vite to `http://localhost:8081`)

Override with:
```bash
VITE_CATALOG_API_BASE_URL=http://localhost:8081/api/v1
```

Order API base URL:
- `/order-api/api/v1` (proxied by Vite to `http://localhost:8082`)

Profile API base URL:
- `/profile-api/api/v1` (proxied by Vite to `http://localhost:8084`)

Optional overrides:
```bash
VITE_ORDER_API_BASE_URL=http://localhost:8082/api/v1
VITE_DEFAULT_CUSTOMER_CODE=WEB-CUSTOMER
VITE_DEFAULT_PROFILE_ID=1001
VITE_PROFILE_API_BASE_URL=http://localhost:8084/api/v1
```
