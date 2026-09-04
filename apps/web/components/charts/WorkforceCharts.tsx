'use client';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0ea5e9','#0284c7','#0369a1','#38bdf8','#7dd3fc','#0f172a'];

export function AttendanceTrend({ data = [
  { day: 'Mon', present: 1067, absent: 94, late: 63 },
  { day: 'Tue', present: 1082, absent: 88, late: 41 },
  { day: 'Wed', present: 1054, absent: 112, late: 58 },
  { day: 'Thu', present: 1091, absent: 76, late: 34 },
  { day: 'Fri', present: 1023, absent: 145, late: 71 },
] }: any) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
          <Area type="monotone" dataKey="present" stroke="#0ea5e9" fill="url(#g1)" strokeWidth={2} />
          <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HealthRadar({ data = [
  { subject: 'Attendance', A: 94 },
  { subject: 'Performance', A: 87 },
  { subject: 'Learning', A: 91 },
  { subject: 'Engagement', A: 78 },
  { subject: 'Compliance', A: 96 },
  { subject: 'Stability', A: 89 },
] }: any) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar name="Health" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.18} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BranchBar({ data = [
  { branch: 'Head Office', count: 542 },
  { branch: 'Branch A', count: 83 },
  { branch: 'Branch B', count: 74 },
  { branch: 'Remote', count: 328 },
  { branch: 'Field', count: 119 },
] }: any) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="branch" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({ data = [
  { name: 'Present', value: 1067 },
  { name: 'Remote', value: 328 },
  { name: 'Leave', value: 84 },
  { name: 'Absent', value: 94 },
], accent = '#0ea5e9' }: any) {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
            {data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
