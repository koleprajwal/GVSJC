import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Pencil, Trash2, X } from 'lucide-react';

const CLASSES = ['LKG', 'UKG', ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];

interface Student {
  id: string;
  student_id: string;
  name: string;
  class: string;
  roll_no: string;
  parent_name: string;
  parent_phone: string;
  email: string;
  password?: string;
  dob: string;
  nationality: string;
  mother_tongue: string;
  religion: string;
  caste: string;
  sub_caste: string;
  father_name: string;
  mother_name: string;
  place_of_birth: string;
  taluka: string;
  district: string;
  city: string;
  state: string;
  admission_class: string;
  date_of_admission: string;
  previous_school: string;
}

const emptyStudent: Omit<Student, 'id'> = {
  student_id: '', name: '', class: '', roll_no: '', parent_name: '', parent_phone: '',
  email: '', password: 'student123', dob: '', nationality: 'Indian', mother_tongue: '', religion: '', caste: '',
  sub_caste: '', father_name: '', mother_name: '', place_of_birth: '', taluka: '',
  district: '', city: '', state: '', admission_class: '', date_of_admission: '', previous_school: '',
};

export default function Enrollment() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Omit<Student, 'id'>>(emptyStudent);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('students').select('*').order('name');
    if (error) toast.error('Failed to load students');
    else setStudents(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete student "${name}"?`)) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) toast.error('Failed to delete student');
    else { toast.success('Student deleted'); fetchStudents(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const { error } = await supabase.from('students').update(formData).eq('id', editingStudent.id);
    if (error) toast.error(error.message || 'Update failed');
    else { toast.success('Student updated'); setShowModal(false); fetchStudents(); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const filteredStudents = students.filter((s) => {
    const matchClass = classFilter === 'all' || s.class === classFilter;
    const matchName = !searchName || s.name?.toLowerCase().includes(searchName.toLowerCase());
    return matchClass && matchName;
  });

  const uniqueClasses = [...new Set(students.map((s) => s.class))].filter(Boolean).sort();
  const labelClass = "text-sm font-medium text-gray-700";
  const selectClass = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold font-display text-gray-900">Student Enrollment</h1>
        <p className="text-gray-500 mt-1">View and manage all enrolled students.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex-1">
          <Label className={labelClass}>Filter by Class</Label>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={selectClass}>
            <option value="all">All Classes</option>
            {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <Label className={labelClass}>Search by Name</Label>
          <Input placeholder="Search..." value={searchName} onChange={(e) => setSearchName(e.target.value)} className="mt-1" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Roll No', 'Name', 'Class', 'Parent', 'Contact', 'Email', 'Password', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{s.roll_no}</td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.class}</td>
                    <td className="px-4 py-3">{s.parent_name}</td>
                    <td className="px-4 py-3">{s.parent_phone}</td>
                    <td className="px-4 py-3 text-gray-500">{s.email}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.password || 'student123'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-gray-500">No students found.</div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Edit Student</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className={labelClass}>Student ID</Label><Input name="student_id" value={formData.student_id} onChange={handleChange} className="mt-1" /></div>
                <div><Label className={labelClass}>Full Name *</Label><Input name="name" value={formData.name} onChange={handleChange} required className="mt-1" /></div>
                <div><Label className={labelClass}>Date of Birth</Label><Input type="date" name="dob" value={formData.dob} onChange={handleChange} className="mt-1" /></div>
                <div><Label className={labelClass}>Nationality</Label><Input name="nationality" value={formData.nationality} onChange={handleChange} className="mt-1" /></div>
                <div><Label className={labelClass}>Father's Name</Label><Input name="father_name" value={formData.father_name} onChange={handleChange} className="mt-1" /></div>
                <div><Label className={labelClass}>Mother's Name</Label><Input name="mother_name" value={formData.mother_name} onChange={handleChange} className="mt-1" /></div>
                <div><Label className={labelClass}>Parent Name</Label><Input name="parent_name" value={formData.parent_name} onChange={handleChange} className="mt-1" /></div>
                <div><Label className={labelClass}>Parent Phone</Label><Input name="parent_phone" value={formData.parent_phone} onChange={handleChange} className="mt-1" /></div>
                <div>
                  <Label className={labelClass}>Current Class</Label>
                  <select name="class" value={formData.class} onChange={handleChange} className={selectClass}>
                    <option value="">Select</option>
                    {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><Label className={labelClass}>Roll No</Label><Input name="roll_no" value={formData.roll_no} onChange={handleChange} className="mt-1" /></div>
                <div><Label className={labelClass}>Email *</Label><Input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1" /></div>
                <div><Label className={labelClass}>Portal Password *</Label><Input name="password" value={formData.password || ''} onChange={handleChange} required className="mt-1" /></div>
                <div><Label className={labelClass}>Religion</Label><Input name="religion" value={formData.religion} onChange={handleChange} className="mt-1" /></div>
                <div><Label className={labelClass}>Caste</Label><Input name="caste" value={formData.caste} onChange={handleChange} className="mt-1" /></div>
                <div><Label className={labelClass}>Mother Tongue</Label><Input name="mother_tongue" value={formData.mother_tongue} onChange={handleChange} className="mt-1" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
