const SLOT_MINUTES = 20;
const OPEN_HOUR = 10;
const CLOSE_HOUR = 20;
const SHOP_TIMEZONE_OFFSET = 1;

function roundToNextSlot(date) {
  const ms = 1000 * 60 * SLOT_MINUTES;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

function getBusinessWindow(date) {
  const opening = new Date(date.getTime());
  opening.setUTCHours(OPEN_HOUR - SHOP_TIMEZONE_OFFSET, 0, 0, 0);

  const closing = new Date(date.getTime());
  closing.setUTCHours(CLOSE_HOUR - SHOP_TIMEZONE_OFFSET, 0, 0, 0);

  return { opening, closing };
}

function getNextBusinessSlot(date) {
  const nextSlot = roundToNextSlot(date);
  const { opening, closing } = getBusinessWindow(nextSlot);

  if (nextSlot < opening) {
    return opening;
  }

  if (nextSlot >= closing) {
    const nextDay = new Date(nextSlot.getTime());
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setUTCHours(OPEN_HOUR - SHOP_TIMEZONE_OFFSET, 0, 0, 0);
    return nextDay;
  }

  return nextSlot;
}

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(1, 0, 0, 0); // 1am local
const slot = getNextBusinessSlot(tomorrow);
console.log("Slot is:", slot.toISOString());
