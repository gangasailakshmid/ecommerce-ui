import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity } = action.payload;
      const normalizedQuantity = Number(quantity) || 1;

      const existingItem = state.items.find(
        (item) => item.product.productCode === product.productCode
      );

      if (existingItem) {
        existingItem.quantity += normalizedQuantity;
      } else {
        state.items.push({ product, quantity: normalizedQuantity });
      }
    },
    updateCartQuantity: (state, action) => {
      const { productCode, quantity } = action.payload;
      const normalizedQuantity = Number(quantity) || 1;
      const existingItem = state.items.find(
        (item) => item.product.productCode === productCode
      );

      if (existingItem) {
        existingItem.quantity = normalizedQuantity;
      }
    },
    removeFromCart: (state, action) => {
      const productCode = action.payload;
      state.items = state.items.filter(
        (item) => item.product.productCode !== productCode
      );
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, updateCartQuantity, removeFromCart, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
