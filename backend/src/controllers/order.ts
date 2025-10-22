import { Request, Response, NextFunction } from 'express';
import { faker } from '@faker-js/faker';
import mongoose, { Error as MongooseError } from 'mongoose';
import Product from '../models/product';
import BadRequestError from '../errors/BadRequestError';

interface OrderBody {
  payment: 'card' | 'online';
  email: string;
  phone: string;
  address: string;
  total: number;
  items: string[];
}

const createOrder = async (
  req: Request<Record<string, unknown>, unknown, OrderBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { items, total } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Items must contain at least one product id');
    }

    const objectIds = items.map((itemId) => new mongoose.Types.ObjectId(itemId));
    const foundProducts = await Product.find({ _id: { $in: objectIds } });

    if (foundProducts.length !== items.length) {
      throw new BadRequestError('Some products from the order were not found');
    }

    const unavailableProduct = foundProducts.find(
      (product) => product.price === null || typeof product.price !== 'number',
    );

    if (unavailableProduct) {
      throw new BadRequestError('Order contains products that are not available for sale');
    }

    const sum = foundProducts.reduce((acc, product) => acc + (product.price as number), 0);

    if (sum !== total) {
      throw new BadRequestError('Total amount does not match the prices of the products');
    }

    res.status(201).json({ id: faker.string.uuid(), total: sum });
  } catch (error) {
    if (error instanceof MongooseError.CastError) {
      next(new BadRequestError('Invalid product identifier'));
      return;
    }

    next(error);
  }
};

export default createOrder;
