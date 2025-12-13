// src/common/utils/password.util.ts
import * as argon2 from 'argon2';

export class PasswordUtil {
  /**
   * Hash a plain text password
   */
  static async hash(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id, // Recommended type
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3, // Number of iterations
      parallelism: 1, // Number of threads
    });
  }

  /**
   * Verify a password against a hash
   */
  static async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }
}
