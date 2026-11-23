import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { canManageUsers } from "../../shared/api-access.js";
import { authenticate } from "../../shared/authenticate.js";
import type { UserRepository } from "./repository/user.repository.js";
import { UserService } from "./user.service.js";
import { UserController } from "./user.controller.js";
import { BcryptPasswordHasher } from "../../config/hash/bcrypt-password-hasher.js";

export async function registerUserRoutes(
  app: FastifyInstance,
  options: { repository?: UserRepository } = {},
) {
  const repository =
    options.repository ??
    new (
      await import("./repository/prisma-user.repository.js")
    ).PrismaUserRepository();
  const controller = new UserController(
    new UserService(repository, new BcryptPasswordHasher()),
  );
  const requireManager = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    const id = /^\d+$/.test(request.user.id) ? BigInt(request.user.id) : null;
    const user = id === null ? null : await repository.findById(id);
    if (
      !canManageUsers(request.user.role) ||
      !user?.active ||
      !canManageUsers(user.role)
    ) {
      return reply.status(403).send({ message: "Acesso negado" });
    }
  };

  app.get("/users", { preHandler: requireManager }, (request, reply) =>
    controller.getAll(request, reply),
  );
  app.get("/users/:id", { preHandler: requireManager }, (request, reply) =>
    controller.getById(request, reply),
  );
  app.patch("/users/:id", { preHandler: requireManager }, (request, reply) =>
    controller.update(request, reply),
  );
  app.delete("/users/:id", { preHandler: requireManager }, (request, reply) =>
    controller.delete(request, reply),
  );
}
