import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleTokenPayload {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class GoogleStrategy {
  private client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        'GOOGLE_CLIENT_ID is not defined in environment variables',
      );
    }
    this.client = new OAuth2Client(clientId);
  }

  /**
   * Verifies a Google ID token and extracts user profile information
   * @param idToken The Google ID token to verify
   * @returns The verified token payload containing user information
   * @throws UnauthorizedException if token verification fails
   */
  async verifyToken(idToken: string): Promise<GoogleTokenPayload> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      console.log(payload);

      if (!payload) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      // Extract user profile information
      const googlePayload: GoogleTokenPayload = {
        sub: payload.sub,
        email: payload.email || '',
        email_verified: payload.email_verified || false,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
      };

      // Validate required fields
      if (!googlePayload.email) {
        throw new UnauthorizedException('Email not found in Google token');
      }

      return googlePayload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.log('Failed to verify Google token: ' + error.message);
      throw new UnauthorizedException(
        'Failed to verify Google token: ' + error.message,
      );
    }
  }

  /**
   * Extracts user information from Google token payload
   * @param payload The verified Google token payload
   * @returns User information object with firstName, lastName, email, and googleId
   */
  extractUserInfo(payload: GoogleTokenPayload) {
    return {
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name || payload.name?.split(' ')[0] || '',
      lastName:
        payload.family_name ||
        payload.name?.split(' ').slice(1).join(' ') ||
        '',
      emailVerified: payload.email_verified,
      avatar: payload.picture,
    };
  }
}
