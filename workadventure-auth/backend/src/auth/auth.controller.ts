import { Controller, Post, Body, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log(`[LOGIN] Tentativa de login: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    console.log(`[LOGIN] Login bem-sucedido: ${loginDto.email} - UserID: ${result.userId}`);
    return result;
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    console.log(`[REGISTER] Novo registro: ${registerDto.email} - Nome: ${registerDto.name}`);
    const result = await this.authService.register(registerDto);
    console.log(`[REGISTER] Registro bem-sucedido: ${registerDto.email} - UserID: ${result.userId}`);
    return result;
  }

  @Post('authorize')
  async authorize(@Body() body: any) {
    console.log(`[AUTHORIZE] Gerando código de autorização para UserID: ${body.userId}`);
    return this.authService.authorize(body.userId, body);
  }

  @Get('users')
  async listUsers() {
    const users = await this.usersService.getAllUsers();
    return users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      username: u.username,
      tags: u.tags,
      createdAt: u.createdAt
    }));
  }

  @Get('check-session')
  async checkSession(@Req() req: Request, @Res() res: Response) {
    console.log('[CHECK-SESSION] Verificando sessão...');

    // Buscar token no cookie ou header
    const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('[CHECK-SESSION] Nenhum token encontrado');
      return res.json({ authenticated: false });
    }

    const result = await this.authService.checkSession(token);
    console.log(`[CHECK-SESSION] Resultado: ${result.authenticated ? 'Autenticado' : 'Não autenticado'}`);

    return res.json(result);
  }
}
