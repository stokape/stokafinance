export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string | null;
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  isCurrentAdmin: boolean;
}
