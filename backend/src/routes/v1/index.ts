import express, { Router } from 'express';
import authRoute from './auth.route.js';
import spaceRoute from './space.route.js';
import bookingRoute from './booking.route.js';
import maintenanceRoute from './maintenance.route.js';

const router: Router = express.Router();

interface RouteConfig {
  path: string;
  route: Router;
}

const defaultRoutes: RouteConfig[] = [
  { path: '/auth', route: authRoute },
  { path: '/spaces', route: spaceRoute },
  { path: '/bookings', route: bookingRoute },
  { path: '/maintenance', route: maintenanceRoute },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
