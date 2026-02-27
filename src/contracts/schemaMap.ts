import Ajv, { type ValidateFunction } from "ajv";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const addFormats = require("ajv-formats");

const ctxSchema = require("./ctx.schema.json");
const displaySchema = require("./display.schema.json");
const contentJobSchema = require("./contentJob.schema.json");
const claimDisplayInputSchema = require("./claimDisplayInput.schema.json");
const revokeAssignmentInputSchema = require("./revokeAssignmentInput.schema.json");
const renewAssignmentInputSchema = require("./renewAssignmentInput.schema.json");
const orchestrateDisplayInputSchema = require("./orchestrateDisplayInput.schema.json");

const documentSchema = require("./templates/document.v2.schema.json");
const stackSchema = require("./templates/stack.v2.schema.json");
const cardsSchema = require("./templates/cards.v2.schema.json");
const pdfSchema = require("./templates/pdf.v2.schema.json");
const imageSchema = require("./templates/image.v2.schema.json");
const imageGallerySchema = require("./templates/imageGallery.v1.schema.json");
const imageListSchema = require("./templates/imageList.v1.schema.json");
const listSchema = require("./templates/list.v2.schema.json");
const kvSchema = require("./templates/kv.v2.schema.json");
const tickerSchema = require("./templates/ticker.v2.schema.json");
const chartSchema = require("./templates/chart.v2.schema.json");
const alertSchema = require("./templates/alert.v2.schema.json");
const youtubeSchema = require("./templates/youtube.v2.schema.json");

const ajv = new Ajv.default({ allErrors: true, strict: false });
addFormats(ajv);

ajv.addSchema(ctxSchema, "ctx");
ajv.addSchema(displaySchema, "display");
ajv.addSchema(contentJobSchema, "contentJob");
ajv.addSchema(claimDisplayInputSchema, "claimDisplayInput");
ajv.addSchema(revokeAssignmentInputSchema, "revokeAssignmentInput");
ajv.addSchema(renewAssignmentInputSchema, "renewAssignmentInput");
ajv.addSchema(orchestrateDisplayInputSchema, "orchestrateDisplayInput");

const templateSchemas: Record<string, object> = {
  "document.v2": documentSchema,
  "stack.v2": stackSchema,
  "cards.v2": cardsSchema,
  "pdf.v2": pdfSchema,
  "image.v2": imageSchema,
  "imageGallery.v1": imageGallerySchema,
  "imageList.v1": imageListSchema,
  "list.v2": listSchema,
  "kv.v2": kvSchema,
  "ticker.v2": tickerSchema,
  "chart.v2": chartSchema,
  "alert.v2": alertSchema,
  "youtube.v2": youtubeSchema
};

const templateValidators = new Map<string, ValidateFunction>();

for (const [key, schema] of Object.entries(templateSchemas)) {
  templateValidators.set(key, ajv.compile(schema));
}

export function validateTemplate(templateId: string, data: unknown) {
  const validate = templateValidators.get(templateId);
  if (!validate) {
    return { ok: false, errors: [`Template ${templateId} not registered`] };
  }
  const ok = validate(data);
  return { ok: !!ok, errors: validate.errors || [] };
}

export function validateSchemaById(
  id:
    | "ctx"
    | "display"
    | "contentJob"
    | "claimDisplayInput"
    | "revokeAssignmentInput"
    | "renewAssignmentInput"
    | "orchestrateDisplayInput",
  data: unknown
) {
  const validate = ajv.getSchema(id);
  if (!validate) return { ok: false, errors: [`Schema ${id} not registered`] };
  const ok = validate(data);
  return { ok: !!ok, errors: validate.errors || [] };
}

export const templateSchemaMap = templateSchemas;
