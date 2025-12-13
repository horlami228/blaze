export class DataSanitizer {
  static capitalizeName(name: string): string {
    if (!name) return '';

    return name
      .trim()
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Normalize to uppercase enum value
   * "male" -> "MALE"
   */
  static normalizeEnum(value: string): string {
    if (!value) return '';
    return value.trim().toUpperCase().replace(/\s+/g, '_');
  }

  /**
   * Clean phone number (remove spaces, dashes, etc.)
   */
  static sanitizePhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[\s\-\(\)]/g, '');
  }

  /**
   * Parse date flexibly
   */
  static parseDate(dateString: string): Date {
    if (!dateString) throw new Error('Date is required');

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }

    return date;
  }

  /**
   * Remove extra whitespace and normalize
   */
  static cleanString(str: string): string {
    if (!str) return '';
    return str.trim().replace(/\s+/g, ' ');
  }
}
