export interface User {
  _id: string;
  username: string;
  accountType: "user"
}

export interface Club {
  _id: string;
  username: string;
  clubName: string;
  accountType: "club"
}

export type AuthEntity = User | Club;

export interface UserContextType {
  user: AuthEntity | null;
  setUserContext: (user: AuthEntity | null) => void;
}