import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { PermissionsGuard, Permissions } from './guards/permissions.guard';

@Controller('admin')
@UseGuards(AdminGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============ USERS ============

  @Get('me')
  async getCurrentUser(@Req() req: any) {
    const userId = req.user.id;
    return this.adminService.getUserDetails(userId);
  }

  @Put('me')
  async updateCurrentUser(
    @Req() req: any,
    @Body() data: {
      name?: string;
      email?: string;
      username?: string;
      avatarUrl?: string;
      telefone?: string;
      departamento?: string;
      password?: string;
    },
  ) {
    const userId = req.user.id;
    return this.adminService.updateUser(userId, data);
  }

  @Post('logout')
  async logout(@Req() req: any) {
    const userId = req.user.id;
    // Criar log de auditoria para logout
    await this.adminService.createAuditLog(userId, 'logout');
    return { success: true, message: 'Logout realizado com sucesso' };
  }

  @Get('users')
  @Permissions('users.view')
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    return this.adminService.getUsers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      role,
      status,
      sort,
      order,
    });
  }

  @Get('users/:id')
  @Permissions('users.view.details')
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Post('users')
  @Permissions('users.create')
  async createUser(
    @Body() data: {
      name: string;
      email: string;
      username: string;
      password: string;
      avatarUrl?: string;
      telefone?: string;
      cpf?: string;
      departamento?: string;
      isActive?: boolean;
      defaultMap?: string;
      roleIds: string[];
    },
    @Req() req: any,
  ) {
    try {
      const adminId = req.user.id;
      return await this.adminService.createUser(data, adminId);
    } catch (error) {
      throw new BadRequestException(error.message || 'Erro ao criar usuário');
    }
  }

  @Put('users/:id')
  @Permissions('users.edit')
  async updateUser(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      email?: string;
      username?: string;
      avatarUrl?: string;
      telefone?: string;
      cpf?: string;
      departamento?: string;
      isActive?: boolean;
      defaultMap?: string;
    },
  ) {
    try {
      return await this.adminService.updateUser(id, data);
    } catch (error) {
      throw new BadRequestException(error.message || 'Erro ao atualizar usuário');
    }
  }

  @Put('users/:id/roles')
  @Permissions('roles.assign')
  async assignRoles(
    @Param('id') id: string,
    @Body() data: { roleIds: string[] },
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    return this.adminService.assignRolesToUser(id, data.roleIds, adminId);
  }

  @Put('users/:id/block')
  @Permissions('users.block')
  async blockUser(
    @Param('id') id: string,
    @Body() data: { blocked: boolean; reason?: string },
    @Req() req: any,
  ) {
    const adminId = req.user.id;

    if (data.blocked) {
      return this.adminService.blockUser(id, data.reason || 'No reason provided', adminId);
    } else {
      return this.adminService.unblockUser(id, adminId);
    }
  }

  @Delete('users/:id')
  @Permissions('users.delete')
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user.id;
    return this.adminService.deleteUser(id, adminId);
  }

  // ============ ROLES ============

  @Get('roles')
  @Permissions('roles.view')
  async getRoles() {
    return this.adminService.getRoles();
  }

  @Post('roles')
  @Permissions('roles.create')
  async createRole(
    @Body() data: {
      name: string;
      displayName: string;
      description?: string;
      color?: string;
      permissions: string[];
    },
  ) {
    return this.adminService.createRole(data);
  }

  @Put('roles/:id')
  @Permissions('roles.edit')
  async updateRole(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateRole(id, data);
  }

  @Delete('roles/:id')
  @Permissions('roles.delete')
  async deleteRole(@Param('id') id: string) {
    return this.adminService.deleteRole(id);
  }

  // ============ AUDIT LOGS ============

  @Get('audit-logs')
  @Permissions('audit.view')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      userId,
      action,
    });
  }

  // ============ STATS ============

  @Get('stats')
  @Permissions('users.view')
  async getStats() {
    return this.adminService.getStats();
  }

  // ============ MAPS ============

  @Get('maps')
  @Permissions('users.view')
  async getMaps() {
    return this.adminService.getMaps();
  }

  @Post('maps')
  @Permissions('users.edit')
  async createMap(
    @Body() data: {
      name: string;
      displayName: string;
      description?: string;
      mapUrl?: string;
      isActive?: boolean;
    },
  ) {
    return this.adminService.createMap(data);
  }

  @Put('maps/:id')
  @Permissions('users.edit')
  async updateMap(
    @Param('id') id: string,
    @Body() data: {
      name?: string;
      displayName?: string;
      description?: string;
      mapUrl?: string;
      isActive?: boolean;
    },
  ) {
    return this.adminService.updateMap(id, data);
  }

  @Delete('maps/:id')
  @Permissions('users.delete')
  async deleteMap(@Param('id') id: string) {
    return this.adminService.deleteMap(id);
  }
}
