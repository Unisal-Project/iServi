import type { FastifyReply, FastifyRequest } from "fastify";
import { settingsSchema } from "./dto/settings.dto.js";
import type { SettingsService } from "./settings.service.js";
export class SettingsController {
  constructor(private readonly service: SettingsService) {}
  async get(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await this.service.get());
  }
  async getOperation(request: FastifyRequest, reply: FastifyReply) {
    const { dayCutoffHour, serviceFeeRate } = await this.service.get();
    return reply.send({
      dayCutoffHour,
      ...(request.user.role !== "PLATFORM_ADMIN" && { serviceFeeRate }),
    });
  }
  async getPublic(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await this.service.getPublic());
  }
  async save(request: FastifyRequest, reply: FastifyReply) {
    return reply.send(
      await this.service.save(settingsSchema.parse(request.body)),
    );
  }

  async removeBanner(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await this.service.removeBanner());
  }

  async uploadBanner(request: FastifyRequest, reply: FastifyReply) {
    if (!request.isMultipart()) {
      return reply
        .status(415)
        .send({ message: "Envie a imagem usando multipart/form-data" });
    }
    const image = await request.file();
    if (!image)
      return reply.status(400).send({ message: "Imagem não enviada" });
    return reply.send(
      await this.service.uploadBanner({
        buffer: await image.toBuffer(),
        originalName: image.filename,
        mimeType: image.mimetype,
      }),
    );
  }
}
