/**
 * Добавляет несколько опросов к client@test.local с 35-45 ответами каждый.
 * Создаёт до 50 виртуальных респондентов (если ещё не созданы).
 * Запуск: node scripts/add-test-responses.mjs
 */

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const NOW = new Date();

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const SURVEY_TEMPLATES = [
  {
    title: "Исследование покупательского поведения на маркетплейсах",
    description: "Изучаем, как пользователи выбирают товары и принимают решения о покупке.",
    category: "Потребительские",
    questions: [
      { type: "SINGLE_CHOICE", title: "Как часто вы совершаете покупки на маркетплейсах?", options: ["Каждый день", "Несколько раз в неделю", "Раз в неделю", "Раз в месяц"] },
      { type: "MULTIPLE_CHOICE", title: "Какими маркетплейсами вы пользуетесь?", options: ["Wildberries", "Ozon", "Яндекс Маркет", "AliExpress"] },
      { type: "SCALE", title: "Насколько важны отзывы при выборе товара?", settings: { min: 1, max: 10, minLabel: "Не важны", maxLabel: "Критично" } },
      { type: "OPEN_TEXT", title: "Что вас больше всего раздражает при покупках онлайн?", settings: { maxLength: 400 } },
    ],
  },
  {
    title: "Отношение к экологичным продуктам",
    description: "Исследуем готовность аудитории платить за эко-товары и осознанное потребление.",
    category: "Потребительские",
    questions: [
      { type: "SINGLE_CHOICE", title: "Вы покупаете экологичные товары?", options: ["Да, регулярно", "Иногда", "Нет, слишком дорого", "Не слежу за этим"] },
      { type: "SCALE", title: "Готовы ли вы платить на 20% больше за эко-упаковку?", settings: { min: 1, max: 10, minLabel: "Нет", maxLabel: "Да, готов" } },
      { type: "MULTIPLE_CHOICE", title: "Какие эко-характеристики для вас важны?", options: ["Перерабатываемая упаковка", "Натуральный состав", "Без тестирования на животных", "Местное производство"] },
      { type: "OPEN_TEXT", title: "Что мешает вам покупать больше эко-товаров?", settings: { maxLength: 350 } },
    ],
  },
  {
    title: "Оценка лояльности к косметическому бренду",
    description: "Понимаем, что привязывает покупателей к уходовой косметике и триггеры смены бренда.",
    category: "Косметика",
    questions: [
      { type: "SINGLE_CHOICE", title: "Как давно вы пользуетесь своим основным брендом косметики?", options: ["Меньше года", "1-3 года", "3-5 лет", "Больше 5 лет"] },
      { type: "RANKING", title: "Что важнее при выборе бренда косметики?", options: ["Состав", "Цена", "Упаковка", "Рекомендации блогеров"] },
      { type: "SCALE", title: "Насколько вы готовы попробовать новый бренд?", settings: { min: 1, max: 10, minLabel: "Никогда", maxLabel: "Легко переключаюсь" } },
      { type: "OPEN_TEXT", title: "Почему вы лояльны к своему бренду?", settings: { maxLength: 300 } },
    ],
  },
  {
    title: "Финансовые привычки миллениалов",
    description: "Изучаем отношение к сбережениям, инвестициям и финансовому планированию.",
    category: "Финансы",
    questions: [
      { type: "SINGLE_CHOICE", title: "Ведёте ли вы бюджет?", options: ["Да, строго", "Примерно слежу", "Нет", "Хочу начать"] },
      { type: "MULTIPLE_CHOICE", title: "Куда вы вкладываете сбережения?", options: ["Депозит", "Акции", "Недвижимость", "Ничего не коплю"] },
      { type: "SCALE", title: "Насколько вы удовлетворены своим финансовым положением?", settings: { min: 1, max: 10, minLabel: "Не удовлетворён", maxLabel: "Полностью доволен" } },
      { type: "OPEN_TEXT", title: "Каких финансовых знаний вам не хватает?", settings: { maxLength: 350 } },
    ],
  },
  {
    title: "Восприятие рекламы в социальных сетях",
    description: "Исследуем реакцию аудитории на рекламные форматы ВКонтакте, Telegram и других платформах.",
    category: "Маркетинг",
    questions: [
      { type: "SINGLE_CHOICE", title: "Как часто вы кликаете на рекламу в соцсетях?", options: ["Никогда", "Иногда, если интересно", "Часто", "Всегда"] },
      { type: "MULTIPLE_CHOICE", title: "Какие форматы рекламы вас раздражают?", options: ["Всплывающие баннеры", "Реклама в stories", "Посты в ленте", "Автовоспроизводимое видео"] },
      { type: "SCALE", title: "Насколько таргетированная реклама попадает в ваши интересы?", settings: { min: 1, max: 10, minLabel: "Совсем мимо", maxLabel: "Очень точно" } },
      { type: "OPEN_TEXT", title: "Какую рекламу вы считаете полезной?", settings: { maxLength: 300 } },
    ],
  },
];

function answerForQuestion(question, variantIndex) {
  if (question.type === "SINGLE_CHOICE") {
    return question.options?.[variantIndex % question.options.length] ?? "Вариант";
  }
  if (question.type === "MULTIPLE_CHOICE") {
    const opts = question.options ?? [];
    return opts.slice(0, 1 + (variantIndex % Math.min(3, opts.length)));
  }
  if (question.type === "SCALE") {
    return 5 + (variantIndex % 5);
  }
  if (question.type === "RANKING") {
    const opts = [...(question.options ?? [])];
    // rotate
    const shift = variantIndex % opts.length;
    return [...opts.slice(shift), ...opts.slice(0, shift)];
  }
  return `Тестовый ответ ${variantIndex + 1}`;
}

async function main() {
  const client = await prisma.user.findUnique({ where: { email: "client@test.local" } });
  if (!client) {
    console.error("Пользователь client@test.local не найден. Сначала запустите: npx prisma db seed");
    process.exit(1);
  }

  // Создаём 50 виртуальных респондентов
  const passwordHash = await bcrypt.hash("Test12345!", 10);
  const RESPONDENT_COUNT = 50;
  const respondents = [];
  console.log("Создаём/находим 50 тестовых респондентов...");
  for (let i = 1; i <= RESPONDENT_COUNT; i++) {
    const email = `resp${String(i).padStart(3, "0")}@bulk.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Респондент ${i}`,
        role: "RESPONDENT",
        status: "ACTIVE",
        emailVerified: new Date(),
        passwordHash,
      },
    });
    // Кошелёк
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, balance: 0, totalEarned: 0, totalSpent: 0 },
    });
    respondents.push(user);
  }
  console.log(`Готово: ${respondents.length} респондентов`);

  // Создаём 5 опросов
  console.log("Создаём 5 опросов для client@test.local...");
  const surveys = [];
  for (let t = 0; t < SURVEY_TEMPLATES.length; t++) {
    const template = SURVEY_TEMPLATES[t];
    const maxResponses = 50 + t * 10;
    const reward = 50 + t * 10;
    const survey = await prisma.survey.create({
      data: {
        creatorId: client.id,
        title: template.title,
        description: template.description,
        category: template.category,
        status: "ACTIVE",
        maxResponses,
        reward,
        estimatedTime: template.questions.length * 2,
        budget: Number((maxResponses * reward * 1.15).toFixed(2)),
        targetGender: "any",
        targetAgeMin: 18,
        targetAgeMax: 55,
        targetCities: [],
        targetIncomes: [],
        targetInterests: [],
        targetHasChildren: "any",
        targetEmploymentStatuses: [],
        targetIndustries: [],
        targetMaritalStatuses: [],
        startsAt: addDays(NOW, -10),
        endsAt: addDays(NOW, 30),
      },
    });

    await prisma.surveyQuestion.createMany({
      data: template.questions.map((q, idx) => ({
        surveyId: survey.id,
        order: idx,
        type: q.type,
        title: q.title,
        description: null,
        required: true,
        mediaUrl: null,
        options: q.options ?? null,
        settings: q.settings ?? null,
        logic: null,
      })),
    });

    const surveyFull = await prisma.survey.findUnique({
      where: { id: survey.id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    surveys.push(surveyFull);
    console.log(`  Опрос "${template.title}" создан (id: ${survey.id})`);
  }

  // Добавляем ответы: каждый опрос получает 35-45 ответов
  for (const survey of surveys) {
    const responseCount = 35 + Math.floor(Math.random() * 11); // 35..45
    const shuffled = [...respondents].sort(() => Math.random() - 0.5).slice(0, responseCount);
    console.log(`\nДобавляем ${responseCount} ответов к "${survey.title}"...`);

    for (let ri = 0; ri < shuffled.length; ri++) {
      const user = shuffled[ri];
      const startedAt = addDays(NOW, -(Math.random() * 8));
      const completedAt = new Date(startedAt.getTime() + (120 + ri * 15) * 1000);

      const session = await prisma.surveySession.create({
        data: {
          surveyId: survey.id,
          userId: user.id,
          status: "COMPLETED",
          startedAt,
          completedAt,
          timeSpent: 120 + ri * 15,
          ipAddress: `10.0.${Math.floor(ri / 255)}.${ri % 255 + 1}`,
          userAgent: "Bulk Seed",
          deviceId: `bulk-${user.id}-${survey.id}`,
          isValid: true,
          fraudFlags: [],
        },
      });

      const answers = survey.questions.map((q) => ({
        sessionId: session.id,
        questionId: q.id,
        value: answerForQuestion(q, ri),
      }));

      if (answers.length > 0) {
        await prisma.surveyAnswer.createMany({ data: answers });
      }

      // SurveyResponse для модерации
      await prisma.surveyResponse.upsert({
        where: { surveyId_userId: { surveyId: survey.id, userId: user.id } },
        update: {},
        create: {
          surveyId: survey.id,
          userId: user.id,
          sessionId: session.id,
          moderationStatus: "APPROVED",
          moderatedAt: completedAt,
        },
      });
    }

    console.log(`  ✓ ${responseCount} ответов добавлено`);
  }

  console.log("\nГотово! Опросы с ответами созданы для client@test.local");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
