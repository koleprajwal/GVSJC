import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  User, 
  BookOpen, 
  IndianRupee, 
  FileText, 
  Download, 
  CreditCard, 
  Calendar, 
  Bell, 
  AlertCircle, 
  CalendarDays, 
  ChevronRight, 
  Printer, 
  CheckCircle2, 
  Hourglass, 
  XCircle,
  QrCode,
  GraduationCap
} from 'lucide-react';

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const safeUuid = (uuid: string) => isUuid(uuid) ? uuid : '00000000-0000-0000-0000-000000000000';

interface StudentInfo {
  id: string;
  student_id: string;
  name: string;
  class: string;
  roll_no: string;
  parent_name: string;
  parent_phone: string;
  email: string;
  dob: string;
  nationality: string;
  religion: string;
  caste: string;
  father_name: string;
  mother_name: string;
  place_of_birth: string;
  date_of_admission: string;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Database Data States
  const [notices, setNotices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [classFee, setClassFee] = useState<number>(0);
  const [examMarks, setExamMarks] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  // Leave Form State
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Load active tab from path
  const activeTab = pathname.endsWith('/marks') ? 'marks' :
                    pathname.endsWith('/fees') ? 'fees' :
                    pathname.endsWith('/homework') ? 'homework' :
                    pathname.endsWith('/resources') ? 'resources' :
                    pathname.endsWith('/idcard') ? 'idcard' :
                    pathname.endsWith('/leaves') ? 'leaves' : 'dashboard';

  const fetchData = useCallback(async (studentId: string, studentClass: string, studentUuid: string) => {
    try {
      const safeId = safeUuid(studentUuid);
      // 1. Fetch Notices
      const { data: noticesData } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5);
      setNotices(noticesData ?? []);

      // 2. Fetch Class Fee Structure
      const { data: feeData } = await supabase.from('fee_structure').select('total_fee').eq('class', studentClass).maybeSingle();
      setClassFee(feeData?.total_fee ? Number(feeData.total_fee) : 18000);

      // 3. Fetch Student Fee Payments
      const { data: paymentsData } = await supabase.from('fee_payments').select('*').eq('student_id', safeId).order('date', { ascending: false });
      setPayments(paymentsData ?? []);

      // 4. Fetch Exam Marks
      const { data: marksData } = await supabase.from('exam_marks').select('*, exams(title, academic_year)').eq('student_id', safeId);
      setExamMarks(marksData ?? []);

      // 5. Fetch Assignments
      const { data: assignmentsData } = await supabase.from('assignments').select('*, faculty(name)').eq('class', studentClass).order('due_date', { ascending: true });
      setAssignments(assignmentsData ?? []);

      // 6. Fetch Study Materials
      const { data: materialsData } = await supabase.from('study_materials').select('*, faculty(name)').eq('class', studentClass).order('created_at', { ascending: false });
      setMaterials(materialsData ?? []);

      // 7. Fetch Leaves
      const { data: leavesData } = await supabase.from('student_leaves').select('*').eq('student_id', safeId).order('created_at', { ascending: false });
      setLeaves(leavesData ?? []);

    } catch (err) {
      console.error('Failed to load student portal data', err);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('portalUser');
    if (!stored) {
      navigate('/portal');
      return;
    }
    const info = JSON.parse(stored);
    
    // If it's the development bypass with mock ID, we try to fetch a real student with id 'GVS-2024-001' to display real data
    if (info.student_id === 'GVS-2024-001' || info.id === 'mock-student-id' || info.id === '00000000-0000-0000-0000-000000000000') {
      supabase.from('students').select('*').eq('student_id', 'GVS-2024-001').maybeSingle().then(({ data }) => {
        if (data) {
          setStudent(data);
          fetchData(data.student_id, data.class || 'Class 5', data.id);
        } else {
          setStudent(info);
          fetchData(info.student_id, info.class || 'Class 5', info.id);
        }
        setLoading(false);
      });
    } else {
      setStudent(info);
      fetchData(info.student_id, info.class || 'Class 5', info.id);
      setLoading(false);
    }
  }, [navigate, fetchData]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    if (!leaveFrom || !leaveTo || !leaveReason.trim()) {
      toast.error('Please fill in all leave fields');
      return;
    }
    setLeaveSubmitting(true);

    const payload = {
      student_id: student.id,
      from_date: leaveFrom,
      to_date: leaveTo,
      reason: leaveReason,
      status: 'pending'
    };

    const { error } = await supabase.from('student_leaves').insert([payload]);
    setLeaveSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Leave application submitted!');
      setLeaveFrom('');
      setLeaveTo('');
      setLeaveReason('');
      // Refresh leaves list
      const { data: leavesData } = await supabase.from('student_leaves').select('*').eq('student_id', student.id).order('created_at', { ascending: false });
      setLeaves(leavesData ?? []);
    }
  };

  if (loading || !student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600" />
      </div>
    );
  }

  // Calculations for dashboard
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDue = Math.max(0, classFee - totalPaid);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Active view renderer */}

      {/* DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-10">
              <GraduationCap className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="bg-white/20 text-white font-medium text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                Student Portal
              </span>
              <h1 className="text-3xl font-bold font-display">Welcome back, {student.name}!</h1>
              <p className="text-white/80 text-sm max-w-xl">
                Access your virtual classroom. View academic reports, class resources, fee balances, and leave request statuses.
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Class & Roll</CardTitle>
                <div className="bg-rose-50 p-2 rounded-lg"><User className="w-4 h-4 text-rose-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-gray-800">{student.class}</div>
                <p className="text-xs text-gray-400 mt-1">Roll Number: {student.roll_no || '—'}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Fee Status</CardTitle>
                <div className="bg-emerald-50 p-2 rounded-lg"><IndianRupee className="w-4 h-4 text-emerald-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-gray-800">₹{totalDue.toLocaleString('en-IN')} Due</div>
                <p className="text-xs text-gray-400 mt-1">Paid so far: ₹{totalPaid.toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Class Assignments</CardTitle>
                <div className="bg-sky-50 p-2 rounded-lg"><FileText className="w-4 h-4 text-sky-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-gray-800">{assignments.length} Homework Tasks</div>
                <p className="text-xs text-gray-400 mt-1">Assigned for class {student.class}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notices Board */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-500 animate-swing" /> Recent Notices
              </h2>
              <div className="space-y-3">
                {notices.length === 0 ? (
                  <Card className="p-6 text-center text-gray-400">No notices posted recently.</Card>
                ) : (
                  notices.map((n) => (
                    <Card key={n.id} className="hover:border-rose-200 transition-colors">
                      <CardContent className="p-4 flex gap-4">
                        <div className="flex flex-col items-center justify-center bg-slate-50 border p-2.5 rounded-xl text-center shrink-0 min-w-[70px]">
                          <CalendarDays className="w-4 h-4 text-gray-400 mb-1" />
                          <span className="text-[10px] text-gray-500 uppercase font-bold">{n.date?.split(' ')?.[1] || 'Date'}</span>
                          <span className="text-lg font-bold text-gray-800 leading-none">{n.date?.split(' ')?.[0] || '—'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${n.tag_color || 'bg-slate-100'}`}>
                            {n.tag}
                          </span>
                          <h3 className="font-bold text-gray-900 text-sm mt-1">{n.title}</h3>
                          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{n.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Profile Sidebar */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Quick Profile</h2>
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col items-center text-center pb-4 border-b">
                    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-2xl font-bold mb-2">
                      {student.name.slice(0, 2).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-gray-900 leading-tight">{student.name}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{student.student_id}</p>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">Class</span><span className="font-semibold text-gray-700">{student.class}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Roll No</span><span className="font-semibold text-gray-700">{student.roll_no || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Date of Birth</span><span className="font-semibold text-gray-700">{student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Parent Name</span><span className="font-semibold text-gray-700">{student.parent_name || student.father_name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Contact</span><span className="font-semibold text-gray-700">{student.parent_phone || '—'}</span></div>
                  </div>
                  <Button variant="outline" className="w-full text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700" onClick={() => navigate('/student/idcard')}>
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" /> View Digital ID
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CARDS VIEW */}
      {activeTab === 'marks' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Academic Report Cards</h1>
            <p className="text-gray-500 mt-1">View your test scores and grading profiles for this academic year.</p>
          </div>

          {examMarks.length === 0 ? (
            <Card className="p-12 text-center text-gray-400">No exam records or marks found for your ID.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {examMarks.map((m) => {
                const subjects = m.marks ? Object.entries(m.marks) : [];
                return (
                  <Card key={m.id} className="overflow-hidden border border-slate-200">
                    <CardHeader className="bg-slate-50 border-b p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-base font-bold text-gray-900">{(m.exams as any)?.title || 'Term Examination'}</CardTitle>
                          <CardDescription className="text-xs">Academic Year: {(m.exams as any)?.academic_year || '2025-26'}</CardDescription>
                        </div>
                        <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase">Active</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100/50 border-b text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="text-left px-6 py-3 font-semibold">Subject</th>
                            <th className="text-center px-6 py-3 font-semibold">Marks Obtained</th>
                            <th className="text-center px-6 py-3 font-semibold">Max Marks</th>
                            <th className="text-center px-6 py-3 font-semibold">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {subjects.map(([subject, score]: any) => (
                            <tr key={subject} className="hover:bg-slate-50/50">
                              <td className="px-6 py-3 font-medium text-gray-800">{subject}</td>
                              <td className="px-6 py-3 text-center font-bold text-gray-900">{score}</td>
                              <td className="px-6 py-3 text-center text-gray-500">100</td>
                              <td className="px-6 py-3 text-center">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${Number(score) >= 35 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {Number(score) >= 35 ? 'Pass' : 'Fail'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {m.remarks && (
                        <div className="p-4 border-t bg-slate-50/50 text-xs text-gray-600 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          <div><span className="font-semibold text-gray-700">Remarks:</span> {m.remarks}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FEE STATUS VIEW */}
      {activeTab === 'fees' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Fee Status & Receipts</h1>
            <p className="text-gray-500 mt-1">Review fees and download payment receipts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-rose-50 border-rose-100">
              <CardContent className="p-5 text-center space-y-1">
                <p className="text-xs font-semibold text-rose-600 uppercase">Total Class Fee</p>
                <p className="text-2xl font-bold text-rose-800">₹{classFee.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-rose-500">Assigned for {student.class}</p>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50 border-emerald-100">
              <CardContent className="p-5 text-center space-y-1">
                <p className="text-xs font-semibold text-emerald-600 uppercase">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-800">₹{totalPaid.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-emerald-500">Recorded in system</p>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-100">
              <CardContent className="p-5 text-center space-y-1">
                <p className="text-xs font-semibold text-amber-600 uppercase">Pending Dues</p>
                <p className="text-2xl font-bold text-amber-800">₹{totalDue.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-amber-500">Balance outstanding</p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-lg font-bold text-gray-800 mt-6">Payment History</h2>
          <Card className="overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-500 font-semibold text-xs uppercase">Receipt No</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-semibold text-xs uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-semibold text-xs uppercase">Method</th>
                    <th className="text-right px-6 py-3 text-gray-500 font-semibold text-xs uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400">No payment records found.</td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 font-mono font-bold text-xs text-rose-600">{p.receipt_no}</td>
                        <td className="px-6 py-3 text-gray-600 text-xs">
                          {p.date ? new Date(p.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                        </td>
                        <td className="px-6 py-3 text-gray-600 text-xs uppercase">{p.mode || 'cash'}</td>
                        <td className="px-6 py-3 text-right font-bold text-gray-900">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* HOMEWORK VIEW */}
      {activeTab === 'homework' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Homework & Assignments</h1>
            <p className="text-gray-500 mt-1">Pending and active home assignments for {student.class}.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.length === 0 ? (
              <Card className="col-span-2 p-12 text-center text-gray-400">No homework posted for your class yet.</Card>
            ) : (
              assignments.map((a) => (
                <Card key={a.id} className="hover:border-rose-200 transition-colors">
                  <CardHeader className="p-4 border-b bg-slate-50/50 flex flex-row justify-between items-start">
                    <div>
                      <span className="bg-rose-50 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{a.subject}</span>
                      <CardTitle className="text-base font-bold text-gray-900 mt-1">{a.title}</CardTitle>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                      Due: {a.due_date ? new Date(a.due_date).toLocaleDateString('en-IN') : '—'}
                    </span>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-gray-600 text-xs leading-relaxed">{a.description || 'No instructions provided.'}</p>
                    <div className="text-[10px] text-gray-400 pt-2 border-t flex justify-between">
                      <span>Posted by: {(a.faculty as any)?.name || 'Teacher'}</span>
                      <span>Assigned to: {a.class}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* STUDY RESOURCES VIEW */}
      {activeTab === 'resources' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Study Materials & Notes</h1>
            <p className="text-gray-500 mt-1">Syllabus documents, reference PDFs, and digital study files.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.length === 0 ? (
              <Card className="col-span-2 p-12 text-center text-gray-400">No study materials shared for your class yet.</Card>
            ) : (
              materials.map((m) => (
                <Card key={m.id} className="hover:border-rose-200 transition-colors">
                  <CardContent className="p-4 flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                      <span className="bg-rose-100 text-rose-800 text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase">{m.subject}</span>
                      <h3 className="font-bold text-gray-900 text-sm">{m.title}</h3>
                      {m.description && <p className="text-gray-500 text-xs">{m.description}</p>}
                      <p className="text-[10px] text-gray-400">Uploaded by: {(m.faculty as any)?.name || 'Teacher'}</p>
                    </div>
                    <Button 
                      onClick={() => window.open(m.file_url, '_blank')} 
                      size="sm" 
                      className="bg-rose-600 hover:bg-rose-700 shrink-0 gap-1.5 text-xs text-white"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* DIGITAL ID CARD VIEW */}
      {activeTab === 'idcard' && (
        <div className="space-y-6 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-display text-gray-900">Digital Student ID Card</h1>
              <p className="text-gray-500 mt-1">Your official digital identification card. Printable for school entry.</p>
            </div>
            <Button onClick={() => window.print()} variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs">
              <Printer className="w-4 h-4 mr-2" /> Print ID
            </Button>
          </div>

          <div className="flex justify-center py-6">
            {/* Elegant physical card mockup */}
            <div className="w-[340px] h-[520px] bg-gradient-to-b from-rose-600 via-rose-600 to-indigo-900 rounded-3xl p-5 text-white flex flex-col justify-between items-center shadow-2xl relative border-4 border-white print:border-0 print:shadow-none">
              
              {/* Header */}
              <div className="text-center w-full space-y-1">
                <h3 className="font-bold text-[15px] leading-tight uppercase font-display tracking-wider">Gurukul Vidyalay</h3>
                <p className="text-[9px] text-white/70 font-medium">And Junior College, Hatkanangale</p>
                <div className="h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full mt-2" />
              </div>

              {/* Avatar Photo Frame */}
              <div className="my-4 flex flex-col items-center">
                <div className="w-28 h-28 rounded-2xl border-4 border-white bg-white/10 flex items-center justify-center text-4xl font-bold shadow-inner text-white overflow-hidden shrink-0">
                  {student.name.slice(0, 2).toUpperCase()}
                </div>
                <h4 className="font-bold text-base mt-3 leading-tight tracking-wide">{student.name}</h4>
                <span className="text-[10px] bg-white/20 text-white/90 px-3 py-0.5 rounded-full font-semibold mt-1.5 uppercase font-mono">
                  {student.student_id}
                </span>
              </div>

              {/* Core Information Details */}
              <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 text-xs space-y-2 border border-white/10 text-left">
                <div className="grid grid-cols-3"><span className="text-white/60">Class</span><span className="col-span-2 font-bold">{student.class}</span></div>
                <div className="grid grid-cols-3"><span className="text-white/60">Roll No</span><span className="col-span-2 font-bold">{student.roll_no || '—'}</span></div>
                <div className="grid grid-cols-3"><span className="text-white/60">DOB</span><span className="col-span-2 font-bold">{student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : '—'}</span></div>
                <div className="grid grid-cols-3"><span className="text-white/60">Parent</span><span className="col-span-2 font-bold">{student.parent_name || student.father_name || '—'}</span></div>
                <div className="grid grid-cols-3"><span className="text-white/60">Phone</span><span className="col-span-2 font-bold">{student.parent_phone || '—'}</span></div>
              </div>

              {/* Footer bar */}
              <div className="w-full flex items-center justify-between border-t border-white/20 pt-4 mt-2">
                <div className="text-left">
                  <p className="text-[9px] text-white/50 uppercase tracking-widest font-mono">Status</p>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase font-display">Active Student</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded p-1 flex items-center justify-center shrink-0">
                  <QrCode className="w-full h-full text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE APPLICATIONS VIEW */}
      {activeTab === 'leaves' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Apply for Leave</h1>
            <p className="text-gray-500 mt-1">Submit a medical or general leave request to class teachers.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <Card className="lg:col-span-1 border border-slate-200">
              <CardHeader><CardTitle className="text-lg font-bold">New Request</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleApplyLeave} className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">From Date</Label>
                    <Input type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">To Date</Label>
                    <Input type="date" value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} required className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Reason for Leave</Label>
                    <Textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Provide valid reason..." required className="mt-1 text-xs resize-none h-24" />
                  </div>
                  <Button type="submit" disabled={leaveSubmitting} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold">
                    {leaveSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Application History</h2>
              <div className="space-y-3">
                {leaves.length === 0 ? (
                  <Card className="p-12 text-center text-gray-400">No leave requests submitted yet.</Card>
                ) : (
                  leaves.map((l) => (
                    <Card key={l.id} className="hover:border-rose-200 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-800">
                            Duration: {new Date(l.from_date).toLocaleDateString('en-IN')} to {new Date(l.to_date).toLocaleDateString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-500">Reason: {l.reason}</p>
                          <p className="text-[10px] text-gray-400">Submitted: {new Date(l.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {l.status === 'approved' && <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-xs font-semibold text-emerald-600">Approved</span></>}
                          {l.status === 'rejected' && <><XCircle className="w-4 h-4 text-red-500" /><span className="text-xs font-semibold text-red-600">Rejected</span></>}
                          {l.status === 'pending' && <><Hourglass className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-600 font-mono">Pending</span></>}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
