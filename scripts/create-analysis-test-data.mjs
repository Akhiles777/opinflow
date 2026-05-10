// ===============================
// ТЕСТ 3 — Игровая платформа
// ===============================

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_EMAIL = "gasan07.03.2009@icloud.com";

const GAME_FEEDBACK = [
  "Подбор игроков работает отлично.",
  "Слишком долго ищет матч.",
  "Хотелось бы больше наград за сезон.",
  "Иногда бывают лаги на серверах.",
  "Боевой пропуск выглядит интересно.",
  "Матчи стали более сбалансированными.",
  "Не хватает новых игровых режимов.",
  "Графика после обновления стала лучше.",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const owner = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true },
  });

  const survey = await prisma.survey.create({
    data: {
      creatorId: owner.id,
      title: "Опрос игровой платформы",
      description: "Тест для анализа игровых отзывов",
      category: "Gaming",
      status: "ACTIVE",
      maxResponses: 50,
      reward: new Prisma.Decimal(25),
      estimatedTime: 2,
      budget: new Prisma.Decimal(1500),
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  const q1 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey.id,
      order: 0,
      type: "SINGLE_CHOICE",
      title: "Как часто вы играете?",
      required: true,
      options: {
        options: [
          "Каждый день",
          "Несколько раз в неделю",
          "Редко",
          "Практически не играю",
        ],
      },
    },
  });

  const q2 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey.id,
      order: 1,
      type: "OPEN_TEXT",
      title: "Что вам нравится или не нравится?",
      required: true,
    },
  });

  for (let i = 0; i < 50; i++) {
    const user = await prisma.user.create({
      data: {
        email: `gamer-${Date.now()}-${i}@example.com`,
        role: "RESPONDENT",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });

    const session = await prisma.surveySession.create({
      data: {
        surveyId: survey.id,
        userId: user.id,
        status: "COMPLETED",
        isValid: true,
        startedAt: new Date(Date.now() - 100000),
        completedAt: new Date(),
        timeSpent: 140,
      },
    });

    await prisma.surveyAnswer.createMany({
      data: [
        {
          sessionId: session.id,
          questionId: q1.id,
          value: randomItem([
            "Каждый день",
            "Несколько раз в неделю",
            "Редко",
            "Практически не играю",
          ]),
        },
        {
          sessionId: session.id,
          questionId: q2.id,
          value: randomItem(GAME_FEEDBACK),
        },
      ],
    });
  }

  console.log("Gaming survey created:", survey.id);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });