"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OIDCController = void 0;
class OIDCController {
    constructor(oidcService) {
        this.oidcService = oidcService;
        this.discovery = async (req, res) => {
            await this.oidcService.handleDiscovery(req, res);
        };
        this.authorize = async (req, res) => {
            await this.oidcService.handleAuthorization(req, res);
        };
        this.token = async (req, res) => {
            await this.oidcService.handleTokenExchange(req, res);
        };
        this.userinfo = async (req, res) => {
            await this.oidcService.handleUserInfo(req, res);
        };
        this.jwks = async (req, res) => {
            await this.oidcService.handleJWKS(req, res);
        };
    }
}
exports.OIDCController = OIDCController;
//# sourceMappingURL=OIDCController.js.map