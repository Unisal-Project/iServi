import assert from "node:assert/strict";
import { setSessionUserLoader } from "../src/shared/authenticate.js";
import type { UserRole } from "../src/modules/users/entity/user.entity.js";
import { test } from "node:test";
import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import { requireApiAuthentication } from "../src/shared/api-access.js";

const managementRoutes = [
  ["GET", "/settings", "/settings"],
  ["POST", "/categories", "/categories"],
  ["PUT", "/categories/:id", "/categories/1"],
  ["DELETE", "/categories/:id", "/categories/1"],
  ["POST", "/products", "/products"],
  ["PATCH", "/products/:id", "/products/1"],
  ["PATCH", "/products/:id/category", "/products/1/category"],
  ["POST", "/products/:id/image", "/products/1/image"],
  ["DELETE", "/products/:id", "/products/1"],
  ["POST", "/tables", "/tables"],
  ["PUT", "/tables/:id", "/tables/1"],
  ["DELETE", "/tables/:id", "/tables/1"],
  ["GET", "/attendances/cancelled", "/attendances/cancelled"],
] as const;

const salesRoutes = [
  ["GET", "/tables/:id/qrcode", "/tables/1/qrcode"],
  ["POST", "/orders", "/orders"],
  ["GET", "/attendances/:attendanceId/orders", "/attendances/1/orders"],
  ["GET", "/attendances/:attendanceId/total", "/attendances/1/total"],
  ["POST", "/attendances/:attendanceId/close", "/attendances/1/close"],
  [
    "POST",
    "/attendances/:attendanceId/confirm-payment",
    "/attendances/1/confirm-payment",
  ],
] as const;

const restaurantAdminRoutes = [
  ["POST", "/orders/:id/cancel", "/orders/1/cancel"],
  ["POST", "/attendances/:attendanceId/reopen", "/attendances/1/reopen"],
  ["GET", "/reports/sales", "/reports/sales"],
] as const;

const userManagementRoutes = [
  ["POST", "/auth/register", "/auth/register"],
  ["GET", "/users", "/users"],
  ["GET", "/users/:id", "/users/1"],
  ["PATCH", "/users/:id", "/users/1"],
  ["DELETE", "/users/:id", "/users/1"],
] as const;

const commonRoutes = [
  ["GET", "/tables", "/tables"],
  ["GET", "/orders", "/orders"],
  ["PATCH", "/tables/:id/status", "/tables/1/status"],
] as const;

test("RBAC uses the active database role and denies unlisted protected routes", async () => {
  const roles: UserRole[] = ["ADMIN", "EMPLOYEE", "PLATFORM_ADMIN"];
  setSessionUserLoader(async (id) => {
    const role = roles[Number(id) - 1];
    return { role: role ?? "ADMIN", active: !!role, tokenVersion: 0 };
  });
  const app = Fastify();
  await app.register(fastifyJwt, { secret: "test-secret" });
  const groups = [
    { routes: managementRoutes, allowed: ["ADMIN", "PLATFORM_ADMIN"] },
    { routes: salesRoutes, allowed: ["ADMIN", "EMPLOYEE"] },
    { routes: restaurantAdminRoutes, allowed: ["ADMIN"] },
    { routes: userManagementRoutes, allowed: ["PLATFORM_ADMIN"] },
    { routes: commonRoutes, allowed: roles },
    { routes: [["GET", "/private-new", "/private-new"]] as const, allowed: [] },
  ];
  await app.register(
    async (api) => {
      api.addHook("onRequest", requireApiAuthentication);
      for (const { routes } of groups) {
        for (const [method, url] of routes) {
          api.route({ method, url, handler: async () => ({ ok: true }) });
        }
      }
    },
    { prefix: "/api/v1" },
  );

  const sign = (id: number) =>
    `Bearer ${app.jwt.sign({ id: String(id), email: "x@example.com", role: "ADMIN" })}`;
  try {
    for (const { routes, allowed } of groups) {
      for (const [method, , path] of routes) {
        const call = (authorization?: string) =>
          app.inject({
            method,
            url: `/api/v1${path}`,
            headers: authorization ? { authorization } : {},
          });
        assert.equal((await call()).statusCode, 401);
        assert.equal((await call(sign(4))).statusCode, 401);
        for (const [index, role] of roles.entries()) {
          assert.equal(
            (await call(sign(index + 1))).statusCode,
            allowed.some((allowedRole) => allowedRole === role) ? 200 : 403,
            `${method} ${path}: ${role}`,
          );
        }
      }
    }
  } finally {
    await app.close();
  }
});

test("platform staff read actionable order details without amounts or QR credentials", async () => {
  const { adminOrderRoutes } =
    await import("../src/modules/orders/admin-order.controller.js");
  const { TableController } =
    await import("../src/modules/tables/table.controller.js");
  const { TableService } =
    await import("../src/modules/tables/table.service.js");
  const { errorHandler } =
    await import("../src/shared/errors/error-handler.js");
  const date = new Date("2026-11-17T15:00:00Z");
  const record = {
    id: 1n,
    dailyNumber: 1,
    businessDate: date,
    status: "PENDING",
    createdAt: date,
    notes: null,
    customerName: null,
    cancelledAt: null,
    cancellationReason: null,
    attendance: {
      id: 2n,
      status: "CLOSED",
      closedAt: date,
      serviceFee: "4.50",
      table: { id: 3n, name: "Mesa 3", number: 3 },
      payments: [{ method: "PIX", amount: "49.50", processingFee: "0.01" }],
    },
    items: [
      {
        id: 4n,
        productId: 5n,
        product: { name: "Lanche" },
        quantity: 3,
        unitPrice: "15.00",
        notes: "Sem cebola",
      },
    ],
  };
  const tables = {
    findAllWithAttendance: async () => [
      {
        table: {
          ...record.attendance.table,
          active: true,
          seats: 4,
          qrToken: "private-table-token",
        },
        attendance: null,
      },
    ],
  };
  setSessionUserLoader(async (id) => ({
    active: true,
    role: id === 3n ? "PLATFORM_ADMIN" : "ADMIN",
    tokenVersion: 0,
  }));
  const app = Fastify();
  app.setErrorHandler(errorHandler);
  await app.register(fastifyJwt, { secret: "rbac-secret" });
  await app.register(
    async (api) => {
      api.addHook("onRequest", requireApiAuthentication);
      await adminOrderRoutes(api, {
        repository: {
          findSince: async () => [record],
          findOperational: async () => [record],
        } as never,
      });
      const controller = new TableController(
        new TableService(tables as never, "https://example.com"),
      );
      api.get("/tables", (request, reply) =>
        controller.getAllTables(request, reply),
      );
    },
    { prefix: "/api/v1" },
  );
  const authorization = (id: string) =>
    `Bearer ${app.jwt.sign({ id, role: "ADMIN", email: "admin@example.com" })}`;
  try {
    for (const query of ["", "?scope=operational", "?days=90"]) {
      const response = await app.inject({
        url: `/api/v1/orders${query}`,
        headers: { authorization: authorization("3") },
      });
      assert.equal(response.statusCode, 200, response.body);
      const [order] = response.json();
      assert.deepEqual(order.items[0], {
        id: "4",
        productId: "5",
        productName: "Lanche",
        quantity: 3,
        notes: "Sem cebola",
      });
      assert.deepEqual(order.attendance, {
        id: "2",
        status: "CLOSED",
        closedAt: date.toISOString(),
      });
    }
    const orders = await app.inject({
      url: "/api/v1/orders",
      headers: { authorization: authorization("1") },
    });
    assert.equal(orders.json()[0].attendance.payments[0].amount, "49.50");
    const tableList = await app.inject({
      url: "/api/v1/tables",
      headers: { authorization: authorization("3") },
    });
    assert.equal(tableList.statusCode, 200, tableList.body);
    assert.equal(tableList.json()[0].menuUrl, undefined);
  } finally {
    await app.close();
  }
});
