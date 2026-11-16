export type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  mustChangePassword: boolean;
}

export interface OtpChallenge {
  challengeId: string;
  email: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface SessionPayload {
  accessToken: string;
  expiresIn: number;
  user: User;
}

export interface ResetChallenge {
  challengeId: string;
  resendAfterSeconds: number;
}
