export function isPrismaSchemaMismatchError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("p2021") ||
    message.includes("p2022") ||
    message.includes("column") && message.includes("does not exist") ||
    message.includes("the column") ||
    message.includes("error querying the database")
  );
}
