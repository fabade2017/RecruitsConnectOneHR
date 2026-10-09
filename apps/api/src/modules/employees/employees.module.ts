import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { InvitesPublicController } from './invites-public.controller';
import { EmployeesService } from './employees.service';

@Module({ controllers: [EmployeesController, InvitesPublicController], providers: [EmployeesService] })
export class EmployeesModule {}
