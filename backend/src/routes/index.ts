import { Router } from 'express';
import productRouter from './product';
import createOrder from '../controllers/order';
import { createOrderValidation } from '../middlewares/validations';

const router = Router();

router.use('/product', productRouter);
router.post('/order', createOrderValidation, createOrder);

export default router;
