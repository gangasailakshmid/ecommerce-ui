export function isNewArrival(inStoreDate) {
  if (!inStoreDate) {
    return false;
  }

  const storeDate = new Date(inStoreDate);
  if (Number.isNaN(storeDate.getTime())) {
    return false;
  }

  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  return storeDate <= now && storeDate >= threeMonthsAgo;
}
