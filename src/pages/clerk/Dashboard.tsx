import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wallet, AlertCircle, HeartHandshake, UserPlus, FileText, CreditCard, ArrowRight, GraduationCap, Calendar, BookOpen } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalFeesCollected: number;
  pendingFees: number;
  totalDonations: number;
  recentPayments: any[];
}

export default function ClerkDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalFeesCollected: 0,
    pendingFees: 0,
    totalDonations: 0,
    recentPayments: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [studentsRes, feesRes, donationsRes] = await Promise.all([
        supabase.from('students').select('id, name, class', { count: 'exact' }),
        supabase.from('fee_payments').select('amount, student_id, date, students(name)').order('date', { ascending: false }).limit(5),
        supabase.from('donations').select('amount'),
      ]);

      const students = studentsRes.data ?? [];
      const payments = feesRes.data ?? [];
      const donations = donationsRes.data ?? [];

      const totalFees = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const totalDonations = donations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

      setStats({
        totalStudents: studentsRes.count ?? students.length,
        totalFeesCollected: totalFees,
        pendingFees: 0, // Would need a dedicated query
        totalDonations,
        recentPayments: payments.slice(0, 5),
      });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents.toString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      action: () => navigate('/clerk/enrollment'),
    },
    {
      title: 'Fees Collected',
      value: formatCurrency(stats.totalFeesCollected),
      icon: Wallet,
      color: 'text-green-600',
      bg: 'bg-green-50',
      action: () => navigate('/clerk/fees'),
    },
    {
      title: 'Pending Fees',
      value: formatCurrency(stats.pendingFees),
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      action: () => navigate('/clerk/fees'),
    },
    {
      title: 'Donations Received',
      value: formatCurrency(stats.totalDonations),
      icon: HeartHandshake,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      action: () => navigate('/clerk/donations'),
    },
  ];

  const quickActions = [
    { label: 'New Admission', icon: UserPlus, to: '/clerk/admissions' },
    { label: 'Manage Teachers', icon: GraduationCap, to: '/clerk/teachers' },
    { label: 'Teacher Assignments', icon: BookOpen, to: '/clerk/assignments' },
    { label: 'Leave Requests', icon: Calendar, to: '/clerk/leaves' },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h1 className="text-3xl font-bold font-display text-gray-900">Clerk Dashboard</h1>
        <p className="text-gray-500 mt-1">Here's a quick overview of school records today.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={card.action}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
              <div className={`${card.bg} p-2 rounded-lg`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="flex items-center justify-between gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <action.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-emerald-700 text-sm">{action.label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Payments */}
      {stats.recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Fee Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentPayments.map((pay: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{(pay.students as any)?.name ?? 'Student'}</p>
                    <p className="text-xs text-gray-400">{pay.date}</p>
                  </div>
                  <span className="font-semibold text-green-600">{formatCurrency(pay.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
