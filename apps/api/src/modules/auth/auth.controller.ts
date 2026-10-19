import { Controller, Post, Body, Get, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/guards/jwt-auth.guard';

function cookie_opts(maxAgeSec: number): any {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeSec * 1000,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login - requires email, password and organization acronym' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email','password','acronym'],
      properties: {
        email: { type: 'string', example: 'sample.admin@example.com' },
        password: { type: 'string', example: 'Sample@123' },
        acronym: { type: 'string', example: 'SAMPLE', description: 'Organization acronym (also accepts org_acronym / organizationAcronym)' },
        org_acronym: { type: 'string', example: 'SAMPLE' },
        organizationAcronym: { type: 'string', example: 'SAMPLE' },
      },
    },
  })
  async login(
    @Body() body: { email: string; password: string; org_acronym?: string; acronym?: string; organizationAcronym?: string },
    @Res({ passthrough: true }) res: any,
  ) {
    const ac = body.org_acronym || body.acronym || body.organizationAcronym;
    const result = await this.auth.login(body.email, body.password, ac);
    // HttpOnly cookies (cross-site for QServers→Render) + body tokens for SPA Bearer fallback
    res.cookie('onehr_access', result.access_token, cookie_opts(60 * 15));
    res.cookie('onehr_refresh', result.refresh_token, cookie_opts(60 * 60 * 24 * 7));
    return result;
  }

  @Public()
  @Post('refresh')
  @ApiBody({ schema: { type:'object', required:['refresh_token'], properties:{ refresh_token:{type:'string', example:'eyJ...'} } } })
  async refresh(@Body() body: { refresh_token?: string }, @Req() req: any, @Res({ passthrough: true }) res: any) {
    // Prefer body token; fall back to HttpOnly cookie
    let token = body?.refresh_token;
    if (!token && req.headers?.cookie) {
      const m = String(req.headers.cookie).match(/(?:^|;\s*)onehr_refresh=([^;]+)/);
      if (m?.[1]) token = decodeURIComponent(m[1]);
    }
    const result = await this.auth.refresh(token || '');
    res.cookie('onehr_access', result.access_token, cookie_opts(60 * 15));
    return result;
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('onehr_access', { path: '/' });
    res.clearCookie('onehr_refresh', { path: '/' });
    return { ok: true };
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
