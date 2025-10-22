import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { errors } from 'celebrate';
import routes from './routes';
import { requestLogger, errorLogger } from './middlewares/logger';
import errorHandler from './middlewares/errors';
import { PORT, DB_ADDRESS } from './config';
import NotFoundError from './errors/NotFoundError';

const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(routes);
app.use('*', (_req, _res, next) => next(new NotFoundError('Route not found')));

app.use(errorLogger);
app.use(errors());
app.use(errorHandler);

const connectToDatabase = async (uri: string = DB_ADDRESS) => mongoose.connect(uri);

const startServer = async (port: number = PORT) => {
  await connectToDatabase();
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on port ${port}`);
  });

  return server;
};

export { app, connectToDatabase, startServer };
export default app;

if (require.main === module) {
  startServer().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start the server:', error);
    process.exit(1);
  });
}
