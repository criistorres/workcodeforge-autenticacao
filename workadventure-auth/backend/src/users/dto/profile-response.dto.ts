export class ProfileResponseDto {
  id: string;
  email: string;
  name: string;
  username: string;
  telefone?: string;
  cpf?: string;
  departamento?: string;
  avatarUrl?: string;
  tags: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
}
