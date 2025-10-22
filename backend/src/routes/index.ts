import { Router } from 'express';
import productRouter from './product';
import orderRouter from './order';
import NotFoundError from '../errors/NotFoundError';

const router = Router();

router.use('/product', productRouter);
router.use('/order', orderRouter);
router.use('*', (_req, _res, next) => next(new NotFoundError('Route not found')));

export default router;
