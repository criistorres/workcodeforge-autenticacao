"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
let UsersService = class UsersService {
    constructor() {
        this.users = new Map();
        this.createInitialUsers();
    }
    async createInitialUsers() {
        const hashedPwd = await bcrypt.hash('pwd', 10);
        const users = [
            {
                id: '1',
                email: '[email protected]',
                password: hashedPwd,
                name: 'User 1',
                username: 'user1',
                tags: ['admin', 'moderator'],
                createdAt: new Date()
            },
            {
                id: '2',
                email: '[email protected]',
                password: hashedPwd,
                name: 'User 2',
                username: 'user2',
                tags: ['member'],
                createdAt: new Date()
            }
        ];
        users.forEach(user => this.users.set(user.id, user));
    }
    async findByEmail(email) {
        return Array.from(this.users.values()).find(u => u.email === email);
    }
    async findById(id) {
        return this.users.get(id);
    }
    async create(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = {
            id: (0, uuid_1.v4)(),
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            username: userData.username || userData.email.split('@')[0],
            tags: userData.tags || ['member'],
            createdAt: new Date()
        };
        this.users.set(user.id, user);
        return user;
    }
    async validatePassword(user, password) {
        return bcrypt.compare(password, user.password);
    }
    async getAllUsers() {
        return Array.from(this.users.values());
    }
    async updateTags(userId, tags) {
        const user = this.users.get(userId);
        if (user) {
            user.tags = tags;
            this.users.set(userId, user);
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], UsersService);
//# sourceMappingURL=users.service.js.map