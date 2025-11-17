import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { OidcService } from '../oidc/oidc.service';
import { LoginDto, RegisterDto } from './dto/login.dto';
import { UserRoleEntity } from '../users/entities/user-role.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private oidcService: OidcService,
    @InjectRepository(UserRoleEntity)
    private userRolesRepository: Repository<UserRoleEntity>,
  ) {}

  async login(loginDto: LoginDto) {
    console.log(`[LOGIN DEBUG] Email recebido: "${loginDto.email}" | Length: ${loginDto.email.length}`);
    console.log(`[LOGIN DEBUG] Senha recebida: "${loginDto.password}" | Length: ${loginDto.password.length}`);

    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      console.log(`[LOGIN DEBUG] Usuário NÃO encontrado para email: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[LOGIN DEBUG] Usuário encontrado! ID: ${user.id}, Email: ${user.email}`);

    const isPasswordValid = await this.usersService.validatePassword(user, loginDto.password);
    console.log(`[LOGIN DEBUG] Senha válida? ${isPasswordValid}`);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Atualizar último login
    await this.usersService.updateLastLogin(user.id);

    // Criar log de auditoria
    await this.usersService.createAuditLog(user.id, 'login', null, {
      timestamp: new Date(),
    });

    // Buscar roles do usuário
    const userRoles = await this.userRolesRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      tags: user.tags,
      avatarUrl: user.avatarUrl,
      telefone: user.telefone,
      departamento: user.departamento,
      defaultMap: user.defaultMap,
      roles: userRoles.map((ur) => ur.role),
      isAdmin: user.tags?.includes('admin') || user.tags?.includes('super_admin') || false,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const user = await this.usersService.create(registerDto);

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      tags: user.tags
    };
  }

  async authorize(userId: string, authParams: any) {
    const code = await this.oidcService.generateAuthorizationCode({
      userId,
      clientId: authParams.clientId,
      redirectUri: authParams.redirectUri,
      scope: authParams.scope,
      state: authParams.state,
      nonce: authParams.nonce
    });

    return { code };
  }

  async checkSession(token: string) {
    try {
      // Validar o token JWT
      const decoded = await this.oidcService.validateAccessToken(token);

      if (!decoded) {
        return { authenticated: false };
      }

      // Buscar o usuário
      const user = await this.usersService.findById(decoded.sub);

      if (!user) {
        return { authenticated: false };
      }

      // Retornar informações do usuário
      return {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          tags: user.tags,
          defaultMap: user.defaultMap || 'main'
        }
      };
    } catch (error) {
      console.error('[CHECK-SESSION] Erro ao validar token:', error.message);
      return { authenticated: false };
    }
  }
}
