// import { SignInState } from './slices/signInSlice';
// import { MessagesState } from '../services/messages/types';
// local dependencies
import { User } from 'types';
// import { User } from './api/types';

// Types
export interface AppState {
  auth: boolean;
  wakeup: boolean;
  user: User | null;
  keyboard: boolean;
  initialized: boolean;
  // NOTE tri-state on purpose: `null` means "backend state not known yet", which must not
  // be confused with `false` ("backend is down") — only the latter shows the maintenance screen.
  health: boolean | null;
  birdSoundEnabled: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  includeRescueFoodsInShoppingList: boolean;
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

// export interface SignUpData {
//   email: string;
//   password: string;
//   firstName: string;
//   lastName: string;
//   phone?: string;
// }

// export interface RootState {
//   app: AppState;
//   signIn: SignInState;
//   messages: MessagesState;
// }
