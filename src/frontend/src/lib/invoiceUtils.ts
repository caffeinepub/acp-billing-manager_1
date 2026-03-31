/**
 * Convert a number to Indian currency words.
 * e.g. 12345.67 => "Twelve Thousand Three Hundred Forty Five Rupees and Sixty Seven Paise"
 */
export function numberToWords(amount: number): string {
  if (amount === 0) return "Zero Rupees";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100)
      return `${tens[Math.floor(n / 10)]}${n % 10 !== 0 ? ` ${ones[n % 10]}` : ""}`;
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 !== 0 ? ` ${convertLessThanThousand(n % 100)}` : ""}`;
  }

  function convertIndian(num: number): string {
    if (num === 0) return "";
    let result = "";
    let remaining = num;
    const crore = Math.floor(remaining / 10000000);
    remaining %= 10000000;
    const lakh = Math.floor(remaining / 100000);
    remaining %= 100000;
    const thousand = Math.floor(remaining / 1000);
    remaining %= 1000;

    if (crore > 0) result += `${convertLessThanThousand(crore)} Crore `;
    if (lakh > 0) result += `${convertLessThanThousand(lakh)} Lakh `;
    if (thousand > 0)
      result += `${convertLessThanThousand(thousand)} Thousand `;
    if (remaining > 0) result += convertLessThanThousand(remaining);
    return result.trim();
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = `${convertIndian(rupees)} Rupees`;
  if (paise > 0) {
    words += ` and ${convertIndian(paise)} Paise`;
  }
  return words;
}

/**
 * Calculate square feet from length x width.
 */
export function calcSqft(length: number, width: number, qty = 1): number {
  return +(length * width * qty).toFixed(2);
}

/**
 * Format a date string to DD-Mon-YYYY.
 */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}
