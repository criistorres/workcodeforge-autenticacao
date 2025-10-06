import { IsString, IsEmail, IsOptional, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(10, 20)
  @Matches(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, {
    message: 'Telefone deve estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX',
  })
  telefone?: string;

  @IsOptional()
  @IsString()
  @Length(11, 14)
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, {
    message: 'CPF deve estar no formato XXX.XXX.XXX-XX ou XXXXXXXXXXX',
  })
  cpf?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  departamento?: string;
}
