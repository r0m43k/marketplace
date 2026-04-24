# marketplace
Stack: k8s + Docker + Django + PostgreSQL

```bash
pip install -r requirements.txt

export DB_NAME= {{ secrets.EXAMPLE_VAR }}
export DB_USER= {{ secrets.EXAMPLE_VAR }}
export DB_PASSWORD= {{ secrets.EXAMPLE_VAR }}

python manage.py migrate
python manage.py createsuperuser        # optional admin
python manage.py loaddata initial_data  # seed categories (optional)
python manage.py runserver
```

## Structure

```
marketplace/
├── config/
│   ├── settings.py
│   └── urls.py
├── marketplace/
│   ├── models.py    — Product, Category, CartItem, Order, Review
│   ├── views.py     — all page & API views
│   └── urls.py
├── static/
│   ├── css/main.css
│   └── js/main.js
├── templates/
│   ├── base.html
│   ├── marketplace/
│   │   ├── index.html      — product grid + search + filters
│   │   ├── product.html    — detail + add to cart + reviews
│   │   ├── cart.html
│   │   ├── checkout.html
│   │   ├── orders.html
│   │   └── sell.html
│   └── registration/
│       ├── login.html
│       └── register.html
└── requirements.txt
```

## Features

- Browse & search products by keyword
- Filter by category, sort by price / date
- Product detail with image, seller info, stock count
- Add to cart (AJAX counter update)
- Checkout → creates Order, decrements stock
- Order history with status badges
- Review system (1–5 stars + text, one per user per product)
- Sell: any logged-in user can list products
- Auth: register / login / logout