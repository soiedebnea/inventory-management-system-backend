import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';

const router = Router();

router.get('/', asyncHandler(listSuppliers));
router.get('/:id', asyncHandler(getSupplier));
router.post('/', asyncHandler(createSupplier));
router.put('/:id', asyncHandler(updateSupplier));
router.delete('/:id', asyncHandler(deleteSupplier));

export default router;