import { TableService } from "./table.service.js";
import { FastifyReply, FastifyRequest } from "fastify";

import { createTableSchema } from "./dto/create-table.dto.js";
import { tableIdSchema } from "./dto/table-id.dto.js";
import { tableTokenSchema } from "./dto/table-token.dto.js";
import { tableStatusChangeSchema } from "./dto/table-status-change.dto.js";
import { updateTableSchema } from "./dto/update-table.dto.js";

function withoutTableToken<T extends { menuUrl: string }>(
  request: FastifyRequest,
  table: T,
) {
  if (request.user?.role !== "PLATFORM_ADMIN") return table;
  const { menuUrl: _menuUrl, ...supportTable } = table;
  return supportTable;
}

export class TableController {
  constructor(private readonly tableService: TableService) {}

  async changeStatus(request: FastifyRequest, reply: FastifyReply) {
    const params = tableIdSchema.parse(request.params);
    const change = tableStatusChangeSchema.parse(request.body);
    reply.header("Cache-Control", "no-store");
    return withoutTableToken(
      request,
      await this.tableService.changeStatus(params, change),
    );
  }

  async getTableByToken(request: FastifyRequest, reply: FastifyReply) {
    const { token } = tableTokenSchema.parse(request.params);
    reply.header("Cache-Control", "no-store");
    return this.tableService.getTableByToken(token);
  }

  async getQrCode(request: FastifyRequest, reply: FastifyReply) {
    const params = tableIdSchema.parse(request.params);
    const image = await this.tableService.getQrCode(params);
    return reply
      .type("image/png")
      .header("Cache-Control", "no-store")
      .header("Content-Disposition", `inline; filename="mesa-${params.id}.png"`)
      .send(image);
  }

  async createTable(request: FastifyRequest, reply: FastifyReply) {
    const table = createTableSchema.safeParse(request.body);

    if (!table.success) {
      return reply.status(400).send({ error: "Invalid table data" });
    }

    return withoutTableToken(
      request,
      await this.tableService.createTable(table.data),
    );
  }

  async deleteTable(request: FastifyRequest, reply: FastifyReply) {
    const params = tableIdSchema.parse(request.params);

    return withoutTableToken(
      request,
      await this.tableService.deleteTable(params),
    );
  }

  async editTable(request: FastifyRequest, reply: FastifyReply) {
    const params = tableIdSchema.parse(request.params);
    const data = updateTableSchema.parse(request.body);

    return withoutTableToken(
      request,
      await this.tableService.editTable(params, data),
    );
  }

  async getTableById(request: FastifyRequest, reply: FastifyReply) {
    reply.header("Cache-Control", "no-store");
    const tableId = tableIdSchema.safeParse(request.params);

    if (!tableId.success) {
      return reply.status(400).send({ error: "Invalid table id" });
    }

    return withoutTableToken(
      request,
      await this.tableService.getTableById(tableId.data),
    );
  }

  async getAllTables(request: FastifyRequest, reply: FastifyReply) {
    reply.header("Cache-Control", "no-store");
    const tables = await this.tableService.getAllTables();
    return tables.map((table) => withoutTableToken(request, table));
  }
}
