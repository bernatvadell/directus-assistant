export async function getSimplifiedSchema({
  collectionsService,
  fieldsService,
}: {
  collectionsService: any;
  fieldsService: any;
}) {
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
