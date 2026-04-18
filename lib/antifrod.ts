import { prisma } from "@/lib/prisma";

const SURVEY_ANTIFRAUD_ENABLED = false;

export type FraudCheckInput = {
  userId: string;
  surveyId: string;
  timeSpent: number;
  answers: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  deviceId: string;
};

export type FraudCheckResult = {
  isValid: boolean;
  flags: string[];
};

export async function checkFraud(input: FraudCheckInput): Promise<FraudCheckResult> {
  if (!SURVEY_ANTIFRAUD_ENABLED) {
    return { isValid: true, flags: [] };
  }

  const flags: string[] = [];

  const [survey, user, sameIp, sameDevice] = await Promise.all([
    prisma.survey.findUnique({ where: { id: input.surveyId }, include: { questions: true } }),
    prisma.user.findUnique({ where: { id: input.userId } }),
    prisma.surveySession.findFirst({
      where: {
        surveyId: input.surveyId,
        ipAddress: input.ipAddress,
        userId: { not: input.userId },
        isValid: true,
        status: "COMPLETED",
      },
    }),
    input.deviceId
      ? prisma.surveySession.findFirst({
          where: {
            surveyId: input.surveyId,
            deviceId: input.deviceId,
            userId: { not: input.userId },
            isValid: true,
            status: "COMPLETED",
          },
        })
      : Promise.resolve(null),
  ]);

  const minTime = (survey?.questions.length ?? 5) * 8;
  if (input.timeSpent < minTime) flags.push("TOO_FAST");
  if (sameIp) flags.push("DUPLICATE_IP");
  if (sameDevice) flags.push("DUPLICATE_DEVICE");

  const vals = Object.values(input.answers);
  if (vals.length > 3 && vals.every((value) => JSON.stringify(value) === JSON.stringify(vals[0]))) {
    flags.push("IDENTICAL_ANSWERS");
  }

  if (user && Date.now() - user.createdAt.getTime() < 86_400_000) {
    flags.push("NEW_ACCOUNT");
  }

  const hasHardViolation =
    flags.includes("TOO_FAST") ||
    flags.includes("IDENTICAL_ANSWERS") ||
    (flags.includes("DUPLICATE_IP") && flags.includes("DUPLICATE_DEVICE"));

  return { isValid: !hasHardViolation, flags };
}
