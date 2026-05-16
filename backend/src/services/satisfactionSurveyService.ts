import { UserInputError } from "apollo-server-errors";
import { Appointment } from "../models/appointmentModel";
import { Patient } from "../models/patientModel";
import { SatisfactionSurvey } from "../models/satisfactionSurveyModel";
import { SatisfactionSurveyTemplate } from "../models/satisfactionSurveyTemplateModel";
import { ContextType } from "../graphql/context";
import { requireAuth, requireRole } from "../utils/auth";
import { logAudit } from "./auditService";

const OCCUPATIONS = ["teacher", "student", "staff"];
const STUDENT_HOUSING = ["dormitory", "home", "rental", ""];
const VISIT_FREQUENCIES = ["once", "multiple", "regular", ""];
const SURVEY_REQUIRED_AFTER_COMPLETED_SERVICES = 3;

const DEFAULT_TEMPLATE = {
  title: "МУИС-ийн эмнэлгийн сэтгэл ханамжийн судалгаа",
  description: "Эмнэлгийн үйлчилгээний чанар, орчин нөхцөл, ажилтны харилцааг үнэлэх судалгаа.",
  questions: [
    { key: "doctor_overall", category: "Их эмч", label: "Та тус эмнэлгээс авсан үйлчилгээндээ үнэлэлт өгнө үү", order: 1, active: true },
    { key: "doctor_attitude", category: "Их эмч", label: "Эмчийн харилцааны соёл, хандлага, харилцаа", order: 2, active: true },
    { key: "doctor_skill", category: "Их эмч", label: "Эмчийн мэргэжлийн ур чадвар", order: 3, active: true },
    { key: "doctor_advice", category: "Их эмч", label: "Эрүүл мэндийн зөвлөгөө өгөх байдал", order: 4, active: true },
    { key: "doctor_first_aid", category: "Их эмч", label: "Эмчийн анхан шатны тусламж, үйлчилгээ үзүүлэх байдал", order: 5, active: true },
    { key: "doctor_student_care", category: "Их эмч", label: "Оюутнуудад эмчийн зүгээс санаа тавьдаг байдал", order: 6, active: true },
    { key: "doctor_training", category: "Их эмч", label: "Эрүүл мэндийн сургалт, танилцуулга хийх байдал", order: 7, active: true },
    { key: "covid_support", category: "Их эмч", label: "Ковид-19 цар тахлын үеийн эмч, эмнэлгийн ажилтнуудын оюутантай ажилласан байдал", order: 8, active: true },
    { key: "nurse_attitude", category: "Сувилагч, асрагч", label: "Сувилагчийн харилцаа хандлага", order: 9, active: true },
    { key: "nurse_skill", category: "Сувилагч, асрагч", label: "Сувилагчийн мэргэжлийн ур чадвар", order: 10, active: true },
    { key: "nurse_advice", category: "Сувилагч, асрагч", label: "Эмнэлгийн сургалт, таниулга, зөвлөгөө өгөх байдал", order: 11, active: true },
    { key: "assistant_attitude", category: "Сувилагч, асрагч", label: "Асрагчийн харилцаа, хандлага", order: 12, active: true },
    { key: "assistant_service", category: "Сувилагч, асрагч", label: "Асрагчийн ажил үйлчилгээ", order: 13, active: true },
    { key: "environment_equipment", category: "Эмнэлгийн үйлчилгээ", label: "Эмнэлгийн орчин нөхцөл, тоног төхөөрөмжийн хангалт", order: 14, active: true },
    { key: "medicine_supply", category: "Эмнэлгийн үйлчилгээ", label: "Эм тарианы хүрэлцээ, хангамж", order: 15, active: true },
  ],
};

function createVersion({
  version,
  title,
  description,
  questions,
  validFrom,
  validTo,
  updatedBy,
}: {
  version: number;
  title: string;
  description?: string;
  questions: any[];
  validFrom: Date;
  validTo?: Date;
  updatedBy?: string;
}) {
  return {
    version,
    title,
    description: description || "",
    questions,
    validFrom,
    validTo,
    updatedBy,
  };
}

function assertEnum(value: string, allowed: string[], message: string) {
  if (!allowed.includes(value)) throw new UserInputError(message);
}

function assertRatingScore(score: number) {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new UserInputError("Үнэлгээ 1-5 хооронд байх ёстой");
  }
}

function makeQuestionKey(label: string, index: number) {
  const normalized = label
    .toLowerCase()
    .replace(/[^a-z0-9а-яёөү]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return normalized || `question_${index + 1}`;
}

async function ensureActiveTemplate() {
  let template = await SatisfactionSurveyTemplate.findOne({
    active: true,
    $or: [{ archivedAt: { $exists: false } }, { archivedAt: null }],
  }).sort({ updatedAt: -1 });
  if (!template) {
    const validFrom = new Date();
    template = await SatisfactionSurveyTemplate.create({
      ...DEFAULT_TEMPLATE,
      active: true,
      currentVersion: 1,
      versions: [
        createVersion({
          version: 1,
          title: DEFAULT_TEMPLATE.title,
          description: DEFAULT_TEMPLATE.description,
          questions: DEFAULT_TEMPLATE.questions,
          validFrom,
        }),
      ],
    });
  } else if (!template.versions?.length) {
    const validFrom = template.createdAt || new Date();
    template.currentVersion = template.currentVersion || 1;
    template.versions = [
      createVersion({
        version: template.currentVersion,
        title: template.title,
        description: template.description || "",
        questions: template.questions,
        validFrom,
      }),
    ] as any;
    await template.save();
  }
  return template;
}

export async function getActiveSatisfactionSurveyTemplate() {
  const template = await ensureActiveTemplate();
  template.questions.sort((a: any, b: any) => a.order - b.order);
  return template;
}

export async function getMySatisfactionSurvey(_: any, __: any, ctx: ContextType) {
  requireAuth(ctx);

  return SatisfactionSurvey.findOne({ userId: ctx._id })
    .populate("templateId userId patientId")
    .sort({ createdAt: -1 });
}

export async function getMySatisfactionSurveyRequirement(_: any, __: any, ctx: ContextType) {
  requireAuth(ctx);

  const template = await ensureActiveTemplate();
  const patient = await Patient.findOne({ userId: ctx._id });
  const completedServiceCount = patient
    ? await Appointment.countDocuments({ patientId: patient._id, status: "completed" })
    : 0;
  const hasSubmittedCurrentVersion = Boolean(
    await SatisfactionSurvey.exists({
      userId: ctx._id,
      templateId: template._id,
      templateVersion: template.currentVersion || 1,
    })
  );

  return {
    required:
      completedServiceCount >= SURVEY_REQUIRED_AFTER_COMPLETED_SERVICES &&
      !hasSubmittedCurrentVersion,
    threshold: SURVEY_REQUIRED_AFTER_COMPLETED_SERVICES,
    completedServiceCount,
    hasSubmittedCurrentVersion,
    currentVersion: template.currentVersion || 1,
  };
}

export async function listSatisfactionSurveys(_: any, __: any, ctx: ContextType) {
  requireRole("superadmin", "doctor", "nurse", "receptionist")(ctx);

  return SatisfactionSurvey.find()
    .populate("templateId userId patientId")
    .sort({ createdAt: -1 })
    .limit(200);
}

export async function submitSatisfactionSurvey(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireAuth(ctx);

  assertEnum(input.occupation, OCCUPATIONS, "Эрхэлдэг ажлаа зөв сонгоно уу");
  assertEnum(input.studentHousing || "", STUDENT_HOUSING, "Оюутны байрлалын сонголт буруу байна");
  assertEnum(input.visitFrequency || "", VISIT_FREQUENCIES, "Үйлчлүүлсэн давтамжийн сонголт буруу байна");

  if (!Array.isArray(input.ratings) || input.ratings.length === 0) {
    throw new UserInputError("Үйлчилгээний чанарын үнэлгээг бөглөнө үү");
  }

  input.ratings.forEach((rating: any) => assertRatingScore(rating.score));
  if (input.overallRating !== undefined && input.overallRating !== null) {
    assertRatingScore(input.overallRating);
  }

  const patient = await Patient.findOne({ userId: ctx._id });
  const template = await ensureActiveTemplate();
  const activeQuestionKeys = new Set(
    template.questions.filter((question: any) => question.active).map((question: any) => question.key)
  );
  const submittedRatingKeys = new Set(input.ratings.map((rating: any) => rating.key));
  if ([...activeQuestionKeys].some((key) => !submittedRatingKeys.has(key))) {
    throw new UserInputError("Идэвхтэй бүх асуултад үнэлгээ өгнө үү");
  }
  const invalidRating = input.ratings.find((rating: any) => !activeQuestionKeys.has(rating.key));
  if (invalidRating) throw new UserInputError("Судалгааны асуултын мэдээлэл буруу байна");

  const survey = await SatisfactionSurvey.create({
    templateId: template._id,
    templateVersion: template.currentVersion || 1,
    userId: ctx._id,
    patientId: patient?._id,
    occupation: input.occupation,
    studentHousing: input.occupation === "student" ? input.studentHousing || "" : "",
    hasVisited: Boolean(input.hasVisited),
    visitFrequency: input.hasVisited ? input.visitFrequency || "" : "",
    servicesReceived: input.servicesReceived || [],
    wouldReturn: Boolean(input.wouldReturn),
    wouldReturnReason: input.wouldReturn ? "" : input.wouldReturnReason,
    improvementSuggestion: input.improvementSuggestion,
    ratings: input.ratings,
    overallRating: input.overallRating,
  });

  await logAudit({
    userId: ctx._id,
    action: "create",
    resource: "satisfaction_survey",
    resourceId: survey._id!.toString(),
    details: { ratings: input.ratings.length },
    ctx,
  });

  return survey.populate("templateId userId patientId");
}

export async function updateSatisfactionSurveyTemplate(
  _: any,
  { input }: { input: any },
  ctx: ContextType
) {
  requireRole("superadmin")(ctx);

  if (!input.title?.trim()) throw new UserInputError("Судалгааны гарчиг шаардлагатай");
  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    throw new UserInputError("Доод тал нь нэг асуулт оруулна уу");
  }

  const keys = new Set<string>();
  const questions = input.questions.map((question: any, index: number) => {
    if (!question.label?.trim()) throw new UserInputError("Асуултын текст хоосон байж болохгүй");
    if (!question.category?.trim()) throw new UserInputError("Асуултын бүлэг хоосон байж болохгүй");

    let key = question.key || makeQuestionKey(question.label, index);
    while (keys.has(key)) key = `${key}_${index + 1}`;
    keys.add(key);

    return {
      key,
      label: question.label.trim(),
      category: question.category.trim(),
      order: Number.isFinite(question.order) ? question.order : index + 1,
      active: question.active !== false,
    };
  });

  const template = await ensureActiveTemplate();
  const now = new Date();
  const nextVersion = (template.currentVersion || 1) + 1;

  template.versions = (template.versions || []).map((version: any) => {
    if (!version.validTo) version.validTo = now;
    return version;
  }) as any;

  template.title = input.title.trim();
  template.description = input.description?.trim() || "";
  template.questions = questions as any;
  template.currentVersion = nextVersion;
  template.versions.push(
    createVersion({
      version: nextVersion,
      title: template.title,
      description: template.description || "",
      questions,
      validFrom: now,
      updatedBy: ctx._id,
    }) as any
  );
  template.updatedBy = ctx._id as any;
  await template.save();

  await logAudit({
    userId: ctx._id,
    action: "update",
    resource: "satisfaction_survey_template",
    resourceId: template._id!.toString(),
    details: { questions: questions.length },
    ctx,
  });

  return template.populate("updatedBy");
}

export async function removeSatisfactionSurveyTemplate(
  _: any,
  __: any,
  ctx: ContextType
) {
  requireRole("superadmin")(ctx);

  const template = await ensureActiveTemplate();
  const responseCount = await SatisfactionSurvey.countDocuments({ templateId: template._id });

  if (responseCount === 0) {
    await SatisfactionSurveyTemplate.deleteOne({ _id: template._id });
    await logAudit({
      userId: ctx._id,
      action: "delete",
      resource: "satisfaction_survey_template",
      resourceId: template._id!.toString(),
      details: { responseCount },
      ctx,
    });

    return {
      action: "deleted",
      deleted: true,
      archived: false,
      responseCount,
      template: null,
    };
  }

  const now = new Date();
  template.active = false;
  template.archivedAt = now as any;
  template.archivedBy = ctx._id as any;
  template.versions = (template.versions || []).map((version: any) => {
    if (!version.validTo) version.validTo = now;
    return version;
  }) as any;
  await template.save();

  await logAudit({
    userId: ctx._id,
    action: "update",
    resource: "satisfaction_survey_template",
    resourceId: template._id!.toString(),
    details: { archived: true, responseCount },
    ctx,
  });

  return {
    action: "archived",
    deleted: false,
    archived: true,
    responseCount,
    template: await template.populate("updatedBy archivedBy"),
  };
}
