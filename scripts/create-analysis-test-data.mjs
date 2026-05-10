// ===============================
// ТЕСТ 2 — Доставка еды
// ===============================

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_EMAIL = "gasan07.03.2009@icloud.com";
const RESPONDENT_COUNT = 25;

const OPEN_ANSWERS = [
  "Курьеры приезжают вовремя.",
  "Иногда еда приезжает уже холодной.",
  "Приложение удобное и быстрое.",
  "Хотелось бы больше ресторанов.",
  "Поддержка быстро возвращает деньги.",
  "Цены на доставку слишком высокие.",
  "Часто пользуюсь акциями и промокодами.",
  "Иногда заказ долго ищет курьера.",
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function main() {
  const owner = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true },
  });

  const survey = await prisma.survey.create({
    data: {
      creatorId: owner.id,
      title: "Опрос по доставке еды",
      description: "Исследование пользовательского опыта",
      category: "Food Delivery",
      status: "ACTIVE",
      maxResponses: RESPONDENT_COUNT,
      reward: new Prisma.Decimal(40),
      estimatedTime: 3,
      budget: new Prisma.Decimal(RESPONDENT_COUNT * 40 * 1.15),
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  const q1 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey.id,
      order: 0,
      type: "MULTIPLE_CHOICE",
      title: "Что для вас важнее всего?",
      required: true,
      options: {
        options: [
          "Скорость доставки",
          "Цена",
          "Качество еды",
          "Акции",
        ],
      },
    },
  });

  const q2 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey.id,
      order: 1,
      type: "SINGLE_CHOICE",
      title: "Оцените качество сервиса",
      required: true,
    },
  });

  const q3 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey.id,
      order: 2,
      type: "OPEN_TEXT",
      title: "Что можно улучшить?",
      required: true,
    },
  });

  for (let i = 0; i < RESPONDENT_COUNT; i++) {
    const respondent = await prisma.user.create({
      data: {
        email: `food-test-${Date.now()}-${i}@example.com`,
        role: "RESPONDENT",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });

    const session = await prisma.surveySession.create({
      data: {
        surveyId: survey.id,
        userId: respondent.id,
        status: "COMPLETED",
        isValid: true,
        startedAt: new Date(Date.now() - 600000),
        completedAt: new Date(),
        timeSpent: 180,
      },
    });

    await prisma.surveyAnswer.createMany({
      data: [
        {
          sessionId: session.id,
          questionId: q1.id,
          value: JSON.stringify([
            randomItem([
              "Скорость доставки",
              "Цена",
              "Качество еды",
              "Акции",
            ]),
          ]),
        },
        {
          sessionId: session.id,
          questionId: q2.id,
          value: String(Math.floor(Math.random() * 5) + 1),
        },
        {
          sessionId: session.id,
          questionId: q3.id,
          value: randomItem(OPEN_ANSWERS),
        },
      ],
    });
  }

  console.log("Food delivery survey created:", survey.id);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });