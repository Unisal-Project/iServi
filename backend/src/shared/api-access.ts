import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "../modules/users/entity/user.entity.js";
import { authenticate } from "./authenticate.js";

const publicRoutes = new Set([
  // Esta rota verifica a credencial do cliente no próprio handler.
  "GET /client/payment-confirmation",
  "GET /health",
  "GET /settings/public",
  "POST /auth/login",
  "GET /categories",
  "GET /categories/:id",
  "GET /products",
  "GET /products/:id",
  "GET /tables/by-token/:token",
  "GET /tables/by-token/:token/bill",
  "POST /tables/by-token/:token/orders",
  "POST /tables/by-token/:token/request-closing",
  "POST /tables/by-token/:token/call-waiter",
  "GET /client/notifications/public-key",
  "POST /client/notifications/subscribe",
]);

const managementRoutes = new Set([
  "GET /settings",
  "PUT /settings",
  "POST /settings/banner",
  "DELETE /settings/banner",
  "POST /categories",
  "PUT /categories/:id",
  "DELETE /categories/:id",
  "POST /products",
  "PATCH /products/:id",
  "PATCH /products/:id/category",
  "POST /products/:id/image",
  "DELETE /products/:id/image/:slot",
  "PATCH /products/:id/image/:slot/cover",
  "DELETE /products/:id",
  "PATCH /promotions",
  "POST /tables",
  "PUT /tables/:id",
  "DELETE /tables/:id",
  "GET /attendances/cancelled",
]);

const commonRoutes = new Set([
  "GET /settings/operation",
  "POST /auth/logout",
  "PATCH /auth/me",
  "PATCH /auth/password",
  "POST /auth/me/avatar",
  "GET /tables",
  "GET /tables/:id",
  "PATCH /tables/:id/status",
  "GET /orders",
  "GET /attendances/:tableId/open",
  "GET /attendances/closing-requested",
  "POST /attendances",
  "PATCH /attendances/:attendanceId/request-closing",
  "GET /waiter-calls",
  "PATCH /waiter-calls/:id/attend",
]);

const paymentOperationRoutes = new Set([
  "GET /tables/:id/qrcode",
  "POST /orders",
  "POST /tables/:id/orders",
  "PUT /orders/:id/items",
  "GET /attendances/:attendanceId/orders",
  "GET /attendances/:attendanceId/total",
  "POST /attendances/:attendanceId/close",
  "POST /attendances/:attendanceId/confirm-payment",
]);

const userManagementRoutes = new Set([
  "POST /auth/register",
  "GET /users",
  "GET /users/:id",
  "PATCH /users/:id",
  "DELETE /users/:id",
]);

const restaurantAdminRoutes = new Set([
  "POST /orders/:id/cancel",
  "PATCH /attendances/:attendanceId/request-cancelled",
  "POST /attendances/:attendanceId/reopen",
  "GET /reports/sales",
]);

export const canManageUsers = (role: UserRole) => role === "PLATFORM_ADMIN";

export const canManageRestaurant = (role: UserRole) =>
  role === "ADMIN" || role === "PLATFORM_ADMIN";

export const canAccessOrderAmounts = (role?: UserRole) =>
  role === "ADMIN" || role === "EMPLOYEE";

export async function requireApiAuthentication(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const method = request.method === "HEAD" ? "GET" : request.method;
  const route = `${method} ${request.routeOptions.url?.replace(/^\/api\/v1/, "")}`;
  if (publicRoutes.has(route)) return;
  await authenticate(request, reply);
  if (reply.sent) return;

  const { role } = request.user;
  if (
    commonRoutes.has(route) ||
    (canManageUsers(role) && userManagementRoutes.has(route)) ||
    (canManageRestaurant(role) && managementRoutes.has(route)) ||
    (canAccessOrderAmounts(role) && paymentOperationRoutes.has(route)) ||
    (role === "ADMIN" && restaurantAdminRoutes.has(route))
  )
    return;

  return reply.status(403).send({ message: "Acesso negado" });
}
