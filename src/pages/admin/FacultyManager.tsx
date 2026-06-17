import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, X, Check, Upload, ImageIcon, RefreshCw } from 'lucide-react';

interface Faculty {
  id: string;
  name: string;
  role: string | null;
  qual: string | null;
  exp: string | null;
  initials: string | null;
  color: string | null;
  photo_url: string | null;
  display_order: number;
}

const COLORS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-teal-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-red-500 to-rose-600',
  'from-sky-500 to-blue-600',
];

const BUCKET = 'faculty-photos';
const EMPTY = { name: '', role: '', qual: '', exp: '', initials: '', color: COLORS[0], photo_url: '', display_order: 99 };

const cls = 'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

/* ── Inline photo uploader ─────────────────────────────────── */
function PhotoUploader({
  value,
  onChange,
  bucket,
  folder,
}: {
  value: string;
  onChange: (url: string) => void;
  bucket: string;
  folder: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message.includes('Bucket not found')
        ? `Storage bucket "${bucket}" not found. Go to Supabase → Storage → New bucket, name it "${bucket}", set Public ON.`
        : error.message);
    } else {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success('✅ Photo uploaded! Now click Save to store it.');
    }
    setUploading(false);
  };

  return (
    <div className="mt-1 flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
        {value ? (
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <ImageIcon className="w-5 h-5 text-gray-300" />
        )}
      </div>
      <div className="flex-1 space-y-1.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full gap-1.5 text-xs"
        >
          {uploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? 'Uploading…' : 'Upload Photo'}
        </Button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-red-400 hover:text-red-600 hover:underline w-full text-center"
          >
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}

export default function FacultyManager() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('faculty').select('*').order('display_order');
    if (error) toast.error('Failed to load faculty');
    else setFaculty(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFaculty(); }, [fetchFaculty]);

  const openAdd = () => { setEditId(null); setForm({ ...EMPTY }); setShowForm(true); };
  const openEdit = (f: Faculty) => {
    setEditId(f.id);
    setForm({
      name: f.name, role: f.role ?? '', qual: f.qual ?? '', exp: f.exp ?? '',
      initials: f.initials ?? '', color: f.color ?? COLORS[0],
      photo_url: f.photo_url ?? '', display_order: f.display_order,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const payload = {
      ...form,
      initials: form.initials || form.name.slice(0, 2).toUpperCase(),
      photo_url: form.photo_url || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editId
      ? await supabase.from('faculty').update(payload).eq('id', editId)
      : await supabase.from('faculty').insert([payload]);
    if (error) {
      // Detect the two most common causes clearly
      if (error.message.includes('photo_url') && error.message.includes('column')) {
        toast.error('❌ DB missing photo_url column. Run supabase_faculty_photo_patch.sql in Supabase SQL Editor first.');
      } else if (error.code === '42501' || error.message.includes('row-level security')) {
        toast.error('❌ Permission denied. Run supabase_faculty_photo_patch.sql to add RLS policies.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(editId ? '✅ Updated successfully!' : '✅ Added successfully!');
      setShowForm(false);
      fetchFaculty();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('faculty').delete().eq('id', id);
    if (error) toast.error('Delete failed'); else { toast.success('Removed'); fetchFaculty(); }
    setDeleteId(null);
  };

  const filtered = faculty.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.role ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900">Faculty Manager</h1>
          <p className="text-gray-500 mt-1">View faculty members. Managed by Clerk.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Read-only view</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <Input placeholder="Search by name or role…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>No faculty found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#', 'Photo', 'Name', 'Role', 'Qualification', 'Experience'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold text-gray-600 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((f, i) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{f.display_order}</td>
                    <td className="px-4 py-2">
                      {f.photo_url ? (
                        <img src={f.photo_url} alt={f.name} className="w-10 h-10 rounded-xl object-cover border border-gray-200" />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color ?? COLORS[i % COLORS.length]} flex items-center justify-center text-white text-xs font-bold`}>
                          {f.initials ?? f.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                    <td className="px-4 py-3 text-gray-600">{f.role ?? <span className="italic text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{f.qual ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{f.exp ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">Total: {faculty.length} members</p>
    </div>
  );
}
