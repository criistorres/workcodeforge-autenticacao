export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  username: string;
  tags: string[];
  createdAt: Date;
}
