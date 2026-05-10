// ===============================
// ТЕСТ 1 — Онлайн-банк
// ===============================

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_EMAIL = "gasan07.03.2009@icloud.com";
const RESPONDENT_COUNT = 40;

const OPEN_ANSWERS = [
  "Мобильное приложение работает стабильно.",
  "Хотелось бы быстрее переводить деньги между банками.",
  "Поддержка помогла решить проблему за 10 минут.",
  "Иногда push-уведомления приходят с задержкой.",
  "Интерфейс очень удобный даже для новичков.",
  "Не хватает категории расходов по подпискам.",
  "Процент по кэшбеку хотелось бы выше.",
  "Регистрация карты прошла без проблем.",
  "Было бы полезно добавить виртуальные карты.",
  "Часто использую аналитику расходов — удобно.",
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const owner = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true },
  });

  const survey = await prisma.survey.create({
    data: {
      creatorId: owner.id,
      title: "Оценка мобильного банка",
      description: "Тестовый банковский опрос",
      category: "Finance",
      status: "ACTIVE",
      maxResponses: RESPONDENT_COUNT,
      reward: new Prisma.Decimal(70),
      estimatedTime: 5,
      budget: new Prisma.Decimal(RESPONDENT_COUNT * 70 * 1.15),
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const q1 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey.id,
      order: 0,
      type: "SINGLE_CHOICE",
      title: "Как вы оцениваете удобство приложения?",
      required: true,
      options: {
        options: ["Очень удобно", "Удобно", "Средне", "Неудобно"],
      },
    },
  });

  const q2 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey.id,
      order: 1,
      type: "OPEN_TEXT",
      title: "Что стоит улучшить в банковском приложении?",
      required: true,
    },
  });

  for (let i = 0; i < RESPONDENT_COUNT; i++) {
    const respondent = await prisma.user.create({
      data: {
        email: `bank-test-${Date.now()}-${i}@example.com`,
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
        startedAt: new Date(Date.now() - 300000),
        completedAt: new Date(),
        timeSpent: randomInt(100, 500),
      },
    });

    await prisma.surveyAnswer.createMany({
      data: [
        {
          sessionId: session.id,
          questionId: q1.id,
          value: randomItem([
            "Очень удобно",
            "Удобно",
            "Средне",
            "Неудобно",
          ]),
        },
        {
          sessionId: session.id,
          questionId: q2.id,
          value: randomItem(OPEN_ANSWERS),
        },
      ],
    });
  }

  console.log("Bank survey created:", survey.id);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });