import type { Knex } from "knex";
import { Logger } from "pino";

export async function prepareAssistantSchema({
  database,
  logger,
}: {
  database: Knex<any, any[]>;
  logger: Logger;
}) {
  try {
    // TODO: Use migrations system instead
    // await database.schema.dropTableIfExists("assistant_chat");
    const existsTable = await database.schema.hasTable("assistant_chat");
    if (!existsTable) {
      await database.schema.createTable("assistant_chat", (table) => {
        table.increments("id").primary();
        table.uuid("user").notNullable().references("directus_users.id");
        table.string("role").notNullable();
        table.text("content").notNullable();
        table
          .timestamp("created_at")
          .notNullable()
          .defaultTo(database.fn.now());
      });
    }
  } catch (e) {
    logger.error(e, "An error ocurred creating 'assistant_chat' table");
  }
}
