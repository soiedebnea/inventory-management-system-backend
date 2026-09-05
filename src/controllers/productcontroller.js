import { v4 as uuid } from 'uuid';
import { db, persist } from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireFields, asNonNegativeNumber } from '../utils/validate.js';

function decorate(product) {
  const supplier = db.data.suppliers.find((s) => s.id === product.supplierId) || null;
  const status =
    product.quantity <= 0 ? 'OUT_OF_STOCK' : product.quantity <= product.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK';
  return {
    ...product,
    supplierName: supplier ? supplier.name : null,
    status,
  };
}

export async function listProducts(req, res) {
  const { search, category, supplierId, status } = req.query;
  let products = db.data.products;

  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }
  if (category) products = products.filter((p) => p.category === category);
  if (supplierId) products = products.filter((p) => p.supplierId === supplierId);

  let decorated = products.map(decorate);
  if (status) decorated = decorated.filter((p) => p.status === status);

  res.json(decorated);
}

export async function getProduct(req, res) {
  const product = db.data.products.find((p) => p.id === req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(decorate(product));
}

export async function createProduct(req, res) {
  requireFields(req.body, ['name', 'sku']);
  const {
    name,
    sku,
    category = 'Uncategorized',
    unit = 'pcs',
    price = 0,
    quantity = 0,
    reorderLevel = 0,
    supplierId = null,
  } = req.body;

  if (db.data.products.some((p) => p.sku.toLowerCase() === String(sku).toLowerCase())) {
    throw new ApiError(409, `SKU "${sku}" is already in use`);
  }
  if (supplierId && !db.data.suppliers.some((s) => s.id === supplierId)) {
    throw new ApiError(400, `No supplier found with id "${supplierId}"`);
  }

  const now = new Date().toISOString();
  const product = {
    id: `prod-${uuid().slice(0, 8)}`,
    name,
    sku,
    category,
    unit,
    price: asNonNegativeNumber(price, 'price'),
    quantity: asNonNegativeNumber(quantity, 'quantity'),
    reorderLevel: asNonNegativeNumber(reorderLevel, 'reorderLevel'),
    supplierId,
    createdAt: now,
    updatedAt: now,
  };

  db.data.products.push(product);
  await persist();
  res.status(201).json(decorate(product));
}

export async function updateProduct(req, res) {
  const product = db.data.products.find((p) => p.id === req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const { name, sku, category, unit, price, reorderLevel, supplierId } = req.body;

  if (sku !== undefined && sku.toLowerCase() !== product.sku.toLowerCase()) {
    if (db.data.products.some((p) => p.id !== product.id && p.sku.toLowerCase() === String(sku).toLowerCase())) {
      throw new ApiError(409, `SKU "${sku}" is already in use`);
    }
    product.sku = sku;
  }
  if (supplierId !== undefined) {
    if (supplierId && !db.data.suppliers.some((s) => s.id === supplierId)) {
      throw new ApiError(400, `No supplier found with id "${supplierId}"`);
    }
    product.supplierId = supplierId;
  }
  if (name !== undefined) product.name = name;
  if (category !== undefined) product.category = category;
  if (unit !== undefined) product.unit = unit;
  if (price !== undefined) product.price = asNonNegativeNumber(price, 'price');
  if (reorderLevel !== undefined) product.reorderLevel = asNonNegativeNumber(reorderLevel, 'reorderLevel');

  product.updatedAt = new Date().toISOString();
  await persist();
  res.json(decorate(product));
}

export async function deleteProduct(req, res) {
  const index = db.data.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) throw new ApiError(404, 'Product not found');

  db.data.products.splice(index, 1);
  db.data.stockLogs = db.data.stockLogs.filter((log) => log.productId !== req.params.id);
  await persist();
  res.status(204).send();
}

// Shared helper for both /restock (IN) and /adjust (IN or OUT)
async function applyStockChange(req, res, { type }) {
  const product = db.data.products.find((p) => p.id === req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  requireFields(req.body, ['quantity']);
  const delta = asNonNegativeNumber(req.body.quantity, 'quantity');
  const note = req.body.note || (type === 'IN' ? 'Restock' : 'Stock removed');
  const movementType = req.body.type === 'OUT' ? 'OUT' : type; // /adjust may override direction

  if (movementType === 'OUT' && delta > product.quantity) {
    throw new ApiError(400, `Cannot remove ${delta} units, only ${product.quantity} in stock`);
  }

  product.quantity = movementType === 'OUT' ? product.quantity - delta : product.quantity + delta;
  product.updatedAt = new Date().toISOString();

  db.data.stockLogs.unshift({
    id: `log-${uuid().slice(0, 8)}`,
    productId: product.id,
    type: movementType,
    quantity: delta,
    note,
    createdAt: new Date().toISOString(),
  });

  await persist();
  res.json(decorate(product));
}

// POST /api/products/:id/restock  { quantity, note? }  -> always adds stock
export async function restockProduct(req, res) {
  await applyStockChange(req, res, { type: 'IN' });
}

// POST /api/products/:id/adjust  { quantity, type: 'IN' | 'OUT', note? }
export async function adjustProductStock(req, res) {
  requireFields(req.body, ['type']);
  if (!['IN', 'OUT'].includes(req.body.type)) {
    throw new ApiError(400, 'type must be "IN" or "OUT"');
  }
  await applyStockChange(req, res, { type: req.body.type });
}

export async function listCategories(req, res) {
  const categories = [...new Set(db.data.products.map((p) => p.category))].sort();
  res.json(categories);
}