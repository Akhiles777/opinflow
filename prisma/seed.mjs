import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD = "Test12345!";
const NOW = new Date();

const USERS = {
  respondent: { email: "respondent@test.local", name: "Тестовый Респондент", role: "RESPONDENT" },
  respondent2: { email: "respondent2@test.local", name: "Второй Респондент", role: "RESPONDENT" },
  client: { email: "client@test.local", name: "Тестовый Заказчик", role: "CLIENT" },
  admin: { email: "admin@test.local", name: "Тестовый Администратор", role: "ADMIN" },

};

const CITY_POOL = ["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск", "Самара"];
const INCOME_POOL = ["до 30 000 ₽", "30 000–60 000 ₽", "60 000–100 000 ₽", "от 100 000 ₽"];
const INTEREST_POOL = [
  "Авто",
  "Технологии",
  "Еда",
  "Спорт",
  "Путешествия",
  "Мода",
  "Финансы",
  "Здоровье",
  "Кино",
  "Музыка",
  "Игры",
  "Недвижимость",
];

const SURVEY_TEMPLATES = [
  {
    title: "Оценка нового мобильного банка",
    description: "Проверяем ожидания аудитории от мобильного банка и ключевые факторы выбора.",
    category: "Финансы",
    questions: [
      {
        type: "SINGLE_CHOICE",
        title: "Каким банком вы пользуетесь чаще всего?",
        options: ["Т-Банк", "Сбер", "Альфа-Банк", "ВТБ"],
      },
      {
        type: "SCALE",
        title: "Насколько вам важен удобный интерфейс приложения?",
        settings: { min: 1, max: 10, minLabel: "Не важно", maxLabel: "Критично" },
      },
      {
        type: "OPEN_TEXT",
        title: "Чего вам не хватает в банковских приложениях?",
        settings: { maxLength: 400, placeholder: "Опишите своими словами..." },
      },
    ],
  },
  {
    title: "Привычки доставки продуктов",
    description: "Исследуем, как люди выбирают сервисы доставки и что влияет на повторный заказ.",
    category: "Потребительские",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        title: "Какими сервисами доставки вы пользовались за последний месяц?",
        options: ["Самокат", "Яндекс Лавка", "СберМаркет", "Купер"],
      },
      {
        type: "SINGLE_CHOICE",
        title: "Что важнее всего при выборе сервиса доставки?",
        options: ["Скорость", "Цена", "Ассортимент", "Программа лояльности"],
      },
      {
        type: "OPEN_TEXT",
        title: "Что раздражает вас в текущих сервисах доставки?",
        settings: { maxLength: 350, placeholder: "Например: недоступные слоты, качество упаковки..." },
      },
    ],
  },
  {
    title: "Выбор стримингового сервиса",
    description: "Понимаем, по каким причинам пользователи подписываются на видеосервисы.",
    category: "Медиа",
    questions: [
      {
        type: "SINGLE_CHOICE",
        title: "Какой сервис вы используете чаще всего?",
        options: ["Кинопоиск", "Okko", "Premier", "Нет подписки"],
      },
      {
        type: "RANKING",
        title: "Расположите факторы выбора по важности",
        options: ["Цена", "Эксклюзивный контент", "Удобство приложения", "Качество рекомендаций"],
      },
      {
        type: "OPEN_TEXT",
        title: "Какого контента вам не хватает?",
        settings: { maxLength: 300, placeholder: "Фильмы, сериалы, спорт..." },
      },
    ],
  },
  {
    title: "Опрос о фитнес-привычках",
    description: "Изучаем тренировки, спортивные сервисы и барьеры к регулярным занятиям.",
    category: "Здоровье",
    questions: [
      {
        type: "SINGLE_CHOICE",
        title: "Как часто вы занимаетесь спортом?",
        options: ["Каждый день", "2-3 раза в неделю", "Редко", "Не занимаюсь"],
      },
      {
        type: "MULTIPLE_CHOICE",
        title: "Какие форматы тренировок вам подходят?",
        options: ["Зал", "Домашние", "Групповые", "Пробежки"],
      },
      {
        type: "MATRIX",
        title: "Оцените факторы выбора фитнес-клуба",
        matrixRows: ["Цена", "Локация", "Тренеры"],
        matrixCols: ["Не важно", "Средне", "Очень важно"],
      },
    ],
  },
  {
    title: "Исследование онлайн-образования",
    description: "Проверяем отношение аудитории к обучающим платформам и форматам курсов.",
    category: "Образование",
    questions: [
      {
        type: "SINGLE_CHOICE",
        title: "Покупали ли вы онлайн-курсы за последний год?",
        options: ["Да", "Нет"],
      },
      {
        type: "MULTIPLE_CHOICE",
        title: "Какие темы курсов вам интересны?",
        options: ["IT", "Маркетинг", "Языки", "Финансы"],
      },
      {
        type: "SCALE",
        title: "Насколько важна для вас поддержка наставника?",
        settings: { min: 1, max: 10, minLabel: "Не важна", maxLabel: "Очень важна" },
      },
    ],
  },
  {
    title: "Супермаркет и FMCG: паттерны выбора",
    description: "Изучаем лояльность к брендам и сценарии офлайн-покупок.",
    category: "FMCG",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        title: "Где вы чаще всего покупаете продукты?",
        options: ["Пятёрочка", "Перекрёсток", "Магнит", "ВкусВилл"],
      },
      {
        type: "SINGLE_CHOICE",
        title: "Что сильнее влияет на выбор бренда?",
        options: ["Цена", "Качество", "Советы знакомых", "Дизайн упаковки"],
      },
      {
        type: "OPEN_TEXT",
        title: "Какой новый продукт вы хотели бы увидеть на полке?",
        settings: { maxLength: 250, placeholder: "Опишите коротко..." },
      },
    ],
  },
];

async function upsertUser({ email, name, role }) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
    },
    create: {
      email,
      name,
      role,
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
    },
  });
}

async function ensureWallet(userId, data) {
  return prisma.wallet.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });
}

async function ensureRespondentProfile(userId, profile) {
  return prisma.respondentProfile.upsert({
    where: { userId },
    update: profile,
    create: {
      userId,
      ...profile,
    },
  });
}

async function ensureClientProfile(userId) {
  return prisma.clientProfile.upsert({
    where: { userId },
    update: {
      companyName: "ООО Поток Тест",
      inn: "7701234567",
      contactName: "Анна Тестова",
      phone: "+7 900 123-45-67",
      legalAddress: "Москва, ул. Демонстрационная, 3",
      bankName: "Т-Банк",
      bankAccount: "40702810900000000001",
      bankBik: "044525974",
    },
    create: {
      userId,
      companyName: "ООО Поток Тест",
      inn: "7701234567",
      contactName: "Анна Тестова",
      phone: "+7 900 123-45-67",
      legalAddress: "Москва, ул. Демонстрационная, 3",
      bankName: "Т-Банк",
      bankAccount: "40702810900000000001",
      bankBik: "044525974",
    },
  });
}

async function clearSurveyDomain() {
  await prisma.complaint.deleteMany();
  await prisma.surveyAnswer.deleteMany();
  await prisma.surveySession.deleteMany();
  await prisma.surveyQuestion.deleteMany();
  await prisma.surveyResponse.deleteMany();
  await prisma.survey.deleteMany();
}

async function resetWalletTransactions(walletIds) {
  await prisma.transaction.deleteMany({
    where: { walletId: { in: walletIds } },
  });
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildQuestions(template, surveyId) {
  return template.questions.map((question, index) => {
    const common = {
      surveyId,
      order: index,
      type: question.type,
      title: question.title,
      description: question.description ?? null,
      required: true,
      mediaUrl: null,
      settings: question.settings ?? null,
      logic: null,
    };

    if (question.type === "MATRIX") {
      return {
        ...common,
        options: {
          rows: question.matrixRows,
          cols: question.matrixCols,
        },
      };
    }

    return {
      ...common,
      options: question.options ?? null,
    };
  });
}

function buildSurveyData(index, clientId) {
  const template = SURVEY_TEMPLATES[index % SURVEY_TEMPLATES.length];
  let status = "ACTIVE";
  if (index >= 18 && index <= 19) status = "PENDING_MODERATION";
  if (index >= 20 && index <= 21) status = "PAUSED";
  if (index === 22) status = "REJECTED";
  if (index === 23) status = "COMPLETED";
  const maxResponses = 40 + (index % 5) * 20;
  const reward = 40 + (index % 6) * 20;
  const budget = Number((maxResponses * reward * 1.15).toFixed(2));
  const startsAt = addDays(NOW, -((index % 6) + 2));
  const endsAt = addDays(NOW, 5 + (index % 10));
  const targetGender = index % 3 === 0 ? "male" : index % 3 === 1 ? "female" : "any";
  const targetCities = index % 2 === 0 ? [CITY_POOL[index % CITY_POOL.length]] : [];
  const targetIncomes = index % 4 === 0 ? [INCOME_POOL[index % INCOME_POOL.length]] : [];
  const targetInterests = index % 2 === 1 ? [INTEREST_POOL[index % INTEREST_POOL.length], INTEREST_POOL[(index + 3) % INTEREST_POOL.length]] : [];

  return {
    title: `${template.title} #${index + 1}`,
    description: template.description,
    category: template.category,
    status,
    creatorId: clientId,
    maxResponses,
    reward,
    estimatedTime: template.questions.length * 2,
    budget,
    targetGender,
    targetAgeMin: 18 + (index % 3) * 5,
    targetAgeMax: 45 + (index % 4) * 5,
    targetCities,
    targetIncomes,
    targetInterests,
    startsAt,
    endsAt,
    moderationNote:
      status === "REJECTED" ? "Слишком общие формулировки и неточности в постановке вопросов." : null,
    template,
  };
}

function answerForQuestion(question, variantIndex) {
  if (question.type === "SINGLE_CHOICE") {
    return question.options?.[variantIndex % question.options.length] ?? "Вариант";
  }

  if (question.type === "MULTIPLE_CHOICE") {
    return (question.options ?? []).slice(0, Math.min(2, question.options.length));
  }

  if (question.type === "SCALE") {
    return 7 + (variantIndex % 3);
  }

  if (question.type === "RANKING") {
    return [...(question.options ?? [])];
  }

  if (question.type === "MATRIX") {
    const rows = Array.isArray(question.options?.rows) ? question.options.rows : [];
    const cols = Array.isArray(question.options?.cols) ? question.options.cols : [];
    return Object.fromEntries(
      rows.map((row, rowIndex) => [row, cols[(rowIndex + variantIndex) % cols.length] ?? cols[0] ?? "—"]),
    );
  }

  return `Тестовый ответ ${variantIndex + 1}`;
}

async function createSessionWithAnswers({ survey, userId, isValid, status, offsetDays, variantIndex, walletId }) {
  const startedAt = addDays(NOW, -offsetDays);
  const completedAt = status === "IN_PROGRESS" ? null : addDays(startedAt, 0.02);

  const session = await prisma.surveySession.create({
    data: {
      surveyId: survey.id,
      userId,
      status,
      startedAt,
      completedAt,
      timeSpent: status === "IN_PROGRESS" ? null : 180 + variantIndex * 25,
      ipAddress: `192.168.0.${10 + variantIndex}`,
      userAgent: "Seed Browser",
      deviceId: `seed-device-${userId}-${variantIndex}`,
      isValid,
      fraudFlags: isValid ? [] : ["TOO_FAST"],
    },
  });

  if (status !== "IN_PROGRESS") {
    const answers = survey.questions.map((question) => ({
      sessionId: session.id,
      questionId: question.id,
      value: answerForQuestion(question, variantIndex),
    }));

    if (answers.length > 0) {
      await prisma.surveyAnswer.createMany({ data: answers });
    }
  }

  if (status === "COMPLETED" && isValid) {
    await prisma.transaction.create({
      data: {
        walletId,
        type: "EARNING",
        amount: survey.reward,
        description: `Опрос: "${survey.title}"`,
        status: "COMPLETED",
      },
    });
  }
}

async function main() {
  const respondent = await upsertUser(USERS.respondent);
  const respondent2 = await upsertUser(USERS.respondent2);
  const client = await upsertUser(USERS.client);
  const admin = await upsertUser(USERS.admin);

  await ensureRespondentProfile(respondent.id, {
    gender: "male",
    birthDate: new Date("1998-06-12"),
    city: "Москва",
    income: "60 000–100 000 ₽",
    education: "Высшее",
    interests: ["Технологии", "Финансы", "Кино", "Игры"],
    isVerified: true,
  });

  await ensureRespondentProfile(respondent2.id, {
    gender: "female",
    birthDate: new Date("1995-03-21"),
    city: "Санкт-Петербург",
    income: "30 000–60 000 ₽",
    education: "Высшее",
    interests: ["Путешествия", "Мода", "Еда", "Здоровье"],
    isVerified: true,
  });

  await ensureClientProfile(client.id);

  const respondentWallet = await ensureWallet(respondent.id, {
    balance: 8200,
    totalEarned: 12400,
    totalSpent: 0,
  });
  const respondent2Wallet = await ensureWallet(respondent2.id, {
    balance: 4600,
    totalEarned: 7600,
    totalSpent: 0,
  });
  const clientWallet = await ensureWallet(client.id, {
    balance: 250000,
    totalEarned: 0,
    totalSpent: 0,
  });
  const adminWallet = await ensureWallet(admin.id, {
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
  });

  await clearSurveyDomain();
  await resetWalletTransactions([respondentWallet.id, respondent2Wallet.id, clientWallet.id, adminWallet.id]);
  await prisma.referral.deleteMany({
    where: {
      OR: [
        { senderId: respondent.id },
        { receiverId: respondent.id },
        { senderId: respondent2.id },
        { receiverId: respondent2.id },
        { senderId: client.id },
        { receiverId: client.id },
        { senderId: admin.id },
        { receiverId: admin.id },
      ],
    },
  });

  const surveys = [];
  for (let index = 0; index < 24; index += 1) {
    const surveyData = buildSurveyData(index, client.id);
    const survey = await prisma.survey.create({
      data: {
        creatorId: surveyData.creatorId,
        title: surveyData.title,
        description: surveyData.description,
        category: surveyData.category,
        status: surveyData.status,
        maxResponses: surveyData.maxResponses,
        reward: surveyData.reward,
        estimatedTime: surveyData.estimatedTime,
        budget: surveyData.budget,
        targetGender: surveyData.targetGender,
        targetAgeMin: surveyData.targetAgeMin,
        targetAgeMax: surveyData.targetAgeMax,
        targetCities: surveyData.targetCities,
        targetIncomes: surveyData.targetIncomes,
        targetInterests: surveyData.targetInterests,
        startsAt: surveyData.startsAt,
        endsAt: surveyData.endsAt,
        moderationNote: surveyData.moderationNote,
      },
    });

    await prisma.surveyQuestion.createMany({
      data: buildQuestions(surveyData.template, survey.id),
    });

    const surveyWithQuestions = await prisma.survey.findUnique({
      where: { id: survey.id },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    surveys.push(surveyWithQuestions);
  }

  for (let index = 0; index < surveys.length; index += 1) {
    const survey = surveys[index];
    if (!survey) continue;

    if (survey.status === "ACTIVE") {
      if (index % 3 === 0) {
        await createSessionWithAnswers({
          survey,
          userId: respondent.id,
          isValid: true,
          status: "IN_PROGRESS",
          offsetDays: 1,
          variantIndex: index,
          walletId: respondentWallet.id,
        });
      }

      await createSessionWithAnswers({
        survey,
        userId: respondent2.id,
        isValid: true,
        status: "COMPLETED",
        offsetDays: 2 + (index % 4),
        variantIndex: index + 1,
        walletId: respondent2Wallet.id,
      });
    }

    if (survey.status === "COMPLETED") {
      await createSessionWithAnswers({
        survey,
        userId: respondent.id,
        isValid: true,
        status: "COMPLETED",
        offsetDays: 4 + (index % 3),
        variantIndex: index + 2,
        walletId: respondentWallet.id,
      });
      await createSessionWithAnswers({
        survey,
        userId: respondent2.id,
        isValid: true,
        status: "COMPLETED",
        offsetDays: 3 + (index % 2),
        variantIndex: index + 3,
        walletId: respondent2Wallet.id,
      });
    }
  }

  const totalClientSpent = surveys.reduce((sum, survey) => {
    if (!survey || !survey.budget) return sum;
    return sum + Number(survey.budget);
  }, 0);

  await prisma.wallet.update({
    where: { id: clientWallet.id },
    data: {
      balance: Math.max(0, 250000 - totalClientSpent),
      totalSpent: totalClientSpent,
    },
  });

  await prisma.wallet.update({
    where: { id: respondentWallet.id },
    data: {
      balance: Number(respondentWallet.balance) + 1800,
      totalEarned: Number(respondentWallet.totalEarned) + 1800,
    },
  });

  await prisma.wallet.update({
    where: { id: respondent2Wallet.id },
    data: {
      balance: Number(respondent2Wallet.balance) + 2200,
      totalEarned: Number(respondent2Wallet.totalEarned) + 2200,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        walletId: clientWallet.id,
        type: "DEPOSIT",
        amount: 250000,
        description: "Пополнение демо-кошелька для тестов",
        status: "COMPLETED",
      },
      {
        walletId: clientWallet.id,
        type: "SPENDING",
        amount: Number(totalClientSpent.toFixed(2)),
        description: "Списание под тестовые опросы Stage 3",
        status: "COMPLETED",
      },
      {
        walletId: respondentWallet.id,
        type: "BONUS",
        amount: 300,
        description: "Бонус за тестовые активности",
        status: "COMPLETED",
      },
      {
        walletId: respondent2Wallet.id,
        type: "BONUS",
        amount: 250,
        description: "Бонус за тестовые активности",
        status: "COMPLETED",
      },
    ],
  });

  console.log(`Seed complete: ${surveys.length} surveys created.`);
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
