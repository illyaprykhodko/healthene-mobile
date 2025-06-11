import { SignInState } from './slices/signInSlice';
import { MessagesState } from '../services/messages/types';
import { User } from './api/types';

// Types
export interface AppState {
  initialized: boolean;
  health: boolean;
  auth: boolean;
  user: User | null;
  accessToken: string | null;
  wakeup: boolean;
  keyboard: boolean;
  // session: {
  //   token: string;
  //   refreshToken: string;
  // } | null;
}

// export interface User {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   phone?: string;
// }

// export interface Session {
//   accessToken: string;
//   refreshToken: string;
//   user: User;
// }

// export interface LoginData {
//   email: string;
//   password: string;
// }

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RootState {
  app: AppState;
  signIn: SignInState;
  messages: MessagesState;
}
