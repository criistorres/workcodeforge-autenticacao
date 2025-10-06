import { Controller, Get, Patch, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMyProfile(@Headers('x-user-id') userId: string): Promise<ProfileResponseDto> {
    if (!userId) {
      throw new HttpException('User ID not provided', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Retornar dados sem a senha
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      telefone: user.telefone,
      cpf: user.cpf,
      departamento: user.departamento,
      avatarUrl: user.avatarUrl,
      tags: user.tags,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  }

  @Patch('me')
  async updateMyProfile(
    @Headers('x-user-id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    if (!userId) {
      throw new HttpException('User ID not provided', HttpStatus.UNAUTHORIZED);
    }

    console.log(`[UPDATE PROFILE] UserID: ${userId}`, updateProfileDto);

    const updatedUser = await this.usersService.updateProfile(userId, updateProfileDto);

    if (!updatedUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Retornar dados atualizados sem a senha
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      username: updatedUser.username,
      telefone: updatedUser.telefone,
      cpf: updatedUser.cpf,
      departamento: updatedUser.departamento,
      avatarUrl: updatedUser.avatarUrl,
      tags: updatedUser.tags,
      isActive: updatedUser.isActive,
      isEmailVerified: updatedUser.isEmailVerified,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin,
    };
  }
}
