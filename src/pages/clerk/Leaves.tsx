import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, X, Calendar, User, FileText, CheckCircle2, XCircle, Hourglass, RefreshCw } from 'lucide-react';

interface StudentLeave {
  id: string;
  student_id: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  students: {
    name: string;
    class: string;
    student_id: string;
  } | null;
}

interface TeacherLeave {
  id: string;
  teacher_id: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  faculty: {
    name: string;
    teacher_id: string;
    role: string | null;
  } | null;
}

export default function ClerkLeaves() {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [studentLeaves, setStudentLeaves] = useState<StudentLeave[]>([]);
  const [teacherLeaves, setTeacherLeaves] = useState<TeacherLeave[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const [studentRes, teacherRes] = await Promise.all([
        supabase
          .from('student_leaves')
          .select('*, students(name, class, student_id)')
          .order('created_at', { ascending: false }),
        supabase
          .from('teacher_leaves')
          .select('*, faculty(name, teacher_id, role)')
          .order('created_at', { ascending: false })
      ]);

      if (studentRes.error) throw studentRes.error;
      if (teacherRes.error) throw teacherRes.error;

      setStudentLeaves(studentRes.data as any[] ?? []);
      setTeacherLeaves(teacherRes.data as any[] ?? []);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to fetch leave requests: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleUpdateStatus = async (type: 'student' | 'teacher', id: string, newStatus: 'approved' | 'rejected') => {
    const table = type === 'student' ? 'student_leaves' : 'teacher_leaves';
    try {
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Leave request ${newStatus} successfully!`);
      fetchLeaves();
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  const pendingStudentCount = studentLeaves.filter((l) => l.status === 'pending').length;
  const pendingTeacherCount = teacherLeaves.filter((l) => l.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900">Leave Applications</h1>
          <p className="text-gray-500 mt-1">Review and process leave requests from students and teachers.</p>
        </div>
        <Button onClick={fetchLeaves} variant="outline" className="w-fit border-gray-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'students'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Student Leaves
          {pendingStudentCount > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingStudentCount} pending
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'teachers'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Teacher Leaves
          {pendingTeacherCount > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingTeacherCount} pending
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'students' ? (
            studentLeaves.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                No student leave requests found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {studentLeaves.map((l) => (
                  <Card key={l.id} className="hover:shadow-sm transition-shadow border-slate-200">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900">
                            {l.students?.name || 'Unknown Student'}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {l.students?.student_id || '—'}
                          </span>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                            {l.students?.class || 'Class—'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold">Duration:</span>{' '}
                          {new Date(l.from_date).toLocaleDateString('en-IN')} to {new Date(l.to_date).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-600 flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span>
                            <span className="font-semibold">Reason:</span> {l.reason}
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Submitted on {new Date(l.created_at).toLocaleDateString('en-IN')} at {new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {l.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateStatus('student', l.id, 'approved')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1 h-8 px-3"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus('student', l.id, 'rejected')}
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs py-1 h-8 px-3"
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {l.status === 'approved' && (
                              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-semibold">Approved</span>
                              </div>
                            )}
                            {l.status === 'rejected' && (
                              <div className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200">
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-semibold">Rejected</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            teacherLeaves.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                No teacher leave requests found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {teacherLeaves.map((l) => (
                  <Card key={l.id} className="hover:shadow-sm transition-shadow border-slate-200">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900">
                            {l.faculty?.name || 'Unknown Teacher'}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {l.faculty?.teacher_id || '—'}
                          </span>
                          <span className="bg-sky-50 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                            {l.faculty?.role || 'Teacher'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold">Duration:</span>{' '}
                          {new Date(l.from_date).toLocaleDateString('en-IN')} to {new Date(l.to_date).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-600 flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span>
                            <span className="font-semibold">Reason:</span> {l.reason}
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Submitted on {new Date(l.created_at).toLocaleDateString('en-IN')} at {new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {l.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateStatus('teacher', l.id, 'approved')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1 h-8 px-3"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus('teacher', l.id, 'rejected')}
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs py-1 h-8 px-3"
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {l.status === 'approved' && (
                              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-semibold">Approved</span>
                              </div>
                            )}
                            {l.status === 'rejected' && (
                              <div className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200">
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-semibold">Rejected</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
