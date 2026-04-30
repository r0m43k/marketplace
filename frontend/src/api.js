const API_URL = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("mrkt_token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("mrkt_token", token);
  } else {
    localStorage.removeItem("mrkt_token");
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail = typeof data === "string" ? data : data.detail || JSON.stringify(data);
    throw new Error(detail || "Request failed");
  }

  return data;
}

export const api = {
  me: () => request("/auth/me/"),
  login: (payload) =>
    request("/auth/token/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload) =>
    request("/auth/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  categories: () => request("/categories/"),
  products: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== "" && value != null)
    );
    return request(`/products/${query.size ? `?${query}` : ""}`);
  },
  createProduct: (payload) =>
    request("/products/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  cart: () => request("/cart/"),
  addCartItem: (payload) =>
    request("/cart/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCartItem: (id, payload) =>
    request(`/cart/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  removeCartItem: (id) => request(`/cart/${id}/`, { method: "DELETE" }),
  orders: () => request("/orders/"),
  checkout: () => request("/orders/checkout/", { method: "POST" }),
  reviews: (productId) => request(`/reviews/?product=${productId}`),
  createReview: (payload) =>
    request("/reviews/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
