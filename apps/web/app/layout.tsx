import './globals.css';
import SessionGuard from '../components/SessionGuard';
export const metadata = { title: 'OneHR — Payroll, Attendance & HR in One Place', description: 'RecruitConnect OneHR™ — stop payroll errors, eliminate attendance fraud and run HR in one place. Built for African businesses.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <SessionGuard />
        {children}
      </body>
    </html>
  );
}
