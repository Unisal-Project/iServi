import type { UserRole } from "../modules/users/entity/user.entity.js";
import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload:
      | FastifyJWT["user"]
      | {
          purpose: "customer-payment-confirmation";
          attendanceId: string;
          sessionId: string;
        };

    user: {
      id: string;
      email: string;
      role: UserRole;
      /** users.token_version na emissão; ausente em tokens antigos (= 0). */
      tv?: number;
    };
  }
}
