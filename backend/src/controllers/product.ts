import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import Product, { IProductImage } from '../models/product';
import BadRequestError from '../errors/BadRequestError';
import ConflictError from '../errors/ConflictError';

interface ProductCreateBody {
  title: string;
  image: IProductImage;
  category: string;
  description?: string;
  price?: number | null;
}

const getProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await Product.find({});
    res.json({ items, total: items.length });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (
  req: Request<Record<string, unknown>, unknown, ProductCreateBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const item = await Product.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    if (error instanceof MongooseError.ValidationError) {
      next(new BadRequestError('Invalid product data'));
      return;
    }

    if (error instanceof Error && error.message.includes('E11000')) {
      next(new ConflictError('A product with this title already exists'));
      return;
    }

    next(error);
  }
};

export { getProducts, createProduct };
