import express, { Router } from 'express';
import authRoute from './auth.route.js';
import businessRoute from './business.route.js';
import productRoute from './product.route.js';
import purchaseRoute from './purchase.route.js';
import rewardRoute from './reward.route.js';

const router: Router = express.Router();

interface RouteConfig {
  path: string;
  route: Router;
}

const defaultRoutes: RouteConfig[] = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/businesses',
    route: businessRoute,
  },
  {
    path: '/products',
    route: productRoute,
  },
  {
    path: '/purchases',
    route: purchaseRoute,
  },
  {
    path: '/rewards',
    route: rewardRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
