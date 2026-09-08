"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
function diffMinutes(a, b) { return Math.round((b.getTime() - a.getTime()) / 60000); }
function toRadians(deg) { return deg * Math.PI / 180; }
function haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}
function normalizeLocation(dto) {
    let obj = dto.location || dto.gps || dto.coords || null;
    if (!obj && dto.latitude != null && dto.longitude != null)
        obj = { latitude: dto.latitude, longitude: dto.longitude, accuracy: dto.accuracy, address: dto.address };
    if (!obj)
        return { str: null, obj: null, lat: null, lng: null, accuracy: null };
    if (typeof obj === 'string') {
        try {
            const parsed = JSON.parse(obj);
            return { str: obj, obj: parsed, lat: parsed.latitude ?? parsed.lat ?? null, lng: parsed.longitude ?? parsed.lng ?? null, accuracy: parsed.accuracy ?? null };
        }
        catch {
            return { str: obj, obj: null, lat: null, lng: null, accuracy: null };
        }
    }
    const lat = obj.latitude ?? obj.lat ?? null;
    const lng = obj.longitude ?? obj.lng ?? null;
    const accuracy = obj.accuracy ?? null;
    // store as JSON string
    return { str: JSON.stringify(obj), obj, lat: lat != null ? Number(lat) : null, lng: lng != null ? Number(lng) : null, accuracy: accuracy != null ? Number(accuracy) : null };
}
let AttendanceService = class AttendanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async clockIn(orgId, userId, dto) {
        const employee = await this.prisma.employee.findUnique({ where: { userId } });
        if (!employee)
            throw new common_1.ForbiddenException('Employee not found for user');
        const today = new Date();
        const dateOnly = new Date(today.toISOString().slice(0, 10));
        const existing = await this.prisma.workSession.findUnique({ where: { organizationId_employeeId_date: { organizationId: orgId, employeeId: employee.id, date: dateOnly } } });
        if (existing?.clockInAt)
            throw new common_1.ConflictException('Already clocked in today');
        const clockInAt = dto.timestamp ? new Date(dto.timestamp) : new Date();
        const session = await this.prisma.workSession.upsert({
            where: { organizationId_employeeId_date: { organizationId: orgId, employeeId: employee.id, date: dateOnly } },
            create: { organizationId: orgId, employeeId: employee.id, date: dateOnly, clockInAt, status: 'working', scheduledMinutes: 480, verificationScore: dto.face_snapshot_base64 ? 98 : 85 },
            update: { clockInAt, status: 'working' },
        });
        const faceRef = dto.face_snapshot_base64 ? `snap/${session.id}/in.jpg` : null;
        const faceHash = dto.face_snapshot_base64 ? dto.face_snapshot_base64.slice(0, 100) : null;
        const isFacial = !!dto.face_snapshot_base64;
        const loc = normalizeLocation(dto);
        await this.prisma.attendanceEvent.create({
            data: {
                organizationId: orgId, employeeId: employee.id, workSessionId: session.id,
                eventType: 'clock_in', timestamp: clockInAt, verificationMethod: isFacial ? 'facial' : (dto.method || 'mobile'),
                faceSnapshotRef: faceRef,
                faceConfidence: isFacial ? (dto.face_meta?.liveness === 'verified' ? 98 : 75) : null,
                verificationStatus: isFacial ? (dto.face_meta?.liveness === 'verified' ? 'verified' : 'pending') : 'verified', ipAddress: dto.ip,
                location: loc.str,
                metadata: JSON.stringify({ ...(dto.metadata ? JSON.parse(JSON.stringify(dto.metadata)) : {}), gps: loc.obj, gpsAccuracy: loc.accuracy, consentGps: employee.consentGps }),
            },
        });
        // Device sharing check
        if (dto.device_fingerprint) {
            const sharing = await this.prisma.attendanceEvent.findFirst({
                where: { organizationId: orgId, device: { deviceFingerprint: dto.device_fingerprint }, employeeId: { not: employee.id }, timestamp: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
            });
            if (sharing)
                await this.prisma.attendanceException.create({
                    data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'device_sharing', severity: 'medium', details: JSON.stringify({ device_fingerprint: dto.device_fingerprint, face_mismatch: isFacial }) },
                });
        }
        // Face motion / liveness fraud checks + enrollment comparison
        if (isFacial && dto.face_meta) {
            const m = parseFloat(dto.face_meta.motion || 0);
            const liveness = dto.face_meta.liveness;
            if (liveness !== 'verified' || m < 0.5 || m > 12) {
                await this.prisma.attendanceException.create({
                    data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'suspicious_attendance', severity: m < 0.5 ? 'high' : 'medium', details: JSON.stringify({ reason: 'liveness_failed', motion: m, liveness, faceDetected: dto.face_meta.faceDetected }) },
                });
            }
            // Compare live face with enrolled faceProfileRef (if exists)
            if (employee.faceProfileRef) {
                try {
                    const enrolled = JSON.parse(employee.faceProfileRef);
                    const liveSlice = (dto.face_snapshot_base64 || '').slice(22, 522); // skip data:image prefix
                    let bestScore = 0;
                    for (const ref of enrolled) {
                        const refSlice = ref.slice(22, 522);
                        let matches = 0;
                        const len = Math.min(liveSlice.length, refSlice.length, 500);
                        for (let i = 0; i < len; i++)
                            if (liveSlice[i] === refSlice[i])
                                matches++;
                        const score = len ? (matches / len) * 100 : 0;
                        if (score > bestScore)
                            bestScore = score;
                    }
                    const confidence = Math.round(bestScore);
                    // Update event confidence with comparison
                    if (bestScore < 60) {
                        await this.prisma.attendanceException.create({
                            data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'duplicate_face', severity: 'critical', details: JSON.stringify({ reason: 'face_mismatch', confidence, expected: 'enrolled', liveMotion: m }) },
                        });
                    }
                    else if (bestScore < 80) {
                        await this.prisma.attendanceException.create({
                            data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'suspicious_attendance', severity: 'medium', details: JSON.stringify({ reason: 'low_face_similarity', confidence }) },
                        });
                    }
                }
                catch { }
            }
            else {
                // No enrolled face yet — flag for enrollment
                await this.prisma.attendanceException.create({
                    data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'suspicious_attendance', severity: 'low', details: JSON.stringify({ reason: 'no_enrolled_face', hint: 'Ask HR to send face-enroll link' }) },
                });
            }
            // Duplicate face check: same hash from different employee in last 10 min (proxy clock-in)
            if (faceHash) {
                const dup = await this.prisma.attendanceEvent.findFirst({
                    where: { organizationId: orgId, employeeId: { not: employee.id }, faceSnapshotRef: { not: null }, timestamp: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
                    orderBy: { timestamp: 'desc' },
                });
                if (dup) {
                    await this.prisma.attendanceException.create({
                        data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'duplicate_face', severity: 'critical', details: JSON.stringify({ reason: 'possible_proxy', prevEmployeeId: dup.employeeId, motion: m }) },
                    });
                }
            }
        }
        else if (!isFacial) {
            await this.prisma.attendanceException.create({
                data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'suspicious_attendance', severity: 'low', details: JSON.stringify({ reason: 'no_face_snapshot', method: dto.method }) },
            });
        }
        // GPS handling — real geolocation
        try {
            const policy = await this.prisma.attendancePolicy.findUnique({ where: { organizationId: orgId } });
            const requireGps = policy?.requireGps || false;
            if (requireGps && !loc.str) {
                await this.prisma.attendanceException.create({
                    data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'suspicious_attendance', severity: 'high', details: JSON.stringify({ reason: 'missing_gps', message: 'GPS required but not provided', consentGps: employee.consentGps }) },
                });
            }
            if (loc.lat != null && loc.lng != null) {
                // Check consent
                if (!employee.consentGps) {
                    await this.prisma.consentLog.create({ data: { employeeId: employee.id, type: 'gps', granted: false, ip: dto.ip } }).catch(() => { });
                }
                // Geofence vs branch
                if (employee.branchId) {
                    const branch = await this.prisma.branch.findUnique({ where: { id: employee.branchId } });
                    if (branch?.latitude != null && branch?.longitude != null) {
                        const dist = haversineMeters(loc.lat, loc.lng, branch.latitude, branch.longitude);
                        const radius = branch.gpsRadius || 200;
                        if (dist > radius) {
                            await this.prisma.attendanceException.create({
                                data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'out_of_geofence', severity: dist > radius * 3 ? 'high' : 'medium', details: JSON.stringify({ reason: 'out_of_geofence', distance_m: Math.round(dist), radius_m: radius, branch: branch.name, gps: loc.obj }) },
                            });
                        }
                    }
                }
                // Poor accuracy flag
                if (loc.accuracy != null && loc.accuracy > 100) {
                    await this.prisma.attendanceException.create({
                        data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'suspicious_attendance', severity: 'low', details: JSON.stringify({ reason: 'poor_gps_accuracy', accuracy: loc.accuracy }) },
                    });
                }
            }
        }
        catch { }
        return session;
    }
    async clockOut(orgId, userId, dto) {
        const employee = await this.prisma.employee.findUnique({ where: { userId } });
        if (!employee)
            throw new common_1.ForbiddenException('Employee not found');
        const dateOnly = new Date(new Date().toISOString().slice(0, 10));
        const session = await this.prisma.workSession.findUnique({ where: { organizationId_employeeId_date: { organizationId: orgId, employeeId: employee.id, date: dateOnly } } });
        if (!session?.clockInAt)
            throw new common_1.ConflictException('Not clocked in');
        if (session.clockOutAt)
            throw new common_1.ConflictException('Already clocked out');
        const clockOutAt = dto.timestamp ? new Date(dto.timestamp) : new Date();
        const gross = diffMinutes(session.clockInAt, clockOutAt);
        let breakMins = 0;
        try {
            const breaks = session.breaks ? JSON.parse(session.breaks) : [];
            for (const b of breaks)
                if (b.start && b.end)
                    breakMins += diffMinutes(new Date(b.start), new Date(b.end));
                else if (b.start && !b.end)
                    breakMins += diffMinutes(new Date(b.start), clockOutAt);
        }
        catch { }
        const net = gross - breakMins;
        const overtime = Math.max(0, net - (session.scheduledMinutes || 480));
        const isFacialOut = !!dto.face_snapshot_base64;
        const faceRefOut = isFacialOut ? `snap/${session.id}/out.jpg` : null;
        const updated = await this.prisma.workSession.update({
            where: { id: session.id },
            data: { clockOutAt, grossDurationMinutes: gross, breakDurationMinutes: breakMins, netWorkingMinutes: net, overtimeMinutes: overtime, status: 'clocked_out' },
        });
        const locOut = normalizeLocation(dto);
        await this.prisma.attendanceEvent.create({
            data: {
                organizationId: orgId, employeeId: employee.id, workSessionId: session.id,
                eventType: 'clock_out', timestamp: clockOutAt,
                verificationMethod: isFacialOut ? 'facial' : (dto.method || 'mobile'),
                faceSnapshotRef: faceRefOut,
                faceConfidence: isFacialOut ? (dto.face_meta?.liveness === 'verified' ? 98 : 75) : null,
                verificationStatus: isFacialOut ? (dto.face_meta?.liveness === 'verified' ? 'verified' : 'pending') : 'verified',
                ipAddress: dto.ip,
                location: locOut.str,
                metadata: JSON.stringify({ gps: locOut.obj }),
            },
        });
        if (isFacialOut && dto.face_meta) {
            const m = parseFloat(dto.face_meta.motion || 0);
            if (dto.face_meta.liveness !== 'verified' || m < 0.5 || m > 12) {
                await this.prisma.attendanceException.create({
                    data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'suspicious_attendance', severity: 'medium', details: JSON.stringify({ reason: 'liveness_failed_out', motion: m, liveness: dto.face_meta.liveness }) },
                });
            }
        }
        // GPS for clock-out
        try {
            if (locOut.lat != null && locOut.lng != null && employee.branchId) {
                const branch = await this.prisma.branch.findUnique({ where: { id: employee.branchId } });
                if (branch?.latitude != null && branch?.longitude != null) {
                    const dist = haversineMeters(locOut.lat, locOut.lng, branch.latitude, branch.longitude);
                    const radius = branch.gpsRadius || 200;
                    if (dist > radius) {
                        await this.prisma.attendanceException.create({
                            data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, type: 'out_of_geofence', severity: 'medium', details: JSON.stringify({ reason: 'out_of_geofence_out', distance_m: Math.round(dist), radius_m: radius, gps: locOut.obj }) },
                        });
                    }
                }
            }
        }
        catch { }
        return updated;
    }
    async breakStart(orgId, userId, dto) {
        const employee = await this.prisma.employee.findUnique({ where: { userId } });
        const dateOnly = new Date(new Date().toISOString().slice(0, 10));
        const session = await this.prisma.workSession.findUnique({ where: { organizationId_employeeId_date: { organizationId: orgId, employeeId: employee.id, date: dateOnly } } });
        if (!session)
            throw new common_1.ConflictException('No session');
        const breaks = (session.breaks ? JSON.parse(session.breaks) : []) || [];
        breaks.push({ start: dto.timestamp || new Date().toISOString(), end: null });
        await this.prisma.workSession.update({ where: { id: session.id }, data: { breaks: JSON.stringify(breaks), status: 'on_break' } });
        await this.prisma.attendanceEvent.create({ data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, eventType: 'break_start', timestamp: new Date(dto.timestamp || Date.now()), verificationMethod: 'mobile' } });
        return { status: 'on_break' };
    }
    async breakEnd(orgId, userId, dto) {
        const employee = await this.prisma.employee.findUnique({ where: { userId } });
        const dateOnly = new Date(new Date().toISOString().slice(0, 10));
        const session = await this.prisma.workSession.findUnique({ where: { organizationId_employeeId_date: { organizationId: orgId, employeeId: employee.id, date: dateOnly } } });
        if (!session)
            throw new common_1.ConflictException('No session');
        const breaks = (session.breaks ? JSON.parse(session.breaks) : []) || [];
        const last = breaks[breaks.length - 1];
        if (last)
            last.end = dto.timestamp || new Date().toISOString();
        await this.prisma.workSession.update({ where: { id: session.id }, data: { breaks: JSON.stringify(breaks), status: 'working' } });
        await this.prisma.attendanceEvent.create({ data: { organizationId: orgId, employeeId: employee.id, workSessionId: session.id, eventType: 'break_end', timestamp: new Date(dto.timestamp || Date.now()), verificationMethod: 'mobile' } });
        return { status: 'working' };
    }
    async sessions(orgId, query, user) {
        const where = { organizationId: orgId };
        if (query.employee_id)
            where.employeeId = query.employee_id;
        if (query.date)
            where.date = new Date(query.date);
        if (query.status)
            where.status = query.status;
        // RBAC scoping
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp)
                where.employeeId = emp.id;
        }
        else if (user?.role === 'manager') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own && !query.employee_id) {
                const team = await this.prisma.employee.findMany({ where: { organizationId: orgId, managerId: own.id }, select: { id: true } });
                const ids = [own.id, ...team.map(t => t.id)];
                where.employeeId = { in: ids };
            }
        }
        return this.prisma.workSession.findMany({ where, take: 50, orderBy: { date: 'desc' }, include: { employee: true } });
    }
    async commandCenter(orgId, user) {
        const today = new Date(new Date().toISOString().slice(0, 10));
        // Scope for manager
        let employeeFilter = { organizationId: orgId, status: { not: 'exited' } };
        let sessionFilter = { organizationId: orgId, date: today };
        if (user?.role === 'manager') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own) {
                const team = await this.prisma.employee.findMany({ where: { organizationId: orgId, managerId: own.id }, select: { id: true } });
                const ids = [own.id, ...team.map(t => t.id)];
                employeeFilter.id = { in: ids };
                sessionFilter.employeeId = { in: ids };
            }
        }
        const [employees, sessions, exceptions, leaveOn] = await Promise.all([
            this.prisma.employee.count({ where: employeeFilter }),
            this.prisma.workSession.findMany({ where: sessionFilter }),
            this.prisma.attendanceException.count({ where: { organizationId: orgId, status: 'pending' } }),
            this.prisma.leaveRequest.count({ where: { organizationId: orgId, status: 'approved', startDate: { lte: today }, endDate: { gte: today } } }),
        ]);
        const clockedIn = sessions.filter(s => s.clockInAt && !s.clockOutAt || s.status === 'working' || s.status === 'on_break').length;
        const onBreak = sessions.filter(s => s.status === 'on_break').length;
        const late = sessions.filter(s => (s.lateMinutes || 0) > 0).length;
        const overtime = sessions.filter(s => (s.overtimeMinutes || 0) > 0).length;
        const remoteEmployees = await this.prisma.employee.count({ where: { ...employeeFilter, workArrangement: { in: ['remote', 'hybrid', 'field', 'mobile'] } } }).catch(() => 0);
        const pendingApprovals = await this.prisma.leaveRequest.count({ where: { organizationId: orgId, status: 'pending' } }).catch(() => 0) + await this.prisma.workflowInstance.count({ where: { organizationId: orgId, status: 'pending' } }).catch(() => 0);
        return { today: today.toISOString().slice(0, 10), employees, clocked_in: clockedIn, remote: remoteEmployees, on_break: onBreak, absent: Math.max(0, employees - sessions.length), late, on_leave: leaveOn, overtime, exceptions, pending_approvals: pendingApprovals };
    }
    exceptionsList(orgId, query) {
        const where = { organizationId: orgId };
        if (query.type)
            where.type = query.type;
        if (query.status)
            where.status = query.status;
        return this.prisma.attendanceException.findMany({ where, take: 50, orderBy: { createdAt: 'desc' } });
    }
    resolveException(orgId, id, dto) {
        return this.prisma.attendanceException.update({ where: { id }, data: { status: dto.status, details: JSON.stringify({ ...dto }) } });
    }
    // Superadmin determines clock-out for forgotten cases
    async adminClockOut(orgId, sessionId, clockOutAtStr, reason, user) {
        const session = await this.prisma.workSession.findFirst({ where: { id: sessionId, organizationId: orgId } });
        if (!session)
            throw new common_1.ForbiddenException('Session not found');
        if (session.clockOutAt)
            throw new common_1.ConflictException('Already clocked out');
        if (!session.clockInAt)
            throw new common_1.ConflictException('Not clocked in');
        const clockOutAt = new Date(clockOutAtStr);
        if (isNaN(clockOutAt.getTime()))
            throw new common_1.ConflictException('Invalid clockOutAt');
        if (clockOutAt <= session.clockInAt)
            throw new common_1.ConflictException('clockOut must be after clockIn');
        const gross = diffMinutes(session.clockInAt, clockOutAt);
        let breakMins = 0;
        try {
            const breaks = session.breaks ? JSON.parse(session.breaks) : [];
            for (const b of breaks)
                if (b.start && b.end)
                    breakMins += diffMinutes(new Date(b.start), new Date(b.end));
        }
        catch { }
        const net = gross - breakMins;
        const overtime = Math.max(0, net - (session.scheduledMinutes || 480));
        const updated = await this.prisma.workSession.update({
            where: { id: sessionId },
            data: { clockOutAt, grossDurationMinutes: gross, breakDurationMinutes: breakMins, netWorkingMinutes: net, overtimeMinutes: overtime, status: 'clocked_out' },
        });
        await this.prisma.attendanceEvent.create({
            data: { organizationId: orgId, employeeId: session.employeeId, workSessionId: session.id, eventType: 'clock_out', timestamp: clockOutAt, verificationMethod: 'api', verificationStatus: 'verified', metadata: JSON.stringify({ adminSet: true, by: user.sub, reason }) },
        });
        // Resolve any missing_clockout exception for this session
        await this.prisma.attendanceException.updateMany({
            where: { workSessionId: sessionId, type: 'missing_clockout', status: { in: ['pending', 'in_review'] } },
            data: { status: 'resolved', details: JSON.stringify({ resolvedBy: 'admin', reason }) },
        }).catch(() => { });
        return updated;
    }
    async autoCloseMissing(orgId, dateStr, clockOutAtStr, user) {
        const date = new Date(dateStr);
        const dateOnly = new Date(date.toISOString().slice(0, 10));
        const where = { organizationId: orgId, date: dateOnly, clockOutAt: null, clockInAt: { not: null } };
        const sessions = await this.prisma.workSession.findMany({ where });
        let closed = 0;
        for (const s of sessions) {
            const defaultOut = clockOutAtStr ? new Date(clockOutAtStr) : new Date(s.clockInAt.getTime() + (s.scheduledMinutes || 480) * 60 * 1000);
            // If dateOnly mismatch, keep same date but use time from defaultOut
            const out = new Date(dateOnly);
            out.setHours(defaultOut.getHours(), defaultOut.getMinutes(), 0, 0);
            if (out <= s.clockInAt)
                out.setTime(s.clockInAt.getTime() + 8 * 60 * 60 * 1000);
            try {
                await this.adminClockOut(orgId, s.id, out.toISOString(), 'auto-closed by superadmin', user);
                closed++;
            }
            catch { }
        }
        return { date: dateOnly.toISOString().slice(0, 10), found: sessions.length, closed };
    }
    async missingSessions(orgId, query) {
        const where = { organizationId: orgId, clockOutAt: null, clockInAt: { not: null } };
        if (query.date)
            where.date = new Date(query.date);
        if (query.employee_id)
            where.employeeId = query.employee_id;
        return this.prisma.workSession.findMany({ where, take: 50, orderBy: { date: 'desc' }, include: { employee: true } });
    }
    async mapData(orgId, query, user) {
        const dateStr = query.date || new Date().toISOString().slice(0, 10);
        const date = new Date(dateStr);
        const where = { organizationId: orgId, timestamp: { gte: new Date(dateStr), lt: new Date(new Date(dateStr).getTime() + 86400000) }, location: { not: null } };
        if (query.employee_id)
            where.employeeId = query.employee_id;
        // RBAC
        if (user?.role === 'employee') {
            const emp = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (emp)
                where.employeeId = emp.id;
        }
        else if (user?.role === 'manager') {
            const own = await this.prisma.employee.findUnique({ where: { userId: user.sub } });
            if (own && !query.employee_id) {
                const team = await this.prisma.employee.findMany({ where: { organizationId: orgId, managerId: own.id }, select: { id: true } });
                where.employeeId = { in: [own.id, ...team.map(t => t.id)] };
            }
        }
        const events = await this.prisma.attendanceEvent.findMany({
            where,
            take: 200,
            orderBy: { timestamp: 'desc' },
            include: { employee: { select: { id: true, employeeCode: true, jobTitle: true, branchId: true } } },
        });
        const branches = await this.prisma.branch.findMany({ where: { organizationId: orgId } });
        // Parse locations
        const points = events.map(e => {
            let loc = null;
            try {
                loc = e.location ? JSON.parse(e.location) : null;
            }
            catch {
                loc = null;
            }
            if (!loc && e.location && e.location.includes(',')) {
                const [lat, lng] = e.location.split(',').map(Number);
                loc = { latitude: lat, longitude: lng };
            }
            return {
                id: e.id, employeeId: e.employeeId, employeeCode: e.employee?.employeeCode, jobTitle: e.employee?.jobTitle,
                eventType: e.eventType, timestamp: e.timestamp, verificationMethod: e.verificationMethod,
                location: loc, rawLocation: e.location, ipAddress: e.ipAddress,
            };
        }).filter(p => p.location && p.location.latitude != null && p.location.longitude != null);
        return { date: dateStr, branches: branches.map(b => ({ id: b.id, name: b.name, latitude: b.latitude, longitude: b.longitude, gpsRadius: b.gpsRadius, address: b.address })), points, total: points.length };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
