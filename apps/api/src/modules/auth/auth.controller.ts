import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login - requires email, password and organization acronym' })
  login(@Body() body: { email: string; password: string; org_acronym?: string; acronym?: string; organizationAcronym?: string }) {
    const ac = body.org_acronym || body.acronym || body.organizationAcronym;
    return this.auth.login(body.email, body.password, ac);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: { refresh_token: string }) {
    return this.auth.refresh(body.refresh_token);
  }

  @Post('device/register')
  registerDevice(@Body() body: any, @Req() req: any) {
    return this.auth.registerDevice(req.user.sub, body);
  }

  @Get('me')
  async me(@Req() req: any) {
    return this.auth.me(req.user.sub);
  }
}
