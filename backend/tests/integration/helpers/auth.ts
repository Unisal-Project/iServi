import type { UserRole } from "../../../src/modules/users/entity/user.entity.js";
import type { FastifyInstance } from "fastify";
import { createUser } from "./fixtures.js";

export async function createAuthenticatedUser(
  app: FastifyInstance,
  role: UserRole = "ADMIN",
) {
  const user = await createUser(role);

  const token = app.jwt.sign({
    id: user.id.toString(),
    email: user.email,
    role: user.role,
    tv: user.tokenVersion,
  });

  return {
    user,
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
}
