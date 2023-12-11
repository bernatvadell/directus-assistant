import { defineEndpoint } from "@directus/extensions-sdk";
import { Accountability } from "@directus/types";
import OpenAI from "openai";
import { prepareAssistantSchema } from "./database";
import { getSimplifiedSchema } from "./schema";
import { FunctionsRegistered } from "./tools";
import type { JSONSchema7 } from "json-schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default defineEndpoint({
  id: "assistant",
  handler: async (router, { database, logger, getSchema, services }) => {
    const schema = await getSchema({ database });

    const { CollectionsService, FieldsService } = services;

    const collectionsService = new CollectionsService({
      schema,
      knex: database,
    });
    const fieldsService = new FieldsService({
      schema,
      knex: database,
    });

    await prepareAssistantSchema({ database, logger });

    const simplifiedSchema = await getSimplifiedSchema({
      collectionsService,
      fieldsService,
    });

    const toolsOpenAI: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      ...FunctionsRegistered.map<OpenAI.Chat.Completions.ChatCompletionTool>(
        (x) => ({
          type: "function",
          function: {
            name: x.metadata.name ?? "",
            parameters: (x.metadata.parameters ??
              ({
                type: "object",
                properties: {},
              } as JSONSchema7)) as any,
          },
        })
      ),
    ];

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
      try {
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

        const gptMessages: any[] = [
          {
            role: "system",
            content: `You are an assistant integrated into Directus. You will also clearly and concisely resolve technical doubts regarding the integration of Directus into the user's projects.
Directus base url (public url): ${process.env.PUBLIC_URL ?? "http://localhost:8055"}
You have access to its main features thanks to the registered functions.
When a function requires a payload for a collection, you must base the construction of the object on the following scheme:\n${JSON.stringify(
              simplifiedSchema,
              undefined,
              0
            )}
Respond in MARKDOWN format.`,
          },
          ...conversationMessages.map((x) => ({
            role: x.role,
            content: x.content,
          })),
        ];

        while (retries++ < 10) {
          const result = await openai.chat.completions.create({
            model: "gpt-4-1106-preview",
            n: 1,
            tools: toolsOpenAI,
            messages: gptMessages,
          });
          const choice = result.choices[0];

          if (!choice) break;
          gptMessages.push(choice.message);

          if (choice.message.tool_calls) {
            for (const toolCall of choice.message.tool_calls) {
              switch (toolCall.type) {
                case "function":
                  const functionMeta = FunctionsRegistered.find(
                    (x) => x.metadata.name === toolCall.function.name
                  );

                  if (!functionMeta) {
                    gptMessages.push({
                      tool_call_id: toolCall.id,
                      role: "tool",
                      name: toolCall.function.name,
                      content: `Function not exists`,
                    });
                    continue;
                  }

                  logger.info(
                    `Executing function "${toolCall.function.name}", with args: ${toolCall.function.arguments}`
                  );

                  const args = JSON.parse(toolCall.function.arguments);

                  try {
                    // TODO: Pending implement tsyringe or similar to resolve target
                    const target = new functionMeta.target();
                    const result = await functionMeta.handler.apply(target, [
                      {
                        accountability,
                        args,
                        database,
                        schema,
                        services,
                      },
                    ]);
                    gptMessages.push({
                      tool_call_id: toolCall.id,
                      role: "tool",
                      name: toolCall.function.name,
                      content: result
                        ? JSON.stringify(result)
                        : "Function executed successfully",
                    });
                  } catch (e: any) {
                    logger.error(
                      `An error ocurred executing function: ${e.message}`
                    );
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
      } catch (e) {
        logger.error(e, "Internal server error");
        return res.status(500).send({ ok: false });
      }
    });
  },
});
