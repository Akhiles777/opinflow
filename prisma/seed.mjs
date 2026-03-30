import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD = "Test12345!";

const users = {
  respondent: {
    email: "respondent@test.local",
    name: "Тестовый Респондент",
    role: "RESPONDENT",
  },
  client: {
    email: "client@test.local",
    name: "Тестовый Заказчик",
    role: "CLIENT",
  },
  admin: {
    email: "admin@test.local",
    name: "Тестовый Администратор",
    role: "ADMIN",
  },
};

async function upsertUser({ email, name, role }) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

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

async function ensureWallet(userId, values) {
  return prisma.wallet.upsert({
    where: { userId },
    update: values,
    create: {
      userId,
      ...values,
    },
  });
}

async function ensureRespondentProfile(userId) {
  return prisma.respondentProfile.upsert({
    where: { userId },
    update: {
      gender: "male",
      birthDate: new Date("1998-06-12"),
      city: "Москва",
      income: "60-100k",
      education: "bachelor",
      interests: ["Технологии", "Финансы", "Кино"],
      isVerified: true,
    },
    create: {
      userId,
      gender: "male",
      birthDate: new Date("1998-06-12"),
      city: "Москва",
      income: "60-100k",
      education: "bachelor",
      interests: ["Технологии", "Финансы", "Кино"],
      isVerified: true,
    },
  });
}

async function ensureClientProfile(userId) {
  return prisma.clientProfile.upsert({
    where: { userId },
    update: {
      companyName: "ООО Тест Бренд",
      inn: "7701234567",
      contactName: "Анна Тестова",
      phone: "+7 900 123-45-67",
      legalAddress: "Москва, ул. Тестовая, 1",
      bankName: "Т-Банк",
      bankAccount: "40702810900000000001",
      bankBik: "044525974",
    },
    create: {
      userId,
      companyName: "ООО Тест Бренд",
      inn: "7701234567",
      contactName: "Анна Тестова",
      phone: "+7 900 123-45-67",
      legalAddress: "Москва, ул. Тестовая, 1",
      bankName: "Т-Банк",
      bankAccount: "40702810900000000001",
      bankBik: "044525974",
    },
  });
}

async function resetUserDomainData({ respondentId, clientId, adminId, respondentWalletId, clientWalletId, adminWalletId }) {
  await prisma.referral.deleteMany({
    where: {
      OR: [
        { senderId: respondentId },
        { receiverId: respondentId },
        { senderId: clientId },
        { receiverId: clientId },
        { senderId: adminId },
        { receiverId: adminId },
      ],
    },
  });

  await prisma.surveyResponse.deleteMany({
    where: {
      OR: [{ userId: respondentId }, { userId: clientId }, { userId: adminId }],
    },
  });

  await prisma.survey.deleteMany({
    where: {
      creatorId: { in: [clientId, adminId, respondentId] },
    },
  });

  await prisma.transaction.deleteMany({
    where: {
      walletId: { in: [respondentWalletId, clientWalletId, adminWalletId] },
    },
  });
}

async function main() {
  const respondent = await upsertUser(users.respondent);
  const client = await upsertUser(users.client);
  const admin = await upsertUser(users.admin);

  await ensureRespondentProfile(respondent.id);
  await ensureClientProfile(client.id);

  const respondentWallet = await ensureWallet(respondent.id, {
    balance: 1240,
    totalEarned: 8940,
    totalSpent: 2300,
  });
  const clientWallet = await ensureWallet(client.id, {
    balance: 45200,
    totalEarned: 0,
    totalSpent: 12800,
  });
  const adminWallet = await ensureWallet(admin.id, {
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
  });

  await resetUserDomainData({
    respondentId: respondent.id,
    clientId: client.id,
    adminId: admin.id,
    respondentWalletId: respondentWallet.id,
    clientWalletId: clientWallet.id,
    adminWalletId: adminWallet.id,
  });

  const deliverySurvey = await prisma.survey.create({
    data: {
      creatorId: client.id,
      title: "Оцените качество сервиса доставки",
      description: "Исследование опыта доставки продуктов",
      category: "Потребительский",
      status: "ACTIVE",
    },
  });

  const coffeeSurvey = await prisma.survey.create({
    data: {
      creatorId: client.id,
      title: "Кофе: привычки и выбор бренда",
      description: "Как пользователи выбирают кофе",
      category: "FMCG",
      status: "PENDING_MODERATION",
    },
  });

  const bankSurvey = await prisma.survey.create({
    data: {
      creatorId: client.id,
      title: "Мобильные банки: доверие и привычки",
      description: "Исследование привычек пользователей финтеха",
      category: "Финансы",
      status: "PAUSED",
    },
  });

  await prisma.surveyResponse.createMany({
    data: [
      { surveyId: deliverySurvey.id, userId: respondent.id },
      { surveyId: bankSurvey.id, userId: admin.id },
    ],
  });

  await prisma.referral.create({
    data: {
      senderId: respondent.id,
      receiverId: admin.id,
      bonusPaid: true,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        walletId: respondentWallet.id,
        type: "EARNING",
        amount: 120,
        description: "Опрос: доставка",
        status: "COMPLETED",
      },
      {
        walletId: respondentWallet.id,
        type: "BONUS",
        amount: 150,
        description: "Реферальный бонус",
        status: "COMPLETED",
      },
      {
        walletId: respondentWallet.id,
        type: "WITHDRAWAL",
        amount: 500,
        description: "СБП",
        status: "PENDING",
      },
      {
        walletId: clientWallet.id,
        type: "DEPOSIT",
        amount: 10000,
        description: "Пополнение через тестовый счёт",
        status: "COMPLETED",
      },
      {
        walletId: clientWallet.id,
        type: "SPENDING",
        amount: 12800,
        description: "Списание за опрос доставки",
        status: "COMPLETED",
      },
      {
        walletId: clientWallet.id,
        type: "SPENDING",
        amount: 4500,
        description: "Списание за опрос мобильных банков",
        status: "PENDING",
      },
    ],
  });


}

main()
  .catch((error) => {
    console.error("Ошибка seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
