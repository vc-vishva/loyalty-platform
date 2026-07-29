import express, { Router } from 'express';
import authRoute from './auth.route.js';
import userRoute from './user.route.js';
import businessRoute from './business.route.js';

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
    path: '/users',
    route: userRoute,
  },
  {
    path: '/businesses',
    route: businessRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
