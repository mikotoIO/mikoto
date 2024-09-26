import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPIObject, ReferenceObject } from "openapi3-ts/oas30";
import { generateZodClientFromOpenAPI } from "openapi-zod-client";

type ExtendedOpenAPIObject = OpenAPIObject & {
  websocket?: {
    commands: Record<string, ReferenceObject>;
    events: Record<string, ReferenceObject>;
  };
};

const objectMap = <T, U>(
  obj: Record<string, T>,
  fn: (value: T, key: string, index: number) => U
): Record<string, U> =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value], index) => [
      key,
      fn(value, key, index),
    ])
  );

function generateWebsocket(openApiDoc: ExtendedOpenAPIObject) {
  const { websocket } = openApiDoc;
  if (!websocket) {
    return {
      commands: {},
      events: {},
    };
  }

  const { commands, events } = websocket;
  return {
    commands: objectMap(commands, (value) => {
      return {
        schema: value.$ref.split("/").pop(),
      };
    }),
    events: objectMap(events, (value) => {
      return {
        schema: value.$ref.split("/").pop(),
      };
    }),
  };
}

const main = async () => {
  const openApiDoc = (await SwaggerParser.parse(
    "http://0.0.0.0:9503/api.json"
  )) as ExtendedOpenAPIObject;
  const result = await generateZodClientFromOpenAPI({
    openApiDoc,
    distPath: "./src/api.gen.ts",
    templatePath: "./generator/template.hbs",
    options: {
      withAlias: true,
      shouldExportAllSchemas: true,
      additionalPropertiesDefaultValue: false,
      api: openApiDoc,
      websocket: generateWebsocket(openApiDoc),
    },
  });
};

main();
