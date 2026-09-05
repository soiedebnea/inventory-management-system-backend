# Stockyard — Backend

REST API for the Inventory Management System: **products**, **stock
levels**, **suppliers**, and **restocking alerts**. Node.js + Express, with
data persisted to a local JSON file (via [lowdb](https://github.com/typicode/lowdb)) —
no database server to install.

---

## File structure

```
backend/
├── server.js                     Express app entry point
├── package.json                  Dependencies + npm scripts
├── .env.example                  Copy to .env to change the port
├── data/
│   └── db.json                   All inventory data (JSON file "database")
└── src/
    ├── config/
    │   └── db.js                 Opens/reads/writes data/db.json (lowdb)
    ├── controllers/
    │   ├── productController.js  Product CRUD + restock/adjust logic
    │   ├── supplierController.js Supplier CRUD
    │   └── alertController.js    Low-stock alerts, dashboard summary, logs
    ├── routes/
    │   ├── products.js           /api/products routes
    │   ├── suppliers.js          /api/suppliers routes
    │   └── alerts.js             /api/alerts routes
    ├── middleware/
    │   └── errorHandler.js       Central error handling + 404s
    └── utils/
        ├── asyncHandler.js       Wraps async controllers for error handling
        └── validate.js           Shared request-validation helpers
```

**Why a JSON file instead of a real database?** `data/db.json` is read and
written through lowdb, so the whole project runs with `npm install && npm
start` — nothing else to configure. Every write (create, update, delete,
restock) is persisted to that file immediately, so data survives restarts.
If you outgrow it, swap `src/config/db.js` for a real database client;
every controller only touches `db.data`, so nothing else needs to change.

---

## Setup & running

```bash
cd backend
npm install
npm start          # http://localhost:5000
```

You should see:

```
[db] Loaded .../backend/data/db.json
[db] 3 suppliers, 4 products, 2 stock logs
Inventory Management API listening on http://localhost:5000
```

`npm run dev` restarts the server automatically on file changes (Node's
built-in `--watch`).

By default the API runs on port `5000`. To change it, copy `.env.example`
to `.env` and set `PORT=...`.

---

## API reference

Base URL: `http://localhost:5000/api`

### Products

| Method | Path                        | Description                                  |
|--------|-----------------------------|-----------------------------------------------|
| GET    | `/products`                 | List products. Query: `search`, `category`, `supplierId`, `status` (`IN_STOCK` / `LOW_STOCK` / `OUT_OF_STOCK`) |
| GET    | `/products/categories`      | Distinct list of categories in use            |
| GET    | `/products/:id`             | Get one product                               |
| POST   | `/products`                 | Create a product                              |
| PUT    | `/products/:id`             | Update a product                              |
| DELETE | `/products/:id`             | Delete a product                              |
| POST   | `/products/:id/restock`     | Add stock. Body: `{ quantity, note? }`        |
| POST   | `/products/:id/adjust`      | Add or remove stock. Body: `{ type: "IN"|"OUT", quantity, note? }` |

### Suppliers

| Method | Path               | Description                          |
|--------|--------------------|---------------------------------------|
| GET    | `/suppliers`       | List suppliers. Query: `search`       |
| GET    | `/suppliers/:id`   | Get one supplier                      |
| POST   | `/suppliers`       | Create a supplier                     |
| PUT    | `/suppliers/:id`   | Update a supplier                     |
| DELETE | `/suppliers/:id`   | Delete a supplier (blocked if products still reference it) |

### Alerts / dashboard

| Method | Path              | Description                                          |
|--------|-------------------|--------------------------------------------------------|
| GET    | `/alerts`         | Products at or below their reorder level, most urgent first |
| GET    | `/alerts/summary` | Dashboard totals: product/supplier counts, stock units & value, low/out-of-stock counts |
| GET    | `/alerts/logs`    | Recent stock movements. Query: `limit` (default 25)  |

All error responses look like `{ "error": "message" }` with an appropriate
HTTP status code (400 for validation, 404 for not found, 409 for conflicts
like a duplicate SKU).

---

## Data model

**Product**
```json
{
  "id": "prod-001",
  "name": "Wireless Mouse M1",
  "sku": "WM-1001",
  "category": "Electronics",
  "unit": "pcs",
  "price": 14.99,
  "quantity": 42,
  "reorderLevel": 20,
  "supplierId": "sup-001",
  "createdAt": "...",
  "updatedAt": "..."
}
```
A product's `status` (`IN_STOCK` / `LOW_STOCK` / `OUT_OF_STOCK`) is derived
from `quantity` vs `reorderLevel` on every read — it's never stored, so it's
always accurate.

**Supplier**
```json
{
  "id": "sup-001",
  "name": "Northwind Traders",
  "contactName": "Alice Renner",
  "email": "alice@northwind.example",
  "phone": "+1-555-0101",
  "address": "12 Harbor Rd, Portland, OR"
}
```

**Stock log** (created automatically by `/restock` and `/adjust`)
```json
{
  "id": "log-001",
  "productId": "prod-002",
  "type": "OUT",
  "quantity": 30,
  "note": "Bulk order shipped to Client #4471",
  "createdAt": "..."
}
```

---

## Sample data

The API ships with 3 sample suppliers and 4 sample products (one already
out of stock, one already low) in `data/db.json`, so there's something to
see the first time you run it. Edit or clear that file any time to start
fresh — restart the server afterward to reload it.

---

## Connecting a frontend

Enable CORS is already on (`cors` middleware in `server.js`), so any
frontend running on a different port can call this API directly. See
`frontend/README.md` for the matching client.
