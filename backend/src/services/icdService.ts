import { UserInputError } from "apollo-server-errors";
import { ContextType } from "../graphql/context";
import { requireRole, requireAuth } from "../utils/auth";

const DEFAULT_BASE_URL = "http://localhost";
const DEFAULT_RELEASE = "2026-01";
const DEFAULT_LINEARIZATION = "mms";
const DEFAULT_LANGUAGE = "en";

function config() {
  return {
    baseUrl: process.env.ICD_API_BASE_URL || DEFAULT_BASE_URL,
    release: process.env.ICD_RELEASE || DEFAULT_RELEASE,
    linearization: process.env.ICD_LINEARIZATION || DEFAULT_LINEARIZATION,
    language: process.env.ICD_LANGUAGE || DEFAULT_LANGUAGE,
  };
}

function valueOf(label: any) {
  if (!label) return "";
  if (typeof label === "string") return label;
  return label["@value"] || label.value || "";
}

function entityIdFromUri(uri: string) {
  if (!uri) return "";
  const firstUri = uri.split(/\s*(?:&|\/)\s*(?=http)/)[0];
  const clean = firstUri.split("?")[0].replace(/\/$/, "");
  const marker = "/mms/";
  const markerIndex = clean.indexOf(marker);
  if (markerIndex >= 0) {
    return clean.substring(markerIndex + marker.length);
  }
  return clean.substring(clean.lastIndexOf("/") + 1);
}

function normalizeIcdUri(raw: string) {
  if (!raw) return "";
  return raw.split(/\s*(?:&|\/)\s*(?=http)/)[0].trim();
}

function stripHtml(text: string) {
  return text.replace(/<[^>]*>/g, "");
}

function mapEntity(entity: any) {
  const uri = entity["@id"] || entity.uri || "";
  return {
    id: entityIdFromUri(uri),
    uri,
    code: entity.code || null,
    title: valueOf(entity.title || entity.label),
    definition: valueOf(entity.definition),
    classKind: entity.classKind || null,
    foundationUri: entity.source || entity.foundationReference || null,
    browserUrl: entity.browserUrl || null,
    hasChildren: Array.isArray(entity.child) && entity.child.length > 0,
    childUris: entity.child || [],
  };
}

async function icdGet(path: string, language?: string) {
  const { baseUrl, language: defaultLanguage } = config();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      "API-Version": "v2",
      "Accept-Language": language || defaultLanguage,
    },
  });
  if (!response.ok) {
    throw new UserInputError(`ICD-11 API алдаа: ${response.status}`);
  }
  return response.json();
}

async function fetchEntityByUri(uri: string, language?: string) {
  const { release, linearization } = config();
  const id = entityIdFromUri(uri);
  return icdGet(`/icd/release/11/${release}/${linearization}/${id}`, language);
}

export async function icd11RootChapters(_: any, { language }: { language?: string }, ctx: ContextType) {
  requireAuth(ctx);
  const { release, linearization } = config();
  const root = await icdGet(`/icd/release/11/${release}/${linearization}`, language);
  const childUris: string[] = root.child || [];
  const entities = await Promise.all(childUris.map((uri) => fetchEntityByUri(uri, language)));
  return entities.map(mapEntity);
}

export async function icd11Children(_: any, { uri, language }: { uri: string; language?: string }, ctx: ContextType) {
  requireAuth(ctx);
  const parent = await fetchEntityByUri(uri, language);
  const childUris: string[] = parent.child || [];
  const entities = await Promise.all(childUris.map((childUri) => fetchEntityByUri(childUri, language)));
  return entities.map(mapEntity);
}

export async function icd11Search(_: any, { q, language }: { q: string; language?: string }, ctx: ContextType) {
  requireRole("doctor", "nurse", "superadmin")(ctx);
  const { release, linearization } = config();
  const params = new URLSearchParams({
    q,
    flatResults: "true",
    medicalCodingMode: "true",
  });
  const result = await icdGet(`/icd/release/11/${release}/${linearization}/search?${params.toString()}`, language);
  const destinationEntities = result.destinationEntities || result.entities || [];
  return destinationEntities.map((entity: any) => ({
    id: entityIdFromUri(entity.stemId || entity.id || entity["@id"] || entity.theCode || ""),
    uri: normalizeIcdUri(entity.stemId || entity.id || entity["@id"] || ""),
    code: entity.theCode || entity.code || null,
    title: stripHtml(valueOf(entity.title)),
    definition: valueOf(entity.definition),
    classKind: entity.classKind || null,
    foundationUri: entity.foundationUri || null,
    browserUrl: entity.browserUrl || null,
    hasChildren: false,
    childUris: [],
  }));
}
