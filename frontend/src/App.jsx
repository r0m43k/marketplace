import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronRight,
  LogOut,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { api, setToken } from "./api";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function asList(response) {
  return Array.isArray(response) ? response : response?.results || [];
}

function formatPrice(value) {
  return money.format(Number(value || 0));
}

function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
    [cart]
  );

  const cartQuantity = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart]
  );

  async function loadProducts(next = {}) {
    const data = await api.products({
      q: next.query ?? query,
      category: next.category ?? category,
      sort: next.sort ?? sort,
    });
    setProducts(asList(data));
  }

  async function bootstrap() {
    setLoading(true);
    setError("");
    try {
      const [categoryData, productData] = await Promise.all([
        api.categories(),
        api.products({ q: query, category, sort }),
      ]);
      setCategories(asList(categoryData));
      setProducts(asList(productData));
      try {
        const me = await api.me();
        setUser(me);
        await refreshPrivateData();
      } catch {
        setUser(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshPrivateData() {
    const [cartData, orderData] = await Promise.all([api.cart(), api.orders()]);
    setCart(asList(cartData));
    setOrders(asList(orderData));
  }

  useEffect(() => {
    bootstrap();
  }, []);

  async function submitSearch(event) {
    event.preventDefault();
    setError("");
    try {
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeCategory(value) {
    setCategory(value);
    setError("");
    try {
      await loadProducts({ category: value });
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeSort(value) {
    setSort(value);
    setError("");
    try {
      await loadProducts({ sort: value });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAuth(payload, mode) {
    setError("");
    setNotice("");
    try {
      const authPayload =
        mode === "register"
          ? payload
          : { username: payload.username, password: payload.password };
      const data = mode === "register" ? await api.register(authPayload) : await api.login(authPayload);
      setToken(data.token);
      const me = data.user || (await api.me());
      setUser(me);
      await refreshPrivateData();
      setPanel(null);
      setNotice(mode === "register" ? "Account created" : "Signed in");
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setCart([]);
    setOrders([]);
    setNotice("Signed out");
  }

  async function addToCart(product) {
    if (!user) {
      setPanel("auth");
      return;
    }
    setError("");
    try {
      await api.addCartItem({ product: product.id, quantity: 1 });
      await refreshPrivateData();
      setNotice("Added to bag");
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateQuantity(item, quantity) {
    if (quantity < 1) {
      await removeFromCart(item.id);
      return;
    }
    setError("");
    try {
      await api.updateCartItem(item.id, { quantity });
      await refreshPrivateData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeFromCart(id) {
    setError("");
    try {
      await api.removeCartItem(id);
      await refreshPrivateData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function checkout() {
    setError("");
    try {
      await api.checkout();
      await refreshPrivateData();
      setPanel("orders");
      setNotice("Order placed");
    } catch (err) {
      setError(err.message);
    }
  }

  async function createProduct(payload) {
    setError("");
    try {
      await api.createProduct(payload);
      await loadProducts();
      setPanel(null);
      setNotice("Listing published");
    } catch (err) {
      setError(err.message);
    }
  }

  async function createReview(payload) {
    setError("");
    try {
      await api.createReview(payload);
      setNotice("Review saved");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app-shell">
      <Header
        user={user}
        cartQuantity={cartQuantity}
        onAuth={() => setPanel("auth")}
        onSell={() => (user ? setPanel("sell") : setPanel("auth"))}
        onCart={() => (user ? setPanel("cart") : setPanel("auth"))}
        onOrders={() => (user ? setPanel("orders") : setPanel("auth"))}
        onLogout={logout}
      />

      <main>
        <section className="control-band">
          <form className="search-form" onSubmit={submitSearch}>
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search products"
            />
          </form>

          <div className="filter-row" aria-label="Categories">
            <button
              className={!category ? "chip active" : "chip"}
              onClick={() => changeCategory("")}
              type="button"
            >
              All
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                className={category === item.slug ? "chip active" : "chip"}
                onClick={() => changeCategory(item.slug)}
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>

          <label className="sort-control">
            <ArrowUpDown size={16} />
            <select value={sort} onChange={(event) => changeSort(event.target.value)}>
              <option value="-created_at">Newest</option>
              <option value="created_at">Oldest</option>
              <option value="price">Price low</option>
              <option value="-price">Price high</option>
              <option value="title">A to Z</option>
            </select>
          </label>
        </section>

        {notice && (
          <button className="notice" onClick={() => setNotice("")} type="button">
            {notice}
          </button>
        )}

        {error && (
          <button className="notice error" onClick={() => setError("")} type="button">
            {error}
          </button>
        )}

        {loading ? (
          <ProductSkeleton />
        ) : (
          <ProductGrid
            products={products}
            onSelect={setSelectedProduct}
            onAdd={addToCart}
          />
        )}
      </main>

      {selectedProduct && (
        <ProductDialog
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={addToCart}
          onReview={createReview}
          user={user}
        />
      )}

      <SidePanel open={Boolean(panel)} onClose={() => setPanel(null)}>
        {panel === "auth" && <AuthPanel onSubmit={handleAuth} />}
        {panel === "sell" && (
          <SellPanel categories={categories} onSubmit={createProduct} />
        )}
        {panel === "cart" && (
          <CartPanel
            items={cart}
            total={cartTotal}
            onQuantity={updateQuantity}
            onRemove={removeFromCart}
            onCheckout={checkout}
          />
        )}
        {panel === "orders" && <OrdersPanel orders={orders} />}
      </SidePanel>
    </div>
  );
}

function Header({ user, cartQuantity, onAuth, onSell, onCart, onOrders, onLogout }) {
  return (
    <header className="topbar">
      <button className="brand" type="button">
        MRKT
      </button>
      <nav>
        <button type="button" onClick={onSell}>
          Sell
        </button>
        <button type="button" onClick={onOrders}>
          Orders
        </button>
        <button className="icon-button" type="button" onClick={onCart} aria-label="Cart">
          <ShoppingBag size={18} />
          <span>{cartQuantity}</span>
        </button>
        {user ? (
          <>
            <span className="user-pill">
              <User size={15} />
              {user.username}
            </span>
            <button className="icon-button" type="button" onClick={onLogout} aria-label="Logout">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <button type="button" onClick={onAuth}>
            Sign in
          </button>
        )}
      </nav>
    </header>
  );
}

function ProductGrid({ products, onSelect, onAdd }) {
  if (!products.length) {
    return (
      <section className="empty-state">
        <Package size={34} />
        <h1>No products</h1>
      </section>
    );
  }

  return (
    <section className="product-grid">
      {products.map((product) => (
        <article className="product-card" key={product.id}>
          <button className="product-media" type="button" onClick={() => onSelect(product)}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} />
            ) : (
              <span>{product.title.slice(0, 1)}</span>
            )}
          </button>
          <div className="product-meta">
            <button type="button" onClick={() => onSelect(product)} className="product-title">
              {product.title}
            </button>
            <span>{product.category_detail?.name || "General"}</span>
          </div>
          <div className="product-bottom">
            <strong>{formatPrice(product.price)}</strong>
            <button type="button" onClick={() => onAdd(product)}>
              <Plus size={16} />
              Add
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

function ProductDialog({ product, user, onClose, onAdd, onReview }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  function submitReview(event) {
    event.preventDefault();
    onReview({ product: product.id, rating, text });
    setText("");
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="product-dialog" role="dialog" aria-modal="true">
        <button className="close-button" type="button" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className="dialog-media">
          {product.image_url ? <img src={product.image_url} alt={product.title} /> : <span>{product.title[0]}</span>}
        </div>
        <div className="dialog-content">
          <p>{product.category_detail?.name || "General"}</p>
          <h1>{product.title}</h1>
          <div className="dialog-price">{formatPrice(product.price)}</div>
          <p className="muted">{product.description}</p>
          <div className="spec-row">
            <span>Stock</span>
            <strong>{product.stock}</strong>
          </div>
          <div className="spec-row">
            <span>Rating</span>
            <strong>{product.avg_rating || "-"}</strong>
          </div>
          <button className="primary-action" type="button" onClick={() => onAdd(product)}>
            Add to bag
            <ChevronRight size={17} />
          </button>
          {user && (
            <form className="review-form" onSubmit={submitReview}>
              <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Review"
              />
              <button type="submit">Send</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function SidePanel({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="side-backdrop" role="presentation">
      <aside className="side-panel">
        <button className="close-button" type="button" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        {children}
      </aside>
    </div>
  );
}

function AuthPanel({ onSubmit }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit(form, mode);
  }

  return (
    <section className="panel-section">
      <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
      <div className="segmented">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "register" ? "active" : ""}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>
      <form className="stack-form" onSubmit={submit}>
        <label>
          Username
          <input value={form.username} onChange={(event) => update("username", event.target.value)} />
        </label>
        {mode === "register" && (
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </label>
        )}
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
          />
        </label>
        <button className="primary-action" type="submit">
          Continue
          <ChevronRight size={17} />
        </button>
      </form>
    </section>
  );
}

function SellPanel({ categories, onSubmit }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: "1",
    image_url: "",
    category: "",
  });

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      category: form.category ? Number(form.category) : null,
      price: String(form.price),
      stock: Number(form.stock),
    });
  }

  return (
    <section className="panel-section">
      <h2>New listing</h2>
      <form className="stack-form" onSubmit={submit}>
        <label>
          Title
          <input value={form.title} onChange={(event) => update("title", event.target.value)} />
        </label>
        <label>
          Category
          <select value={form.category} onChange={(event) => update("category", event.target.value)}>
            <option value="">General</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={(event) => update("description", event.target.value)} />
        </label>
        <div className="form-grid">
          <label>
            Price
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
            />
          </label>
          <label>
            Stock
            <input
              type="number"
              min="1"
              value={form.stock}
              onChange={(event) => update("stock", event.target.value)}
            />
          </label>
        </div>
        <label>
          Image URL
          <input value={form.image_url} onChange={(event) => update("image_url", event.target.value)} />
        </label>
        <button className="primary-action" type="submit">
          Publish
          <ChevronRight size={17} />
        </button>
      </form>
    </section>
  );
}

function CartPanel({ items, total, onQuantity, onRemove, onCheckout }) {
  return (
    <section className="panel-section">
      <h2>Bag</h2>
      <div className="panel-list">
        {items.map((item) => (
          <article className="line-item" key={item.id}>
            <div className="thumb">
              {item.product_detail?.image_url ? (
                <img src={item.product_detail.image_url} alt={item.product_detail.title} />
              ) : (
                <span>{item.product_detail?.title?.[0] || "M"}</span>
              )}
            </div>
            <div>
              <strong>{item.product_detail?.title}</strong>
              <span>{formatPrice(item.subtotal)}</span>
              <div className="quantity">
                <button type="button" onClick={() => onQuantity(item, item.quantity - 1)} aria-label="Decrease">
                  <Minus size={14} />
                </button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => onQuantity(item, item.quantity + 1)} aria-label="Increase">
                  <Plus size={14} />
                </button>
                <button type="button" onClick={() => onRemove(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="total-row">
        <span>Total</span>
        <strong>{formatPrice(total)}</strong>
      </div>
      <button className="primary-action" type="button" onClick={onCheckout} disabled={!items.length}>
        Checkout
        <ChevronRight size={17} />
      </button>
    </section>
  );
}

function OrdersPanel({ orders }) {
  return (
    <section className="panel-section">
      <h2>Orders</h2>
      <div className="panel-list">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div>
              <strong>#{order.id}</strong>
              <span>{order.status}</span>
            </div>
            <strong>{formatPrice(order.total)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductSkeleton() {
  return (
    <section className="product-grid">
      {Array.from({ length: 8 }).map((_, index) => (
        <article className="product-card skeleton" key={index}>
          <div className="product-media" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </article>
      ))}
    </section>
  );
}

export default App;
