import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_EMAIL = "gasan07.03.2009@icloud.com";
const RESPONDENT_COUNT = 60;

const OPEN_ANSWERS = [
  "В целом сервис удобный, но хотелось бы быстрее получать уведомления.",
  "Цена кажется немного завышенной по сравнению с альтернативами.",
  "Интерфейс понятный, разобрался за пару минут.",
  "Иногда долго грузится страница с результатами.",
  "Поддержка отвечает вежливо, это большой плюс.",
  "Не хватает фильтров для более точной настройки.",
  "Дизайн приятный, особенно тёмная тема.",
  "Процесс оплаты прошёл без проблем, всё прозрачно.",
  "Хотелось бы больше шаблонов опросов для старта.",
  "Скорость работы хорошая, но на мобильном есть лаги.",
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function ensureWallet(userId) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: new Prisma.Decimal(100000), totalEarned: 0, totalSpent: 0 },
  });
}

async function main() {
  const owner = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true, role: true, status: true },
  });

  if (!owner) {
    throw new Error(`Пользователь ${TARGET_EMAIL} не найден`);
  }

  if (owner.role !== "CLIENT") {
    await prisma.user.update({
      where: { id: owner.id },
      data: { role: "CLIENT", status: "ACTIVE" },
    });
  }

  await ensureWallet(owner.id);

  const createdSurvey = await prisma.survey.create({
    data: {
      creatorId: owner.id,
      title: `Тест ИИ-аналитики ${new Date().toLocaleString("ru-RU")}`,
      description: "Автогенерация тестового опроса для проверки анализа и PDF.",
      category: "Product Research",
      status: "ACTIVE",
      maxResponses: RESPONDENT_COUNT,
      reward: new Prisma.Decimal(50),
      estimatedTime: 4,
      budget: new Prisma.Decimal(RESPONDENT_COUNT * 50 * 1.15),
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    select: { id: true },
  });

  const qSingle = await prisma.surveyQuestion.create({
    data: {
      surveyId: createdSurvey.id,
      order: 0,
      type: "SINGLE_CHOICE",
      title: "Как вы оцениваете общий опыт использования?",
      required: true,
      options: { options: ["Отлично", "Хорошо", "Нормально", "Плохо"] },
    },
    select: { id: true },
  });

  const qOpen = await prisma.surveyQuestion.create({
    data: {
      surveyId: createdSurvey.id,
      order: 1,
      type: "OPEN_TEXT",
      title: "Что нужно улучшить в сервисе в первую очередь?",
      required: true,
    },
    select: { id: true },
  });

  for (let i = 0; i < RESPONDENT_COUNT; i += 1) {
    const email = `autotest.respondent.${Date.now()}.${i}@example.com`;
    const respondent = await prisma.user.create({
      data: {
        email,
        role: "RESPONDENT",
        status: "ACTIVE",
        emailVerified: new Date(),
        wallet: { create: {} },
        respondentProfile: {
          create: {
            gender: i % 2 === 0 ? "male" : "female",
            city: i % 3 === 0 ? "Москва" : "Санкт-Петербург",
            income: i % 2 === 0 ? "60-100k" : "30-60k",
            interests: ["технологии", "покупки"],
          },
        },
      },
      select: { id: true },
    });

    const session = await prisma.surveySession.create({
      data: {
        surveyId: createdSurvey.id,
        userId: respondent.id,
        status: "COMPLETED",
        isValid: true,
        startedAt: new Date(Date.now() - randomInt(900, 3600) * 1000),
        completedAt: new Date(),
        timeSpent: randomInt(120, 420),
        ipAddress: `10.0.0.${(i % 200) + 1}`,
        userAgent: "Mozilla/5.0 TestAgent",
        deviceId: `test-device-${i}`,
      },
      select: { id: true },
    });

    await prisma.surveyAnswer.createMany({
      data: [
        {
          sessionId: session.id,
          questionId: qSingle.id,
          value: randomItem(["Отлично", "Хорошо", "Нормально", "Плохо"]),
        },
        {
          sessionId: session.id,
          questionId: qOpen.id,
          value: `${randomItem(OPEN_ANSWERS)} (#${i + 1})`,
        },
      ],
    });
  }

  await prisma.surveyAnalysis.upsert({
    where: { surveyId: createdSurvey.id },
    update: { status: "PENDING", error: null, summary: null },
    create: { surveyId: createdSurvey.id, status: "PENDING" },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        surveyId: createdSurvey.id,
        createdResponses: RESPONDENT_COUNT,
        ownerEmail: TARGET_EMAIL,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
