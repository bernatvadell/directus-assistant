import { GPTFunction, GPTFunctionContext } from "./decorator";

export class GPTItemsFunctions {
  @GPTFunction({
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string" },
        query: {
          type: "object",
          properties: {
            fields: { type: "array", items: { type: "string" } },
            filter: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
            search: { type: "string" },
            sort: { type: "array", items: { type: "string" } },
            limit: { type: "number" },
            offset: { type: "number" },
            page: { type: "number" },
            deep: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
            alias: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
          },
        },
      },
      required: ["collection"],
    },
  })
  async itemsCount({
    accountability,
    database,
    schema,
    services: { MetaService },
    args,
  }: GPTFunctionContext) {
    const service = new MetaService({
      accountability,
      knex: database,
      schema,
    });

    if (args.query && Object.getOwnPropertyNames(args.query).length > 0) {
      return await service.filterCount(args.collection, args.query);
    } else {
      return await service.totalCount(args.collection);
    }
  }

  @GPTFunction({
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string" },
        query: {
          type: "object",
          properties: {
            fields: { type: "array", items: { type: "string" } },
            filter: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
            search: { type: "string" },
            sort: { type: "array", items: { type: "string" } },
            limit: { type: "number" },
            offset: { type: "number" },
            page: { type: "number" },
            deep: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
            alias: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
          },
        },
      },
      required: ["collection"],
    },
  })
  async itemsReadMany({
    accountability,
    database,
    schema,
    services: { ItemsService },
    args,
  }: GPTFunctionContext) {
    const service = new ItemsService(args.collection, {
      accountability,
      knex: database,
      schema,
    });

    return await service.readByQuery(args.query ?? {});
  }

  @GPTFunction({
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string" },
        payload: {
          type: "object",
          properties: {},
          additionalProperties: true,
          $comment: "See directus schema to know what properties can be used",
        },
      },
      required: ["collection", "payload"],
    },
  })
  async itemsCreateOne({
    accountability,
    database,
    schema,
    services: { ItemsService },
    args,
  }: GPTFunctionContext) {
    if (!args.payload) {
      return "ERROR: payload is required";
    }
    const service = new ItemsService(args.collection, {
      accountability,
      knex: database,
      schema,
    });

    return await service.createOne(args.payload);
  }

  @GPTFunction({
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string" },
        payload: {
          type: "array",
          items: { type: "object", additionalProperties: true },
        },
      },
      required: ["collection", "payload"],
    },
  })
  async itemsCreateMany({
    accountability,
    database,
    schema,
    services: { ItemsService },
    args,
  }: GPTFunctionContext) {
    const service = new ItemsService(args.collection, {
      accountability,
      knex: database,
      schema,
    });

    return await service.createMany(args.payload);
  }

  @GPTFunction({
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
          $comment: "Be sure to use the item id",
        },
        payload: { type: "object", additionalProperties: true },
      },
      required: ["collection", "key", "payload"],
    },
  })
  async itemsUpdateOne({
    accountability,
    database,
    schema,
    services: { ItemsService },
    args,
  }: GPTFunctionContext) {
    const service = new ItemsService(args.collection, {
      accountability,
      knex: database,
      schema,
    });

    return await service.updateOne(args.key, args.payload);
  }

  @GPTFunction({
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string" },
        payload: { type: "object", additionalProperties: true },
        query: {
          type: "object",
          properties: {
            fields: { type: "array", items: { type: "string" } },
            filter: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
            search: { type: "string" },
            sort: { type: "array", items: { type: "string" } },
            limit: { type: "number" },
            offset: { type: "number" },
            page: { type: "number" },
            deep: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
            alias: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
          },
        },
      },
      required: ["collection", "payload", "query"],
    },
  })
  async itemsUpdateByQuery({
    accountability,
    database,
    schema,
    services: { ItemsService },
    args,
  }: GPTFunctionContext) {
    const service = new ItemsService(args.collection, {
      accountability,
      knex: database,
      schema,
    });

    return await service.updateByQuery(args.query, args.payload);
  }

  @GPTFunction({
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
          $comment: "Be sure to use the item id",
        },
      },
      required: ["collection", "key"],
    },
  })
  async itemsDeleteOne({
    accountability,
    database,
    schema,
    services: { ItemsService },
    args,
  }: GPTFunctionContext) {
    const service = new ItemsService(args.collection, {
      accountability,
      knex: database,
      schema,
    });

    return await service.deleteOne(args.key);
  }

  @GPTFunction({
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string" },
        query: {
          type: "object",
          properties: {
            fields: { type: "array", items: { type: "string" } },
            filter: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
            search: { type: "string" },
            sort: { type: "array", items: { type: "string" } },
            limit: { type: "number" },
            offset: { type: "number" },
            page: { type: "number" },
            deep: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
            alias: {
              type: "object",
              properties: {},
              additionalProperties: true,
            },
          },
        },
      },
      required: ["collection", "query"],
    },
  })
  async itemsDeleteByQuery({
    accountability,
    database,
    schema,
    services: { ItemsService },
    args,
  }: GPTFunctionContext) {
    const service = new ItemsService(args.collection, {
      accountability,
      knex: database,
      schema,
    });

    return await service.deleteByQuery(args.query);
  }
}
