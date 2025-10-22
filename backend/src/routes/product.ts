import { Router } from 'express';
import { getProducts, createProduct } from '../controllers/product';
import { createProductValidation } from '../middlewares/validations';

const router = Router();

router.get('/', getProducts);
router.post('/', createProductValidation, createProduct);

export default router;
