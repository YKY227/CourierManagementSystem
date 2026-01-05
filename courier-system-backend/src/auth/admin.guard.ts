import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const apiKey = req.headers["x-admin-key"];

    const expected = process.env.ADMIN_API_KEY;
    if (!expected) {
      // If unset, block by default (safer)
      throw new UnauthorizedException("ADMIN_API_KEY not set");
    }

    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException("Invalid admin key");
    }

    return true;
  }
}
