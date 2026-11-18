export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserData = {
  email: string;
  name: string;
  passwordHash: string;
};

export type PublicUser = Omit<User, 'passwordHash'>;
