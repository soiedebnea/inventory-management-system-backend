import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  adjustProductStock,
  listCategories,
} from '../controllers/productController.js';

const router = Router();

router.get('/', asyncHandler(listProducts));
router.get('/categories', asyncHandler(listCategories));
router.get('/:id', asyncHandler(getProduct));
router.post('/', asyncHandler(createProduct));
router.put('/:id', asyncHandler(updateProduct));
router.delete('/:id', asyncHandler(deleteProduct));
router.post('/:id/restock', asyncHandler(restockProduct));
router.post('/:id/adjust', asyncHandler(adjustProductStock));

export default router;