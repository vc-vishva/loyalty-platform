import { Server } from 'http';
import app from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';
import prisma from './config/prisma.js';

let server: Server;

prisma
  .$connect()
  .then(() => {
    logger.info('Connected to PostgreSQL');
    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });
  })
  .catch((error: unknown) => {
    logger.error(error);
    process.exit(1);
  });

const exitHandler = (): void => {
  const shutdown = (): void => {
    void prisma.$disconnect().finally(() => process.exit(1));
  };
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      shutdown();
    });
  } else {
    shutdown();
  }
};

const unexpectedErrorHandler = (error: unknown): void => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
