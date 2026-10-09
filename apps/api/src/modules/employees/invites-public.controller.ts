import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { Public } from '../../common/guards/jwt-auth.guard';

@ApiTags('staff-invites')
@Controller('staff-invites')
export class InvitesPublicController {
  constructor(private svc: EmployeesService) {}

  @Public()
  @Get(':token')
  @ApiOperation({ summary: 'Validate a staff invite token and return the prefilled profile form data' })
  validate(@Param('token') token: string) {
    return this.svc.getInviteByToken(token);
  }

  @Public()
  @Post(':token/accept')
  @ApiOperation({ summary: 'Accept a staff invite — create the profile and set a password' })
  @ApiBody({ schema: { type: 'object', required: ['password'], properties: {
    password: { type: 'string', example: 'NewPass@123' },
    first_name: { type: 'string' },
    last_name: { type: 'string' },
    phone: { type: 'string' },
  } } })
  accept(@Param('token') token: string, @Body() dto: any) {
    return this.svc.acceptInvite(token, dto);
  }
}
