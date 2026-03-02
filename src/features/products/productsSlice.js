import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchProductByCode, fetchProducts } from "../../services/catalogApi";

export const getProducts = createAsyncThunk("products/getProducts", async () => {
  return fetchProducts();
});

export const getProductDetails = createAsyncThunk(
  "products/getProductDetails",
  async (productCode) => {
    return fetchProductByCode(productCode);
  }
);

const initialState = {
  items: [],
  selectedProduct: null,
  status: "idle",
  detailsStatus: "idle",
  error: null,
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Unable to fetch products";
      })
      .addCase(getProductDetails.pending, (state) => {
        state.detailsStatus = "loading";
        state.error = null;
      })
      .addCase(getProductDetails.fulfilled, (state, action) => {
        state.detailsStatus = "succeeded";
        state.selectedProduct = action.payload;
      })
      .addCase(getProductDetails.rejected, (state, action) => {
        state.detailsStatus = "failed";
        state.error = action.error.message || "Unable to fetch product details";
      });
  },
});

export default productsSlice.reducer;
