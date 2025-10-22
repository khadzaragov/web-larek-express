/* eslint-env jest */

import {
  // eslint-disable-next-line import/no-extraneous-dependencies
  describe, it, expect, beforeAll, afterAll, afterEach, jest,
} from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import appInstance, { connectToDatabase } from '../app';
import Product from '../models/product';

jest.mock('@faker-js/faker', () => ({
  faker: {
    string: {
      uuid: () => 'test-order-id',
    },
  },
}));

describe('API Web-larek', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectToDatabase(uri);
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('GET /product', () => {
    it('returns an empty list when there are no products', async () => {
      const response = await request(appInstance).get('/product').expect(200);

      expect(response.body).toEqual({ items: [], total: 0 });
    });

    it('returns a list with existing products', async () => {
      await Product.create({
        title: 'Test product',
        image: { fileName: '/images/test.png', originalName: 'test.png' },
        category: 'gadgets',
        description: 'Useful gadget',
        price: 100,
      });

      const response = await request(appInstance).get('/product').expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.items[0]).toMatchObject({
        title: 'Test product',
        category: 'gadgets',
        description: 'Useful gadget',
        price: 100,
        image: {
          fileName: '/images/test.png',
          originalName: 'test.png',
        },
      });
    });
  });

  describe('POST /product', () => {
    const payload = {
      title: 'New gadget',
      image: { fileName: '/images/gadget.png', originalName: 'gadget.png' },
      category: 'gadgets',
      description: 'Brand new gadget',
      price: 250,
    };

    it('creates a product and responds with 201', async () => {
      const response = await request(appInstance).post('/product').send(payload).expect(201);

      expect(response.body).toMatchObject(payload);
      expect(response.body).toHaveProperty('_id');
    });

    it('returns 409 when creating a product with a duplicated title', async () => {
      await Product.create(payload);

      const response = await request(appInstance).post('/product').send(payload).expect(409);

      expect(response.body).toEqual({
        message: 'A product with this title already exists',
      });
    });

    it('returns 400 when the product payload fails validation', async () => {
      const invalidPayload = { ...payload, title: 'a' };

      const response = await request(appInstance).post('/product').send(invalidPayload).expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
      });
      expect(response.body.validation.body).toMatchObject({
        source: 'body',
      });
      expect(response.body.validation.body.message).toContain('title');
    });
  });

  describe('POST /order', () => {
    it('creates an order when items are valid and totals match', async () => {
      const productA = await Product.create({
        title: 'Timer',
        image: { fileName: '/images/timer.png', originalName: 'timer.png' },
        category: 'tools',
        description: 'Keeps you focused',
        price: 300,
      });
      const productB = await Product.create({
        title: 'Notebook',
        image: { fileName: '/images/notebook.png', originalName: 'notebook.png' },
        category: 'tools',
        description: 'Write it down',
        price: 200,
      });

      const response = await request(appInstance)
        .post('/order')
        .send({
          payment: 'card',
          email: 'user@example.com',
          phone: '+79990000000',
          address: 'Test street',
          total: 500,
          items: [productA._id.toString(), productB._id.toString()],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.total).toBe(500);
    });

    it('returns 400 when some products referenced by the order are missing', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await request(appInstance)
        .post('/order')
        .send({
          payment: 'online',
          email: 'user@example.com',
          phone: '+79990000000',
          address: 'Missing street',
          total: 100,
          items: [fakeId],
        })
        .expect(400);

      expect(response.body).toEqual({
        message: 'Some products from the order were not found',
      });
    });

    it('returns 400 when the provided total does not match the sum of products', async () => {
      const product = await Product.create({
        title: 'Mismatched',
        image: { fileName: '/images/mismatch.png', originalName: 'mismatch.png' },
        category: 'tools',
        description: 'Testing mismatch',
        price: 400,
      });

      const response = await request(appInstance)
        .post('/order')
        .send({
          payment: 'online',
          email: 'user@example.com',
          phone: '+79990000000',
          address: 'Mismatch street',
          total: 100,
          items: [product._id.toString()],
        })
        .expect(400);

      expect(response.body).toEqual({
        message: 'Total amount does not match the prices of the products',
      });
    });
  });
});
