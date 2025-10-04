"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://play.workadventure.localhost',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type']
    });
    await app.listen(process.env.PORT || 3000);
    console.log(`🚀 Auth server running on http://localhost:${process.env.PORT || 3000}`);
    console.log(`📝 Discovery: http://localhost:${process.env.PORT || 3000}/.well-known/openid-configuration`);
}
bootstrap();
//# sourceMappingURL=main.js.map