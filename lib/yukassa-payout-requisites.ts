/** E.164-стиль для РФ: 11 цифр с ведущей 7, как в примерах ЮKassa для СБП */
export function normalizeRuPhoneForYukassa(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("9")) {
    digits = `7${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }
  return digits;
}

/** OpenAPI ЮKassa: YooMoneyAccountNumber — от 11 до 33 символов, только цифры */
const YOOMONEY_ACCOUNT_DIGITS_MIN = 11;
const YOOMONEY_ACCOUNT_DIGITS_MAX = 33;

/** CardDataForPayoutDestination.number — паттерн [0-9]{16,19} */
const BANK_CARD_DIGITS_MIN = 16;
const BANK_CARD_DIGITS_MAX = 19;

/** OpenAPI ЮKassa: SbpBankId — ровно 12 символов [a-zA-Z0-9]{12}, пример "100000000111" */
export const YUKASSA_SBP_BANK_ID_PATTERN = /^[a-zA-Z0-9]{12}$/;

export function isValidSbpBankId(raw: string): boolean {
  return YUKASSA_SBP_BANK_ID_PATTERN.test(raw.replace(/\s+/g, "").trim());
}

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

function stripInvisible(raw: string): string {
  return raw.replace(/[\uFEFF\u200B-\u200D\u2060\u00A0]/g, "").trim();
}

export function normalizeYooMoneyWalletNumber(raw: string): string {
  return digitsOnly(stripInvisible(raw));
}

export function normalizeBankCardNumberForPayout(raw: string): string {
  return digitsOnly(stripInvisible(raw));
}

/**
 * Серверная валидация реквизитов выплаты по схеме OpenAPI ЮKassa.
 * @see https://yookassa.ru/developers/api/yookassa-openapi-specification.yaml
 */
function requisitesBankId(requisites: Record<string, string>): string {
  const direct = requisites.bankId ?? requisites.bank_id;
  return typeof direct === "string" ? direct : "";
}

function requisitesCardNumber(requisites: Record<string, string>): string {
  return requisites.cardNumber ?? requisites.card_number ?? "";
}

function requisitesWalletNumber(requisites: Record<string, string>): string {
  return requisites.walletNumber ?? requisites.wallet_number ?? requisites.account_number ?? "";
}

export function assertPayoutRequisitesValid(method: "card" | "sbp" | "wallet", requisites: Record<string, string>) {
  if (method === "wallet") {
    const account = normalizeYooMoneyWalletNumber(requisitesWalletNumber(requisites));
    if (
      account.length < YOOMONEY_ACCOUNT_DIGITS_MIN ||
      account.length > YOOMONEY_ACCOUNT_DIGITS_MAX
    ) {
      throw new Error(
        `PAYOUT_REQUISITES: Номер кошелька ЮMoney должен содержать от ${YOOMONEY_ACCOUNT_DIGITS_MIN} до ${YOOMONEY_ACCOUNT_DIGITS_MAX} цифр (без пробелов). Пример: 4100116075156746. Не используйте номер банковской карты в этом поле.`,
      );
    }
    return;
  }

  if (method === "card") {
    const num = normalizeBankCardNumberForPayout(requisitesCardNumber(requisites));
    if (num.length < BANK_CARD_DIGITS_MIN || num.length > BANK_CARD_DIGITS_MAX) {
      throw new Error(
        `PAYOUT_REQUISITES: Номер карты для выплаты — ${BANK_CARD_DIGITS_MIN}–${BANK_CARD_DIGITS_MAX} цифр без пробелов. Отправка номера карты с вашего сайта возможна только при соблюдении PCI DSS; иначе используйте СБП или кошелёк ЮMoney (см. документацию ЮKassa по выплатам на карту).`,
      );
    }
    return;
  }

  const bankIdRaw = stripInvisible(requisitesBankId(requisites)).replace(/\s+/g, "");
  if (!YUKASSA_SBP_BANK_ID_PATTERN.test(bankIdRaw)) {
    throw new Error(
      "PAYOUT_REQUISITES: Выберите банк из списка ЮKassa (идентификатор участника СБП — ровно 12 латинских букв или цифр). Обновите страницу и дождитесь загрузки списка.",
    );
  }

  const phone = normalizeRuPhoneForYukassa(requisites.phone ?? "");
  if (!/^[1-9]\d{3,14}$/.test(phone)) {
    throw new Error(
      "PAYOUT_REQUISITES: Укажите телефон в формате российского мобильного (например +7 …), только цифры после нормализации — как в документации ЮKassa E.164, пример 79000000000.",
    );
  }
  if (phone.length !== 11 || !phone.startsWith("7")) {
    throw new Error(
      "PAYOUT_REQUISITES: Для выплаты по СБП нужен номер телефона в России: 11 цифр, начинается с 7 (после нормализации), например 79001234567.",
    );
  }
}

export type PayoutDestinationForApi =
  | { type: "yoo_money"; account_number: string }
  | { type: "bank_card"; card: { number: string } }
  | { type: "sbp"; phone: string; bank_id: string };

/** Нормализованные реквизиты для хранения в БД и отправки в ЮKassa */
export function normalizeWithdrawalRequisitesForStorage(
  method: "CARD" | "SBP" | "WALLET",
  requisites: Record<string, string>,
): Record<string, string> {
  if (method === "WALLET") {
    return { walletNumber: normalizeYooMoneyWalletNumber(requisitesWalletNumber(requisites)) };
  }
  if (method === "CARD") {
    return { cardNumber: normalizeBankCardNumberForPayout(requisitesCardNumber(requisites)) };
  }
  const bankId = stripInvisible(requisitesBankId(requisites)).replace(/\s+/g, "");
  return {
    phone: normalizeRuPhoneForYukassa(requisites.phone ?? ""),
    bankId,
  };
}

export function buildPayoutDestinationForApi(method: "card" | "sbp" | "wallet", requisites: Record<string, string>): PayoutDestinationForApi {
  assertPayoutRequisitesValid(method, requisites);

  if (method === "wallet") {
    return {
      type: "yoo_money",
      account_number: normalizeYooMoneyWalletNumber(requisitesWalletNumber(requisites)),
    };
  }

  if (method === "card") {
    return {
      type: "bank_card",
      card: {
        number: normalizeBankCardNumberForPayout(requisitesCardNumber(requisites)),
      },
    };
  }

  const bank_id = stripInvisible(requisitesBankId(requisites)).replace(/\s+/g, "");
  return {
    type: "sbp",
    phone: normalizeRuPhoneForYukassa(requisites.phone ?? ""),
    bank_id,
  };
}
