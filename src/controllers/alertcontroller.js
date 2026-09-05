import { db } from '../config/db.js';

function decorateProduct(product) {
  const supplier = db.data.suppliers.find((s) => s.id === product.supplierId) || null;
  return { ...product, supplierName: supplier ? supplier.name : null };
}

// GET /api/alerts  -> products at or below their reorder level, most urgent first
export async function getRestockAlerts(req, res) {
  const alerts = db.data.products
    .filter((p) => p.quantity <= p.reorderLevel)
    .map((p) => ({
      ...decorateProduct(p),
      severity: p.quantity <= 0 ? 'CRITICAL' : 'WARNING',
      unitsBelowReorder: p.reorderLevel - p.quantity,
    }))
    .sort((a, b) => a.quantity - b.quantity);

  res.json(alerts);
}

// GET /api/alerts/summary -> counts for dashboard widgets
export async function getDashboardSummary(req, res) {
  const products = db.data.products;
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalStockValue = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
  const outOfStock = products.filter((p) => p.quantity <= 0).length;
  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= p.reorderLevel).length;

  res.json({
    totalProducts,
    totalSuppliers: db.data.suppliers.length,
    totalStockUnits,
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    outOfStock,
    lowStock,
  });
}

// GET /api/alerts/logs -> recent stock movement history
export async function getStockLogs(req, res) {
  const limit = Number(req.query.limit) || 25;
  const logs = db.data.stockLogs.slice(0, limit).map((log) => {
    const product = db.data.products.find((p) => p.id === log.productId);
    return { ...log, productName: product ? product.name : '(deleted product)' };
  });
  res.json(logs);
}