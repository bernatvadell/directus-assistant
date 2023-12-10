import { defineEndpoint } from "@directus/extensions-sdk";
import { Accountability } from "@directus/types";
import OpenAI from "openai";
import { prepareAssistantSchema } from "./database";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default defineEndpoint({
  id: "assistant",
  handler: async (router, { database, logger, getSchema, services }) => {
    const schema = await getSchema({ database });

    const { ItemsService, CollectionsService, FieldsService, MetaService } =
      services;

    async function getSimplifiedSchema() {
      const collectionsService = new CollectionsService({
        schema,
        knex: database,
      });
      const fieldsService = new FieldsService({
        schema,
        knex: database,
      });

      const collections = await collectionsService.readByQuery();
      const output: any[] = [];

      for (const collection of collections) {
        if (collection.collection.indexOf("directus_") === 0) continue;
        if (collection.meta?.hidden) continue;

        const fields = await fieldsService.readAll(collection.collection);
        output.push({
          collection: collection.collection,
          fields: fields.map((field: any) => ({
            name: field.field,
            type: field.type,
            pk: field.schema?.is_primary_key ?? false,
          })),
        });
      }

      return output;
    }

    await prepareAssistantSchema(database);

    router.get("/messages", async (req, res) => {
      const accountability: Accountability | null =
        (req as any).accountability ?? null;
      if (accountability?.user == null) {
        res.status(403);
        return res.send({
          ok: false,
          error: `You don't have permission to access this.`,
        });
      }

      const items = await database("assistant_chat")
        .where({ user: accountability.user })
        .orderBy("created_at", "asc");

      if (items.length === 0) {
        const welcomeMessage: any = {
          user: accountability.user,
          role: "assistant",
          content: "Hello! How can I help you?",
        };
        const [{ id }] = await database("assistant_chat")
          .insert(welcomeMessage)
          .returning("id");
        welcomeMessage.id = id;
        items.push(welcomeMessage);
      }

      return res.status(200).send({ ok: true, data: items });
    });

    router.post("/send", async (req, res) => {
      const accountability: Accountability | null =
        (req as any).accountability ?? null;
      if (accountability?.user == null) {
        res.status(403);
        return res.send({
          ok: false,
          error: `You don't have permission to access this.`,
        });
      }

      const userMessage: any = {
        user: accountability.user,
        role: "user",
        content: req.body.content,
      };
      const [{ id: userMessageId }] = await database("assistant_chat")
        .insert({
          user: accountability.user,
          role: "user",
          content: req.body.content,
        })
        .returning("id");

      userMessage.id = userMessageId;

      // Chat context
      let conversationMessages = await database("assistant_chat")
        .where({ user: accountability.user })
        .orderBy("created_at", "desc")
        .limit(10);
      conversationMessages = conversationMessages
        .map((x) => ({ ...x, created_at: new Date(x.created_at) }))
        .sort((a, b) => a.created_at - b.created_at);
      let retries = 0;
      const generatedMessagesId: number[] = [];
      const simplifiedSchema = await getSimplifiedSchema();

      const gptMessages: any[] = [
        {
          role: "system",
          content: "You're a assistant specialized in Directus.",
        },
        {
          role: "system",
          content: `This is the Directus items schema:\n${JSON.stringify(
            simplifiedSchema,
            undefined,
            0
          )}`,
        },
        ...conversationMessages.map((x) => ({
          role: x.role,
          content: x.content,
        })),
      ];

      while (retries++ < 10) {
        logger.info(gptMessages, "Executing GPT with messages");
        const result = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-1106",
          n: 1,
          tools: [
            {
              type: "function",
              function: {
                name: "itemsCount",
                parameters: {
                  type: "object",
                  properties: {
                    collection: { type: "string" },
                    query: {
                      type: "object",
                      properties: {
                        fields: { type: "array", items: { type: "string" } },
                        filter: { type: "object" },
                        search: { type: "string" },
                        sort: { type: "array", items: { type: "string" } },
                        limit: { type: "number" },
                        offset: { type: "number" },
                        page: { type: "number" },
                        deep: { type: "object" },
                        alias: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "function",
              function: {
                name: "itemsReadMany",
                parameters: {
                  type: "object",
                  properties: {
                    collection: { type: "string" },
                    query: {
                      type: "object",
                      properties: {
                        fields: { type: "array", items: { type: "string" } },
                        filter: { type: "object" },
                        search: { type: "string" },
                        sort: { type: "array", items: { type: "string" } },
                        limit: { type: "number" },
                        offset: { type: "number" },
                        page: { type: "number" },
                        deep: { type: "object" },
                        alias: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "function",
              function: {
                name: "itemsCreateOne",
                parameters: {
                  type: "object",
                  properties: {
                    collection: { type: "string" },
                    payload: { type: "object" },
                  },
                },
              },
            },
            {
              type: "function",
              function: {
                name: "itemsCreateMany",
                parameters: {
                  type: "object",
                  properties: {
                    collection: { type: "string" },
                    payload: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
            {
              type: "function",
              function: {
                name: "itemsUpdateOne",
                parameters: {
                  type: "object",
                  properties: {
                    collection: { type: "string" },
                    key: {
                      oneOf: [
                        { type: "string" },
                        { type: "integer" },
                        { type: "string", format: "uuid" },
                      ],
                    },
                    payload: { type: "object" },
                  },
                },
              },
            },
            {
              type: "function",
              function: {
                name: "itemsUpdateByQuery",
                parameters: {
                  type: "object",
                  properties: {
                    collection: { type: "string" },
                    payload: { type: "object" },
                    query: {
                      type: "object",
                      properties: {
                        fields: { type: "array", items: { type: "string" } },
                        filter: { type: "object" },
                        search: { type: "string" },
                        sort: { type: "array", items: { type: "string" } },
                        limit: { type: "number" },
                        offset: { type: "number" },
                        page: { type: "number" },
                        deep: { type: "object" },
                        alias: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "function",
              function: {
                name: "itemsDeleteOne",
                parameters: {
                  type: "object",
                  properties: {
                    collection: { type: "string" },
                    key: {
                      oneOf: [
                        { type: "string" },
                        { type: "integer" },
                        { type: "string", format: "uuid" },
                      ],
                    },
                  },
                },
              },
            },
            {
              type: "function",
              function: {
                name: "itemsDeleteByQuery",
                parameters: {
                  type: "object",
                  properties: {
                    collection: { type: "string" },
                    query: {
                      type: "object",
                      properties: {
                        fields: { type: "array", items: { type: "string" } },
                        filter: { type: "object" },
                        search: { type: "string" },
                        sort: { type: "array", items: { type: "string" } },
                        limit: { type: "number" },
                        offset: { type: "number" },
                        page: { type: "number" },
                        deep: { type: "object" },
                        alias: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          ],
          messages: gptMessages,
        });

        const choice = result.choices[0];

        if (!choice) break;

        gptMessages.push(choice.message);

        if (choice.message.tool_calls) {
          for (const toolCall of choice.message.tool_calls) {
            switch (toolCall.type) {
              case "function":
                logger.info(
                  `Executing function "${toolCall.function.name}", with args: ${toolCall.function.arguments}`
                );
                try {
                  switch (toolCall.function.name) {
                    case "itemsCount":
                      {
                        const params = JSON.parse(toolCall.function.arguments);
                        const service = new MetaService({
                          accountability,
                          knex: database,
                          schema,
                        });
                        if (
                          params.query &&
                          Object.getOwnPropertyNames(params.query).length > 0
                        ) {
                          const result = await service.filterCount(
                            params.collection,
                            params.query
                          );
                          gptMessages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: toolCall.function.name,
                            content: JSON.stringify(result),
                          });
                        } else {
                          const result = await service.totalCount(
                            params.collection
                          );
                          gptMessages.push({
                            tool_call_id: toolCall.id,
                            role: "tool",
                            name: toolCall.function.name,
                            content: JSON.stringify(result),
                          });
                        }
                      }
                      break;
                    case "itemsCreateOne":
                      {
                        const params = JSON.parse(toolCall.function.arguments);
                        const service = new ItemsService(params.collection, {
                          accountability,
                          knex: database,
                          schema,
                        });
                        const result = await service.createOne(params.payload);
                        gptMessages.push({
                          tool_call_id: toolCall.id,
                          role: "tool",
                          name: toolCall.function.name,
                          content: JSON.stringify(result),
                        });
                      }
                      break;
                    case "itemsCreateMany":
                      {
                        const params = JSON.parse(toolCall.function.arguments);
                        const service = new ItemsService(params.collection, {
                          accountability,
                          knex: database,
                          schema,
                        });
                        const result = await service.createOne(params.payload);
                        gptMessages.push({
                          tool_call_id: toolCall.id,
                          role: "tool",
                          name: toolCall.function.name,
                          content: JSON.stringify(result),
                        });
                      }
                      break;
                    case "itemsReadMany":
                      {
                        const params = JSON.parse(toolCall.function.arguments);
                        const service = new ItemsService(params.collection, {
                          accountability,
                          knex: database,
                          schema,
                        });
                        const result = await service.readByQuery(params.query);
                        gptMessages.push({
                          tool_call_id: toolCall.id,
                          role: "tool",
                          name: toolCall.function.name,
                          content: JSON.stringify(result),
                        });
                      }
                      break;
                    case "itemsUpdateOne":
                      {
                        const params = JSON.parse(toolCall.function.arguments);
                        const service = new ItemsService(params.collection, {
                          accountability,
                          knex: database,
                          schema,
                        });
                        const result = await service.updateOne(
                          params.key,
                          params.payload
                        );
                        gptMessages.push({
                          tool_call_id: toolCall.id,
                          role: "tool",
                          name: toolCall.function.name,
                          content: JSON.stringify(result),
                        });
                      }
                      break;
                    case "itemsUpdateByQuery":
                      {
                        const params = JSON.parse(toolCall.function.arguments);
                        const service = new ItemsService(params.collection, {
                          accountability,
                          knex: database,
                          schema,
                        });
                        const result = await service.updateByQuery(
                          params.query,
                          params.payload
                        );
                        gptMessages.push({
                          tool_call_id: toolCall.id,
                          role: "tool",
                          name: toolCall.function.name,
                          content: JSON.stringify(result),
                        });
                      }
                      break;
                    case "itemsDeleteOne":
                      {
                        const params = JSON.parse(toolCall.function.arguments);
                        const service = new ItemsService(params.collection, {
                          accountability,
                          knex: database,
                          schema,
                        });
                        const result = await service.deleteOne(params.key);
                        gptMessages.push({
                          tool_call_id: toolCall.id,
                          role: "tool",
                          name: toolCall.function.name,
                          content: JSON.stringify(result),
                        });
                      }
                      break;
                    case "itemsDeleteByQuery":
                      {
                        const params = JSON.parse(toolCall.function.arguments);
                        const service = new ItemsService(params.collection, {
                          accountability,
                          knex: database,
                          schema,
                        });
                        const result = await service.deleteByQuery(
                          params.query
                        );
                        gptMessages.push({
                          tool_call_id: toolCall.id,
                          role: "tool",
                          name: toolCall.function.name,
                          content: JSON.stringify(result),
                        });
                      }
                      break;
                    default:
                      gptMessages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: toolCall.function.name,
                        content: `Function not exists`,
                      });
                      break;
                  }
                } catch (e: any) {
                  gptMessages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: toolCall.function.name,
                    content: `Exception ocurred executing function: ${e.toString()}`,
                  });
                }
                break;
              default:
                throw new Error(`Tool call ${toolCall.type} not supported`);
            }
          }
        } else {
          const gptMessage: any = {
            user: accountability.user,
            role: choice.message.role,
            content: choice.message.content ?? "",
          };
          const [assistantMessage] = await database("assistant_chat")
            .insert(gptMessage)
            .returning("id");
          gptMessage.id = assistantMessage.id;
          generatedMessagesId.push(assistantMessage.id);
          break;
        }
      }

      const am = await database("assistant_chat").whereIn(
        "id",
        generatedMessagesId
      );

      return res.send({
        ok: true,
        data: { user_message: userMessage, assistant_messages: am },
      });
    });
  },
});
