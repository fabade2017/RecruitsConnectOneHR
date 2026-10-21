// Sanitising the PATCH /admin/roles/:id payload.
//
// The client edits a role from the object it got back from GET /admin/roles,
// which carries the `permissionLinks` relation array plus immutable columns
// (id, organizationId, createdBy, createdAt, updatedAt, isSystem). Passing that
// straight into `prisma.roleDefinition.update()` makes Prisma reject the
// relation array ("Invalid value provided ... provided ()") and the request
// dies as a 500. So only the columns a role is allowed to change are copied.

export interface RoleUpdatePlan {
  // Columns to write — safe to hand to Prisma as-is.
  data: Record<string, any>;
  // Permission ids to sync onto the role, or null when the client did not touch them.
  permissionIds: string[] | null;
}

function toPermissionIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const entry of value) {
    const id = typeof entry === 'string' ? entry : entry && typeof entry === 'object' ? (entry as any).id : null;
    if (typeof id === 'string' && id.trim()) ids.push(id.trim());
  }
  return Array.from(new Set(ids));
}

export function buildRoleUpdate(dto: any): RoleUpdatePlan {
  const data: Record<string, any> = {};
  const body = dto && typeof dto === 'object' ? dto : {};

  if (body.name !== undefined) data.name = String(body.name);
  if (body.slug !== undefined) data.slug = String(body.slug).trim().toLowerCase();
  if (body.description !== undefined) data.description = body.description;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  if (body.permissions !== undefined) {
    // Stored as a JSON string column; accept an array or an already-serialised string.
    if (typeof body.permissions === 'string') {
      data.permissions = body.permissions;
    } else if (Array.isArray(body.permissions)) {
      data.permissions = JSON.stringify(body.permissions);
    } else {
      data.permissions = JSON.stringify([]);
    }
  }

  const permissionIds = Array.isArray(body.permissionLinks) ? toPermissionIds(body.permissionLinks) : null;

  return { data, permissionIds };
}
