import { v4 as uuid } from 'uuid';
import { db, persist } from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';
import { requireFields } from '../utils/validate.js';

function withProductCount(supplier) {
  const productCount = db.data.products.filter((p) => p.supplierId === supplier.id).length;
  return { ...supplier, productCount };
}

export async function listSuppliers(req, res) {
  const { search } = req.query;
  let suppliers = db.data.suppliers;

  if (search) {
    const q = String(search).toLowerCase();
    suppliers = suppliers.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
    );
  }

  res.json(suppliers.map(withProductCount));
}

export async function getSupplier(req, res) {
  const supplier = db.data.suppliers.find((s) => s.id === req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');
  res.json(withProductCount(supplier));
}

export async function createSupplier(req, res) {
  requireFields(req.body, ['name']);
  const { name, contactName = '', email = '', phone = '', address = '' } = req.body;

  const now = new Date().toISOString();
  const supplier = {
    id: `sup-${uuid().slice(0, 8)}`,
    name,
    contactName,
    email,
    phone,
    address,
    createdAt: now,
    updatedAt: now,
  };

  db.data.suppliers.push(supplier);
  await persist();
  res.status(201).json(supplier);
}

export async function updateSupplier(req, res) {
  const supplier = db.data.suppliers.find((s) => s.id === req.params.id);
  if (!supplier) throw new ApiError(404, 'Supplier not found');

  const { name, contactName, email, phone, address } = req.body;
  if (name !== undefined) supplier.name = name;
  if (contactName !== undefined) supplier.contactName = contactName;
  if (email !== undefined) supplier.email = email;
  if (phone !== undefined) supplier.phone = phone;
  if (address !== undefined) supplier.address = address;
  supplier.updatedAt = new Date().toISOString();

  await persist();
  res.json(supplier);
}

export async function deleteSupplier(req, res) {
  const index = db.data.suppliers.findIndex((s) => s.id === req.params.id);
  if (index === -1) throw new ApiError(404, 'Supplier not found');

  const inUse = db.data.products.some((p) => p.supplierId === req.params.id);
  if (inUse) {
    throw new ApiError(409, 'Cannot delete a supplier that still has linked products. Reassign those products first.');
  }

  db.data.suppliers.splice(index, 1);
  await persist();
  res.status(204).send();
}