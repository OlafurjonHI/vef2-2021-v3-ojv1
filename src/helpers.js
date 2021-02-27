/* eslint-disable no-bitwise */
// eslint-disable-next-line no-mixed-operators
const isLeapYear = (y) => !(y & 3 || !(y % 25) && y & 15);
const getRandomIntInclusive = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
export const randomKennitala = () => {
  let maxdays = 0;
  let month = getRandomIntInclusive(1, 12);
  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      maxdays = 31;
      break;
    case 2:
      maxdays = 28;
      break;
    default:
      maxdays = 30;
  }
  const legalDate = (new Date().getFullYear() - 5); // leyfum max 5 ára krökkum að signa?
  const year = getRandomIntInclusive(1921, legalDate);
  if (isLeapYear(year)) maxdays = 29;
  let day = getRandomIntInclusive(1, maxdays);
  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;
  const lastDigit = (year < 2000) ? 9 : 0;
  return `${day}${month}${year.toString().substring(2, 4)}${getRandomIntInclusive(100, 999)}${lastDigit}`;
};
