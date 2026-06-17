import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Users,
  CheckSquare,
  FileSpreadsheet,
  FileText,
  Upload,
  Calendar,
  BookOpen,
  Search,
  Plus,
  CalendarDays,
  UserCheck,
  ChevronRight,
  GraduationCap,
  Save,
  Hourglass,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const CLASSES = ['LKG', 'UKG', ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];
const SUBJECTS = ['English', 'Marathi', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Physics', 'Chemistry', 'Biology'];
const cls = 'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white';

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const safeUuid = (uuid: string) => isUuid(uuid) ? uuid : '00000000-0000-0000-0000-000000000000';

interface TeacherInfo {
  id: string;
  teacher_id: string;
  name: string;
  role: string;
  qual: string;
  exp: string;
  email: string;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Database Data States
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [myMaterials, setMyMaterials] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  // Teacher Assignments & Class Teacher States
  const [assignedSubjectsMap, setAssignedSubjectsMap] = useState<Record<string, string[]>>({});
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [myClassTeacherClasses, setMyClassTeacherClasses] = useState<string[]>([]);
  const [studentLeaves, setStudentLeaves] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [selectedCTClass, setSelectedCTClass] = useState('');
  const [attendanceTakenBy, setAttendanceTakenBy] = useState<string | null>(null);

  // Selection Filters for features
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Attendance Form States
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Marks Form States
  const [marksRecords, setMarksRecords] = useState<Record<string, number>>({});
  const [savingMarks, setSavingMarks] = useState(false);

  // Assignment Form State
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkDesc, setHomeworkDesc] = useState('');
  const [homeworkDue, setHomeworkDue] = useState('');
  const [homeworkClass, setHomeworkClass] = useState('');
  const [homeworkSub, setHomeworkSub] = useState('');
  const [postingHomework, setPostingHomework] = useState(false);

  // Material Form State
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDesc, setMaterialDesc] = useState('');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialClass, setMaterialClass] = useState('');
  const [materialSub, setMaterialSub] = useState('');
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  // Leave Form State
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Load active tab from path
  const activeTab = pathname.endsWith('/students') ? 'students' :
    pathname.endsWith('/attendance') ? 'attendance' :
      pathname.endsWith('/marks') ? 'marks' :
        pathname.endsWith('/homework') ? 'homework' :
          pathname.endsWith('/resources') ? 'resources' :
            pathname.endsWith('/student-leaves') ? 'student-leaves' :
              pathname.endsWith('/leaves') ? 'leaves' : 'dashboard';

  const fetchTeacherData = useCallback(async (teacherUuid: string) => {
    try {
      const safeId = safeUuid(teacherUuid);
      const [studentsRes, examsRes, homeworkRes, materialsRes, leavesRes, subAssignsRes, ctAssignsRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('exams').select('*').order('created_at', { ascending: false }),
        supabase.from('assignments').select('*').eq('teacher_id', safeId).order('created_at', { ascending: false }),
        supabase.from('study_materials').select('*').eq('teacher_id', safeId).order('created_at', { ascending: false }),
        supabase.from('teacher_leaves').select('*').eq('teacher_id', safeId).order('created_at', { ascending: false }),
        supabase.from('teacher_subjects').select('*').eq('teacher_id', safeId),
        supabase.from('class_teachers').select('*').eq('teacher_id', safeId)
      ]);

      setStudents(studentsRes.data ?? []);
      setExams(examsRes.data ?? []);
      if (examsRes.data && examsRes.data.length > 0) {
        setSelectedExam(examsRes.data[0].id);
      }
      setMyAssignments(homeworkRes.data ?? []);
      setMyMaterials(materialsRes.data ?? []);
      setLeaves(leavesRes.data ?? []);

      // Build subject mappings
      const subMap: Record<string, string[]> = {};
      const classesSet = new Set<string>();
      subAssignsRes.data?.forEach((a) => {
        classesSet.add(a.class);
        if (!subMap[a.class]) {
          subMap[a.class] = [];
        }
        subMap[a.class].push(a.subject);
      });

      const classesArr = Array.from(classesSet);
      setAssignedClasses(classesArr);
      setAssignedSubjectsMap(subMap);

      if (classesArr.length > 0) {
        setSelectedClass(classesArr[0]);
        setHomeworkClass(classesArr[0]);
        setMaterialClass(classesArr[0]);
        if (subMap[classesArr[0]] && subMap[classesArr[0]].length > 0) {
          setSelectedSubject(subMap[classesArr[0]][0]);
          setHomeworkSub(subMap[classesArr[0]][0]);
          setMaterialSub(subMap[classesArr[0]][0]);
        }
      }

      const ctClasses = ctAssignsRes.data?.map((c) => c.class) ?? [];
      setMyClassTeacherClasses(ctClasses);

      if (ctClasses.length > 0) {
        const { data: studLeaves } = await supabase
          .from('student_leaves')
          .select('*, students!inner(name, class, student_id)')
          .in('students.class', ctClasses)
          .order('created_at', { ascending: false });
        setStudentLeaves(studLeaves ?? []);
      } else {
        setStudentLeaves([]);
      }

    } catch (err) {
      console.error('Failed to load teacher portal data', err);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('portalUser');
    if (!stored) {
      navigate('/portal');
      return;
    }
    const info = JSON.parse(stored);

    // Fallback for mock teacher ID TCH-0001
    if (info.teacher_id === 'TCH-0001' || info.id === 'mock-teacher-id' || info.id === '00000000-0000-0000-0000-000000000000') {
      supabase.from('faculty').select('*').limit(1).maybeSingle().then(({ data }) => {
        if (data) {
          setTeacher(data);
          fetchTeacherData(data.id);
        } else {
          setTeacher(info);
          fetchTeacherData(info.id);
        }
        setLoading(false);
      });
    } else {
      setTeacher(info);
      fetchTeacherData(info.id);
      setLoading(false);
    }
  }, [navigate, fetchTeacherData]);

  const fetchTodayAttendance = useCallback(async (ctClass: string) => {
    if (!ctClass) return;
    const classStudents = students.filter((s) => s.class === ctClass);
    const studentIds = classStudents.map((s) => s.id).filter(isUuid);
    if (studentIds.length === 0) {
      setTodayAttendance([]);
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('attendance')
      .select('*, students(name, roll_no)')
      .in('student_id', studentIds)
      .eq('date', todayStr);

    setTodayAttendance(data ?? []);
  }, [students]);

  useEffect(() => {
    if (myClassTeacherClasses.length > 0) {
      const initialClass = selectedCTClass || myClassTeacherClasses[0];
      setSelectedCTClass(initialClass);
      fetchTodayAttendance(initialClass);
    }
  }, [myClassTeacherClasses, selectedCTClass, fetchTodayAttendance]);

  // Load Attendance Records for selection
  const fetchAttendance = useCallback(async () => {
    if (!selectedClass || !attendanceDate) return;
    const classStudents = students.filter((s) => s.class === selectedClass);
    const studentIds = classStudents.map((s) => s.id).filter(isUuid);
    if (studentIds.length === 0) {
      setAttendanceRecords({});
      return;
    }

    const { data, error } = await supabase
      .from('attendance')
      .select('*, faculty:taken_by(name)')
      .in('student_id', studentIds)
      .eq('date', attendanceDate);

    if (error) {
      console.error(error);
      return;
    }

    const takenByRecord = data?.find((r) => r.faculty?.name);
    if (takenByRecord) {
      setAttendanceTakenBy(takenByRecord.faculty.name);
    } else {
      setAttendanceTakenBy(null);
    }

    const initialMap: Record<string, 'Present' | 'Absent' | 'Late'> = {};
    // Pre-populate with Present
    classStudents.forEach((s) => {
      initialMap[s.id] = 'Present';
    });
    // Overlay loaded records
    data?.forEach((r) => {
      initialMap[r.student_id] = r.status as any;
    });

    setAttendanceRecords(initialMap);
  }, [selectedClass, attendanceDate, students]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab, fetchAttendance]);

  // Load Marks for selection
  const fetchMarks = useCallback(async () => {
    if (!selectedExam) return;
    const classStudents = students.filter((s) => s.class === selectedClass);
    const studentIds = classStudents.map((s) => s.id).filter(isUuid);
    if (studentIds.length === 0) {
      setMarksRecords({});
      return;
    }

    const { data, error } = await supabase
      .from('exam_marks')
      .select('*')
      .eq('exam_id', selectedExam)
      .in('student_id', studentIds);

    if (error) {
      console.error(error);
      return;
    }

    const initialMap: Record<string, number> = {};
    classStudents.forEach((s) => {
      initialMap[s.id] = 0;
    });
    data?.forEach((m) => {
      initialMap[m.student_id] = m.marks?.[selectedSubject] || 0;
    });

    setMarksRecords(initialMap);
  }, [selectedExam, selectedClass, selectedSubject, students]);

  useEffect(() => {
    if (activeTab === 'marks') {
      fetchMarks();
    }
  }, [activeTab, fetchMarks]);

  const handleSaveAttendance = async () => {
    if (!teacher) return;
    setSavingAttendance(true);
    const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      student_id: studentId,
      class: selectedClass,
      date: attendanceDate,
      status,
      taken_by: teacher.id,
    }));

    // Perform upsert (since there is a unique constraint on student_id + date)
    const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' });
    setSavingAttendance(false);

    if (error) {
      toast.error('Failed to save attendance: ' + error.message);
    } else {
      toast.success('Attendance records saved successfully!');
      fetchAttendance();
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedExam || !teacher) return;
    setSavingMarks(true);

    const classStudents = students.filter((s) => s.class === selectedClass);

    // We must fetch existing exam_marks rows to append/update the JSON object for the selected subject
    const studentIds = classStudents.map((s) => s.id);
    const { data: existingRows } = await supabase
      .from('exam_marks')
      .select('*')
      .eq('exam_id', selectedExam)
      .in('student_id', studentIds);

    const upserts = classStudents.map((s) => {
      const match = existingRows?.find((r) => r.student_id === s.id);
      const currentMarks = match?.marks || {};
      currentMarks[selectedSubject] = Number(marksRecords[s.id] || 0);

      return {
        id: match?.id || undefined, // use existing row ID if updating
        exam_id: selectedExam,
        student_id: s.id,
        marks: currentMarks,
      };
    });

    const { error } = await supabase.from('exam_marks').upsert(upserts, { onConflict: 'exam_id,student_id' });
    setSavingMarks(false);

    if (error) {
      toast.error('Failed to save marks: ' + error.message);
    } else {
      toast.success('Subject marks updated successfully!');
    }
  };

  const handlePostHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    if (!homeworkTitle.trim() || !homeworkDue || !homeworkClass || !homeworkSub) {
      toast.error('Please fill in required fields');
      return;
    }
    setPostingHomework(true);

    const payload = {
      title: homeworkTitle,
      description: homeworkDesc,
      due_date: homeworkDue,
      class: homeworkClass,
      subject: homeworkSub,
      teacher_id: teacher.id,
    };

    const { error } = await supabase.from('assignments').insert([payload]);
    setPostingHomework(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Homework assignment posted!');
      setHomeworkTitle('');
      setHomeworkDesc('');
      setHomeworkDue('');
      // Refresh list
      const { data } = await supabase.from('assignments').select('*').eq('teacher_id', teacher.id).order('created_at', { ascending: false });
      setMyAssignments(data ?? []);
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    if (!materialTitle.trim() || !materialUrl.trim() || !materialClass || !materialSub) {
      toast.error('Please fill in required fields');
      return;
    }
    setUploadingMaterial(true);

    const payload = {
      title: materialTitle,
      description: materialDesc,
      file_url: materialUrl,
      class: materialClass,
      subject: materialSub,
      teacher_id: teacher.id,
    };

    const { error } = await supabase.from('study_materials').insert([payload]);
    setUploadingMaterial(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Study materials added!');
      setMaterialTitle('');
      setMaterialDesc('');
      setMaterialUrl('');
      // Refresh list
      const { data } = await supabase.from('study_materials').select('*').eq('teacher_id', teacher.id).order('created_at', { ascending: false });
      setMyMaterials(data ?? []);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    if (!leaveFrom || !leaveTo || !leaveReason.trim()) {
      toast.error('Please fill in all leave fields');
      return;
    }
    setLeaveSubmitting(true);

    const payload = {
      teacher_id: teacher.id,
      from_date: leaveFrom,
      to_date: leaveTo,
      reason: leaveReason,
      status: 'pending'
    };

    const { error } = await supabase.from('teacher_leaves').insert([payload]);
    setLeaveSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Leave application submitted!');
      setLeaveFrom('');
      setLeaveTo('');
      setLeaveReason('');
      // Refresh leaves list
      const { data } = await supabase.from('teacher_leaves').select('*').eq('teacher_id', teacher.id).order('created_at', { ascending: false });
      setLeaves(data ?? []);
    }
  };

  const handleUpdateStudentLeave = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('student_leaves')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Leave request ${status}!`);

      // Refresh student leaves list
      if (myClassTeacherClasses.length > 0) {
        const { data: studLeaves } = await supabase
          .from('student_leaves')
          .select('*, students!inner(name, class, student_id)')
          .in('students.class', myClassTeacherClasses)
          .order('created_at', { ascending: false });
        setStudentLeaves(studLeaves ?? []);
      }
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    }
  };

  if (loading || !teacher) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  // Active Class filter for student directory
  const classStudentsList = students.filter((s) => {
    const matchClass = s.class === selectedClass;
    const matchSearch = !studentSearch || (s.name || '').toLowerCase().includes(studentSearch.toLowerCase());
    return matchClass && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">

      {/* DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-10">
              <Users className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-2">
              <span className="bg-white/20 text-white font-medium text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                Teacher Portal
              </span>
              <h1 className="text-3xl font-bold font-display">Welcome, {teacher.name}!</h1>
              <p className="text-white/80 text-sm max-w-xl">
                Access your teacher portal dashboard. Enter exam grades, mark daily attendance, post homework, and apply for leaves.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/teacher/students')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase">My Students</CardTitle>
                <div className="bg-sky-50 p-2 rounded-lg"><Users className="w-4 h-4 text-sky-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">{students.length} Total</div>
                <p className="text-xs text-gray-400 mt-1">Click to view details</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/teacher/homework')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Posted Homework</CardTitle>
                <div className="bg-amber-50 p-2 rounded-lg"><FileText className="w-4 h-4 text-amber-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">{myAssignments.length} Assignments</div>
                <p className="text-xs text-gray-400 mt-1">Manage active homework</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/teacher/resources')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Uploaded Materials</CardTitle>
                <div className="bg-emerald-50 p-2 rounded-lg"><Upload className="w-4 h-4 text-emerald-500" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">{myMaterials.length} Documents</div>
                <p className="text-xs text-gray-400 mt-1">Reference materials shared</p>
              </CardContent>
            </Card>
          </div>

          {/* Class Teacher Dashboard section */}
          {myClassTeacherClasses.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" /> Class Teacher Dashboard Overview
                  </CardTitle>
                  <CardDescription className="text-emerald-600">
                    Daily attendance register overview for today (Date: {new Date().toLocaleDateString('en-IN')})
                  </CardDescription>
                </div>
                {myClassTeacherClasses.length > 1 && (
                  <select
                    value={selectedCTClass}
                    onChange={(e) => setSelectedCTClass(e.target.value)}
                    className="rounded-md border border-emerald-300 px-3 py-1 bg-white text-xs text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {myClassTeacherClasses.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-xl border border-emerald-100 p-4 space-y-4">
                  <div className="flex flex-wrap gap-4 text-xs font-semibold">
                    <span className="text-gray-500">
                      Class: <span className="text-gray-900 font-bold">{selectedCTClass}</span>
                    </span>
                    <span className="text-emerald-600">
                      Present: <span className="font-bold">{todayAttendance.filter(a => a.status === 'Present').length}</span>
                    </span>
                    <span className="text-red-500">
                      Absent: <span className="font-bold">{todayAttendance.filter(a => a.status === 'Absent').length}</span>
                    </span>
                    <span className="text-amber-500">
                      Late: <span className="font-bold">{todayAttendance.filter(a => a.status === 'Late').length}</span>
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <h5 className="text-xs font-bold text-gray-700 mb-2">Present Students List:</h5>
                    {todayAttendance.filter(a => a.status === 'Present').length === 0 ? (
                      <p className="text-xs text-gray-400">No students marked present yet for today.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {todayAttendance
                          .filter(a => a.status === 'Present')
                          .map((a) => (
                            <span
                              key={a.id}
                              className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            >
                              {a.students?.roll_no ? `#${a.students.roll_no} ` : ''}
                              {a.students?.name}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Portal info */}
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-base font-bold">Teacher Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center text-center pb-4 border-b">
                  <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-2xl font-bold mb-2">
                    {teacher.name.slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="font-bold text-gray-900 leading-tight">{teacher.name}</h4>
                  <span className="text-xs text-gray-400 font-mono mt-0.5">{teacher.teacher_id || 'TCH-PORTAL'}</span>
                </div>
                <div className="space-y-2.5 text-xs text-gray-600">
                  <div className="flex justify-between"><span>Designation</span><span className="font-bold">{teacher.role || 'Faculty'}</span></div>
                  <div className="flex justify-between"><span>Qualifications</span><span className="font-bold">{teacher.qual || '—'}</span></div>
                  <div className="flex justify-between"><span>Experience</span><span className="font-bold">{teacher.exp || '—'}</span></div>
                  <div className="flex justify-between"><span>Email</span><span className="font-bold">{teacher.email || '—'}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Shortcuts */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base font-bold">Quick Tasks</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div onClick={() => navigate('/teacher/attendance')} className="p-4 border rounded-xl hover:bg-sky-50 hover:border-sky-300 transition-all cursor-pointer group flex items-start gap-3">
                  <div className="bg-sky-100 p-2 rounded-lg text-sky-600 shrink-0"><CheckSquare className="w-5 h-5" /></div>
                  <div>
                    <h5 className="font-bold text-sm text-gray-800 group-hover:text-sky-800">Roll Call Attendance</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Submit attendance register for any class.</p>
                  </div>
                </div>

                <div onClick={() => navigate('/teacher/marks')} className="p-4 border rounded-xl hover:bg-sky-50 hover:border-sky-300 transition-all cursor-pointer group flex items-start gap-3">
                  <div className="bg-sky-100 p-2 rounded-lg text-sky-600 shrink-0"><FileSpreadsheet className="w-5 h-5" /></div>
                  <div>
                    <h5 className="font-bold text-sm text-gray-800 group-hover:text-sky-800">Submit Exam Marks</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Input subject scores for test reports.</p>
                  </div>
                </div>

                <div onClick={() => navigate('/teacher/homework')} className="p-4 border rounded-xl hover:bg-sky-50 hover:border-sky-300 transition-all cursor-pointer group flex items-start gap-3">
                  <div className="bg-sky-100 p-2 rounded-lg text-sky-600 shrink-0"><FileText className="w-5 h-5" /></div>
                  <div>
                    <h5 className="font-bold text-sm text-gray-800 group-hover:text-sky-800">Assign Homework</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Post study tasks for class students.</p>
                  </div>
                </div>

                <div onClick={() => navigate('/teacher/resources')} className="p-4 border rounded-xl hover:bg-sky-50 hover:border-sky-300 transition-all cursor-pointer group flex items-start gap-3">
                  <div className="bg-sky-100 p-2 rounded-lg text-sky-600 shrink-0"><Upload className="w-5 h-5" /></div>
                  <div>
                    <h5 className="font-bold text-sm text-gray-800 group-hover:text-sky-800">Upload Notes</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Upload PDFs and references for downloads.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* STUDENT DIRECTORY VIEW */}
      {activeTab === 'students' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Student Directory</h1>
            <p className="text-gray-500 mt-1">Browse students by class and look up parent contact records.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex-1 max-w-xs">
              <Label className="text-xs font-semibold text-gray-600">Select Class</Label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={cls}>
                {assignedClasses.length === 0 ? (
                  <option value="">No Classes Assigned</option>
                ) : (
                  assignedClasses.map((c) => <option key={c} value={c}>{c}</option>)
                )}
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-xs font-semibold text-gray-600">Search Students</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search by name..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Roll No', 'Name', 'ID', 'Class', 'Parent Name', 'Parent Phone', 'Email'].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold text-gray-600 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classStudentsList.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No students found for {selectedClass}.</td></tr>
                  ) : (
                    classStudentsList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-gray-700">{s.roll_no || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{s.student_id}</td>
                        <td className="px-4 py-3">{s.class}</td>
                        <td className="px-4 py-3 text-gray-600">{s.parent_name || s.father_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{s.parent_phone || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{s.email || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MARK ATTENDANCE VIEW */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Mark Attendance Register</h1>
            <p className="text-gray-500 mt-1">Submit daily roll call register for student attendance records.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-end">
            <div className="w-full sm:w-48">
              <Label className="text-xs font-semibold text-gray-600">Select Class</Label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={cls}>
                {assignedClasses.length === 0 ? (
                  <option value="">No Classes Assigned</option>
                ) : (
                  assignedClasses.map((c) => <option key={c} value={c}>{c}</option>)
                )}
              </select>
            </div>
            <div className="w-full sm:w-48">
              <Label className="text-xs font-semibold text-gray-600">Date</Label>
              <Input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="mt-1" />
            </div>
          </div>

          {attendanceTakenBy && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Today's attendance has already been marked by: <span className="font-bold underline">{attendanceTakenBy}</span>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Roll No', 'Name', 'Student ID', 'Attendance Status'].map((h) => (
                      <th key={h} className="px-6 py-3 font-semibold text-gray-600 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.filter((s) => s.class === selectedClass).length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No students enrolled in {selectedClass}.</td></tr>
                  ) : (
                    students.filter((s) => s.class === selectedClass).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-gray-700">{s.roll_no || '—'}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-400">{s.student_id}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {['Present', 'Absent', 'Late'].map((st: any) => {
                              const active = attendanceRecords[s.id] === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setAttendanceRecords((p) => ({ ...p, [s.id]: st }))}
                                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${active
                                    ? st === 'Present' ? 'bg-emerald-500 text-white shadow-sm'
                                      : st === 'Absent' ? 'bg-red-500 text-white shadow-sm'
                                        : 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <Button onClick={handleSaveAttendance} disabled={savingAttendance || students.filter((s) => s.class === selectedClass).length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {savingAttendance ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Attendance</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EXAMS & MARKS VIEW */}
      {activeTab === 'marks' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Exams & Student Marks</h1>
            <p className="text-gray-500 mt-1">Submit test scores and marks for student results reports.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <Label className="text-xs font-semibold text-gray-600">Select Exam</Label>
              <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className={cls}>
                <option value="">Select Exam</option>
                {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.title} ({ex.academic_year})</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Select Class</Label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClass(val);
                  const subs = assignedSubjectsMap[val] || [];
                  if (subs.length > 0) {
                    setSelectedSubject(subs[0]);
                  } else {
                    setSelectedSubject('');
                  }
                }}
                className={cls}
              >
                {assignedClasses.length === 0 ? (
                  <option value="">No Classes Assigned</option>
                ) : (
                  assignedClasses.map((c) => <option key={c} value={c}>{c}</option>)
                )}
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Select Subject</Label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className={cls}>
                {(!selectedClass || !assignedSubjectsMap[selectedClass] || assignedSubjectsMap[selectedClass].length === 0) ? (
                  <option value="">No Subjects Assigned</option>
                ) : (
                  assignedSubjectsMap[selectedClass].map((sub) => <option key={sub} value={sub}>{sub}</option>)
                )}
              </select>
            </div>

          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Roll No', 'Name', 'Student ID', 'Enter Marks (out of 100)'].map((h) => (
                      <th key={h} className="px-6 py-3 font-semibold text-gray-600 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!selectedExam ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Please select an Exam.</td></tr>
                  ) : students.filter((s) => s.class === selectedClass).length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No students enrolled in {selectedClass}.</td></tr>
                  ) : (
                    students.filter((s) => s.class === selectedClass).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold text-gray-700">{s.roll_no || '—'}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{s.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-400">{s.student_id}</td>
                        <td className="px-6 py-4 max-w-[150px]">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={marksRecords[s.id] ?? 0}
                            onChange={(e) => setMarksRecords((p) => ({ ...p, [s.id]: Number(e.target.value) }))}
                            className="w-24 text-center font-bold"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <Button onClick={handleSaveMarks} disabled={savingMarks || !selectedExam || students.filter((s) => s.class === selectedClass).length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {savingMarks ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Marks</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD HOMEWORK VIEW */}
      {activeTab === 'homework' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Post Homework & Assignments</h1>
            <p className="text-gray-500 mt-1">Assign homework and tasks to classes.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border border-slate-200">
              <CardHeader><CardTitle className="text-base font-bold">New Homework</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handlePostHomework} className="space-y-4 text-xs">
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Class *</Label>
                    <select
                      value={homeworkClass}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHomeworkClass(val);
                        const subs = assignedSubjectsMap[val] || [];
                        if (subs.length > 0) {
                          setHomeworkSub(subs[0]);
                        } else {
                          setHomeworkSub('');
                        }
                      }}
                      className={cls + " mt-1"}
                    >
                      {assignedClasses.length === 0 ? (
                        <option value="">No Classes Assigned</option>
                      ) : (
                        assignedClasses.map((c) => <option key={c} value={c}>{c}</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Subject *</Label>
                    <select value={homeworkSub} onChange={(e) => setHomeworkSub(e.target.value)} className={cls + " mt-1"}>
                      {(!homeworkClass || !assignedSubjectsMap[homeworkClass] || assignedSubjectsMap[homeworkClass].length === 0) ? (
                        <option value="">No Subjects Assigned</option>
                      ) : (
                        assignedSubjectsMap[homeworkClass].map((sub) => <option key={sub} value={sub}>{sub}</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Assignment Title *</Label>
                    <Input value={homeworkTitle} onChange={(e) => setHomeworkTitle(e.target.value)} placeholder="e.g. Science Chapter 3 Q&A" required className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Instructions / Description</Label>
                    <Textarea value={homeworkDesc} onChange={(e) => setHomeworkDesc(e.target.value)} placeholder="Enter details..." className="mt-1 resize-none h-24" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Due Date *</Label>
                    <Input type="date" value={homeworkDue} onChange={(e) => setHomeworkDue(e.target.value)} required className="mt-1" />
                  </div>
                  <Button type="submit" disabled={postingHomework} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold">
                    {postingHomework ? 'Posting...' : 'Post Assignment'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">My Posted Assignments</h2>
              <div className="space-y-3">
                {myAssignments.length === 0 ? (
                  <Card className="p-12 text-center text-gray-400">No homework posted yet.</Card>
                ) : (
                  myAssignments.map((a) => (
                    <Card key={a.id} className="hover:border-sky-200 transition-colors">
                      <CardHeader className="p-4 border-b bg-slate-50/50 flex justify-between items-start flex-row">
                        <div>
                          <span className="bg-sky-50 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{a.subject}</span>
                          <CardTitle className="text-sm font-bold text-gray-900 mt-1">{a.title}</CardTitle>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border">Class: {a.class}</span>
                      </CardHeader>
                      <CardContent className="p-4 text-xs space-y-2">
                        <p className="text-gray-600 leading-relaxed">{a.description || 'No description provided.'}</p>
                        <p className="text-[10px] text-red-500 font-semibold">Due: {a.due_date ? new Date(a.due_date).toLocaleDateString('en-IN') : '—'}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MATERIALS VIEW */}
      {activeTab === 'resources' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Upload Study Materials</h1>
            <p className="text-gray-500 mt-1">Publish reference notes and documents for student downloads.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border border-slate-200">
              <CardHeader><CardTitle className="text-base font-bold">Upload Material</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleUploadMaterial} className="space-y-4 text-xs">
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Class *</Label>
                    <select
                      value={materialClass}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMaterialClass(val);
                        const subs = assignedSubjectsMap[val] || [];
                        if (subs.length > 0) {
                          setMaterialSub(subs[0]);
                        } else {
                          setMaterialSub('');
                        }
                      }}
                      className={cls + " mt-1"}
                    >
                      {assignedClasses.length === 0 ? (
                        <option value="">No Classes Assigned</option>
                      ) : (
                        assignedClasses.map((c) => <option key={c} value={c}>{c}</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Subject *</Label>
                    <select value={materialSub} onChange={(e) => setMaterialSub(e.target.value)} className={cls + " mt-1"}>
                      {(!materialClass || !assignedSubjectsMap[materialClass] || assignedSubjectsMap[materialClass].length === 0) ? (
                        <option value="">No Subjects Assigned</option>
                      ) : (
                        assignedSubjectsMap[materialClass].map((sub) => <option key={sub} value={sub}>{sub}</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Document Title *</Label>
                    <Input value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="e.g. Geometry Syllabus 2026" required className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Description</Label>
                    <Textarea value={materialDesc} onChange={(e) => setMaterialDesc(e.target.value)} placeholder="Enter details..." className="mt-1 resize-none h-16" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-600">Material Document URL *</Label>
                    <Input value={materialUrl} onChange={(e) => setMaterialUrl(e.target.value)} placeholder="e.g. https://drive.google.com/.../file" required className="mt-1" />
                  </div>
                  <Button type="submit" disabled={uploadingMaterial} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold">
                    {uploadingMaterial ? 'Uploading...' : 'Publish Material'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">My Shared Study Materials</h2>
              <div className="space-y-3">
                {myMaterials.length === 0 ? (
                  <Card className="p-12 text-center text-gray-400">No study materials shared yet.</Card>
                ) : (
                  myMaterials.map((m) => (
                    <Card key={m.id} className="hover:border-sky-200 transition-colors">
                      <CardContent className="p-4 flex justify-between items-center gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="bg-sky-50 text-sky-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">{m.subject}</span>
                          <h4 className="font-bold text-gray-900 mt-1">{m.title}</h4>
                          {m.description && <p className="text-gray-500">{m.description}</p>}
                          <p className="text-[10px] text-gray-400">Shared with Class: {m.class}</p>
                        </div>
                        <Button onClick={() => window.open(m.file_url, '_blank')} size="sm" variant="outline" className="border-sky-200 text-sky-600 text-xs shrink-0">
                          <ChevronRight className="w-4 h-4 mr-1" /> View Link
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER LEAVES VIEW */}
      {activeTab === 'leaves' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Request Leave</h1>
            <p className="text-gray-500 mt-1">Submit leave request application to administration.</p>
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
                    <Textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Provide details..." required className="mt-1 text-xs resize-none h-24" />
                  </div>
                  <Button type="submit" disabled={leaveSubmitting} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold">
                    {leaveSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-800">My Leave History</h2>
              <div className="space-y-3">
                {leaves.length === 0 ? (
                  <Card className="p-12 text-center text-gray-400">No leave requests submitted yet.</Card>
                ) : (
                  leaves.map((l) => (
                    <Card key={l.id} className="hover:border-sky-200 transition-colors">
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

      {/* STUDENT LEAVES VIEW */}
      {activeTab === 'student-leaves' && (
        <div className="space-y-6 text-left">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">Student Leave Applications</h1>
            <p className="text-gray-500 mt-1">Review and approve leave applications for your class.</p>
          </div>

          <div className="space-y-4">
            {myClassTeacherClasses.length === 0 ? (
              <Card className="p-12 text-center text-gray-400">
                You are not designated as a Class Teacher for any class.
              </Card>
            ) : studentLeaves.length === 0 ? (
              <Card className="p-12 text-center text-gray-400">
                No leave applications from students.
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {studentLeaves.map((l) => (
                  <Card key={l.id} className="hover:border-sky-200 transition-colors">
                    <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-base">{l.students?.name}</span>
                          <span className="bg-sky-50 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Class {l.students?.class}</span>
                          <span className="text-xs text-gray-400 font-mono">ID: {l.students?.student_id}</span>
                        </div>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold text-gray-500">Duration:</span>{' '}
                          {new Date(l.from_date).toLocaleDateString('en-IN')} to {new Date(l.to_date).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold text-gray-500">Reason:</span> {l.reason}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Submitted: {new Date(l.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        {l.status === 'pending' ? (
                          <>
                            <Button
                              onClick={() => handleUpdateStudentLeave(l.id, 'approved')}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button
                              onClick={() => handleUpdateStudentLeave(l.id, 'rejected')}
                              size="sm"
                              variant="destructive"
                              className="font-semibold flex items-center gap-1 text-xs"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {l.status === 'approved' && (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-semibold text-emerald-600">Approved</span>
                              </>
                            )}
                            {l.status === 'rejected' && (
                              <>
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-semibold text-red-600">Rejected</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
