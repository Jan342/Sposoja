export interface User {
  _id: string;
  username: string;
}

export interface UserContextType {
  user: User | null;
  setUserContext: (user: User | null) => void;
}