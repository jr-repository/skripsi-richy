import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Briefcase,
  Target,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  LogOut,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

// Inline JobForm component
interface JobFormProps {
  initialData: Pekerjaan | null;
  onSave: (jobData: Omit<Pekerjaan, 'id' | 'nilai_total_ahp_pm' | 'admin_id' | 'nama_admin'>, jobId?: number) => void;
  onCancel: () => void;
}

const JobForm: React.FC<JobFormProps> = ({ initialData, onSave, onCancel }) => {
  const [nama, setNama] = useState(initialData?.nama || '');
  const [rata_rata_gaji, setRataRataGaji] = useState(initialData?.rata_rata_gaji || 0);
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi || '');

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama);
      setRataRataGaji(initialData.rata_rata_gaji);
      setDeskripsi(initialData.deskripsi);
    } else {
      setNama('');
      setRataRataGaji(0);
      setDeskripsi('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const jobDataToSave = {
      nama,
      rata_rata_gaji,
      deskripsi,
    };
    onSave(jobDataToSave, initialData?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nama">Nama Pekerjaan</Label>
        <Input
          id="nama"
          type="text"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="e.g., Software Engineer"
          required
        />
      </div>
      <div>
        <Label htmlFor="gaji">Rata-rata Gaji</Label>
        <Input
          id="gaji"
          type="number"
          value={rata_rata_gaji}
          onChange={(e) => setRataRataGaji(parseFloat(e.target.value))}
          placeholder="e.g., 8000000"
          required
        />
      </div>
      <div>
        <Label htmlFor="deskripsi">Deskripsi</Label>
        <Textarea
          id="deskripsi"
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Deskripsi singkat pekerjaan..."
          rows={4}
          required
        />
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" className="gradient-blue">
          {initialData ? 'Perbarui' : 'Tambah'} Pekerjaan
        </Button>
      </DialogFooter>
    </form>
  );
};

// New component for adding new 'ahli' admin
const AddAhliForm: React.FC<{ onSave: (data: any) => void, onCancel: () => void, isLoading: boolean }> = ({ onSave, onCancel, isLoading }) => {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ nama, email, password, pekerjaan });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nama">Nama</Label>
        <Input id="nama" type="text" value={nama} onChange={(e) => setNama(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="pekerjaan">Pekerjaan</Label>
        <Input id="pekerjaan" type="text" value={pekerjaan} onChange={(e) => setPekerjaan(e.target.value)} placeholder="e.g., Ahli Kriteria" required />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" className="gradient-blue" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Tambah Ahli
        </Button>
      </div>
    </form>
  );
};

interface AdminUser {
  id: number;
  nama: string;
  email: string;
  pekerjaan: string;
  role: 'superadmin' | 'ahli';
  created_at: string;
}

interface Pekerjaan {
  id: number;
  nama: string;
  rata_rata_gaji: number;
  deskripsi: string;
  admin_id: number;
  nama_admin: string;
  nilai_total_ahp_pm?: number | null;
}

const API_BASE_URL = 'https://support.antlia.id/api';

const AdminDashboard: React.FC = () => {
  const [pekerjaan, setPekerjaan] = useState<Pekerjaan[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [totalKriteria, setTotalKriteria] = useState<number>(0);
  const [totalSubKriteria, setTotalSubKriteria] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isJobModalOpen, setIsJobModalOpen] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<Pekerjaan | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState<boolean>(false);
  const [jobToDelete, setJobToDelete] = useState<Pekerjaan | null>(null);
  const [showAddAhliForm, setShowAddAhliForm] = useState(false);
  const [loadingAhli, setLoadingAhli] = useState(false);
  
  // State for UI Interactions
  const [isWorkflowOpen, setIsWorkflowOpen] = useState<boolean>(false); // Default minimized
  const [creatorFilter, setCreatorFilter] = useState<string>('all');

  // State for Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const { toast } = useToast();

  const adminDataString = localStorage.getItem('adminAuth');
  const adminData = adminDataString ? JSON.parse(adminDataString) : {};
  const isAdminLoggedIn = adminData.isLoggedIn;
  const userRole = adminData.role;
  const loggedInAdminId = adminData.userId;

  useEffect(() => {
    if (!isAdminLoggedIn) {
      navigate('/admin/login');
    }
  }, [isAdminLoggedIn, navigate]);

  // Function to fetch job data from the API
  const fetchPekerjaan = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: Pekerjaan[] = await response.json();
      setPekerjaan(data);
    } catch (error: any) {
      console.error("Gagal mengambil data pekerjaan:", error);
      toast({
        title: "Gagal Memuat Pekerjaan",
        description: `Terjadi kesalahan saat memuat data pekerjaan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Function to fetch total global criteria
  const fetchTotalKriteria = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/kriteria`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTotalKriteria(data.length);
    } catch (error: any) {
      console.error("Gagal mengambil total kriteria:", error);
      toast({
        title: "Gagal Memuat Total Kriteria",
        description: `Terjadi kesalahan saat memuat total kriteria: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Function to fetch total global sub-criteria
  const fetchTotalSubKriteria = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sub_kriteria_global`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTotalSubKriteria(data.length);
    } catch (error: any) {
      console.error("Gagal mengambil total sub-kriteria:", error);
      toast({
        title: "Gagal Memuat Total Sub-Kriteria",
        description: `Terjadi kesalahan saat memuat total sub-kriteria: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // New function to fetch admin list
  const fetchAdmins = useCallback(async () => {
    // Although initially for superadmin, we might need this for the filter dropdown even for regular users if we want to filter by "Who created what"
    // Or just derive unique creators from the job list. 
    // Keeping existing logic: Fetch if superadmin.
    if (userRole !== 'superadmin') {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/admin/list?userRole=${userRole}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: AdminUser[] = await response.json();
      setAdmins(data);
    } catch (error: any) {
      console.error("Gagal mengambil data admin:", error);
      toast({
        title: "Gagal Memuat Daftar Admin",
        description: `Terjadi kesalahan saat memuat data admin: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast, userRole]);

  useEffect(() => {
    fetchPekerjaan();
    fetchTotalKriteria();
    fetchTotalSubKriteria();
    fetchAdmins();
  }, [fetchPekerjaan, fetchTotalKriteria, fetchTotalSubKriteria, fetchAdmins]);

  // Handler for saving a job (add or update)
  const handleSaveJob = async (jobData: Omit<Pekerjaan, 'id' | 'nilai_total_ahp_pm' | 'admin_id' | 'nama_admin'>, jobId?: number) => {
    try {
      const method = jobId ? 'PUT' : 'POST';
      const url = jobId ? `${API_BASE_URL}/pekerjaan/${jobId}?adminId=${loggedInAdminId}` : `${API_BASE_URL}/pekerjaan?adminId=${loggedInAdminId}`;

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: `Pekerjaan Berhasil ${jobId ? 'Diperbarui' : 'Ditambahkan'}`,
        description: `Data pekerjaan telah berhasil ${jobId ? 'diperbarui' : 'ditambahkan'}.`,
        variant: "default",
      });
      setIsJobModalOpen(false); // Close the modal
      setEditingJob(null);
      fetchPekerjaan();
    } catch (error: any) {
      console.error("Gagal menyimpan pekerjaan:", error);
      toast({
        title: "Gagal Menyimpan Pekerjaan",
        description: `Terjadi kesalahan saat menyimpan pekerjaan: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handler for deleting a job
  const handleDeleteJob = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan/${id}?adminId=${loggedInAdminId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Pekerjaan Berhasil Dihapus',
        description: 'Data pekerjaan telah berhasil dihapus.',
        variant: "default",
      });
      setIsDeleteConfirmModalOpen(false); // Close the dialog
      setJobToDelete(null);
      fetchPekerjaan();
    } catch (error: any) {
      console.error("Gagal menghapus pekerjaan:", error);
      toast({
        title: "Gagal Menghapus Pekerjaan",
        description: `Terjadi kesalahan saat menghapus pekerjaan: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handler to prepare for editing a job
  const handleEditJob = (job: Pekerjaan) => {
    setEditingJob(job);
    setIsJobModalOpen(true);
  };
  
  const handleAddJob = () => {
    setEditingJob(null);
    setIsJobModalOpen(true);
  };

  // Handler for adding a new 'ahli' admin
  const handleAddAhli = async (adminData: any) => {
    setLoadingAhli(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/add?userRole=${userRole}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal menambahkan akun ahli.');
      }

      toast({
        title: "Akun Ahli Berhasil Ditambahkan",
        description: `Akun untuk ${adminData.nama} telah berhasil dibuat.`,
      });
      setShowAddAhliForm(false);
      fetchAdmins();
    } catch (error: any) {
      console.error("Gagal menambahkan akun ahli:", error);
      toast({
        title: "Gagal Menambahkan Akun Ahli",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingAhli(false);
    }
  };

  // Handler for logout
  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    toast({
      title: "Logout Berhasil",
      description: "Anda telah keluar dari panel admin",
      variant: "default",
    });
    navigate('/admin/login');
  };

  // Updated stats array to reflect dynamic counts
  const stats = [
    {
      title: 'Total Pekerjaan',
      value: pekerjaan.length.toString(),
      icon: <Briefcase className="h-6 w-6 text-blue-400" />,
      color: 'text-blue-400'
    },
    {
      title: 'Total Kriteria',
      value: totalKriteria.toString(),
      icon: <Settings className="h-6 w-6 text-green-400" />,
      color: 'text-green-400'
    },
    {
      title: 'Total Sub-Kriteria',
      value: totalSubKriteria.toString(),
      icon: <Target className="h-6 w-6 text-purple-400" />,
      color: 'text-purple-400'
    },
    {
      title: 'Total Admin',
      value: admins.length.toString(),
      icon: <Users className="h-6 w-6 text-cyan-400" />,
      color: 'text-cyan-400'
    },
  ];

  // Derive unique creators for the filter dropdown
  const uniqueCreators = useMemo(() => {
    const creators = new Map();
    pekerjaan.forEach(job => {
      if (job.admin_id && job.nama_admin) {
        creators.set(job.admin_id, job.nama_admin);
      }
    });
    return Array.from(creators.entries()).map(([id, name]) => ({ id, name }));
  }, [pekerjaan]);

  // Filtered Data
  const filteredPekerjaan = useMemo(() => {
    if (creatorFilter === 'all') {
      return pekerjaan;
    }
    return pekerjaan.filter(job => String(job.admin_id) === creatorFilter);
  }, [pekerjaan, creatorFilter]);

  // Pagination logic based on filtered data
  const totalPages = Math.ceil(filteredPekerjaan.length / itemsPerPage);
  
  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [creatorFilter]);

  const paginatedPekerjaan = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPekerjaan.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPekerjaan, currentPage, itemsPerPage]);

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => prev - 1);
  };

  return (
    <div className="space-y-8 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
          <p className="text-muted-foreground">Kelola sistem rekomendasi karier</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/kriteria-global">
            <Button variant="outline" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Pengaturan Kriteria Global
            </Button>
          </Link>
          <Button
            className="gradient-blue flex items-center"
            onClick={handleAddJob}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pekerjaan Baru
          </Button>
          <Button variant="outline" onClick={handleLogout} className="flex items-center">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card/50 border-border hover:bg-card/70 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Alur Section (Collapsible) */}
      <Card className="bg-card/50 border-border">
        <CardHeader 
          className="cursor-pointer flex flex-row items-center justify-between" 
          onClick={() => setIsWorkflowOpen(!isWorkflowOpen)}
        >
          <div className="space-y-1">
            <CardTitle className="text-foreground">Alur Proses Rekomendasi</CardTitle>
            <CardDescription>Tahapan yang perlu dilewati untuk setiap pekerjaan.</CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            <ChevronDown className={`h-6 w-6 text-muted-foreground transition-transform duration-200 ${isWorkflowOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CardHeader>
        {isWorkflowOpen && (
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 pt-2">
              <div className="flex-1 text-center">
                <Settings className="h-8 w-8 text-primary mx-auto" />
                <p className="mt-2 text-sm font-medium">1. Atur Kriteria & Sub Kriteria</p>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
              <ArrowDown className="h-6 w-6 text-muted-foreground block md:hidden" />
              <div className="flex-1 text-center">
                <BarChart3 className="h-8 w-8 text-primary mx-auto" />
                <p className="mt-2 text-sm font-medium">2. Hitung AHP</p>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
              <ArrowDown className="h-6 w-6 text-muted-foreground block md:hidden" />
              <div className="flex-1 text-center">
                <Target className="h-8 w-8 text-primary mx-auto" />
                <p className="mt-2 text-sm font-medium">3. Atur PM</p>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
              <ArrowDown className="h-6 w-6 text-muted-foreground block md:hidden" />
              <div className="flex-1 text-center">
                <Briefcase className="h-8 w-8 text-primary mx-auto" />
                <p className="mt-2 text-sm font-medium">4. Selesai</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Admin Management Section (Visible only to Superadmin) */}
      {userRole === 'superadmin' && (
        <Card className="bg-card/50 border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Manajemen Admin</CardTitle>
              <CardDescription>Kelola akun admin dan ahli</CardDescription>
            </div>
            <Button onClick={() => setShowAddAhliForm(!showAddAhliForm)} className="gradient-blue">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Admin Ahli
            </Button>
          </CardHeader>
          <CardContent>
            {showAddAhliForm && (
              <div className="mb-6 p-4 border rounded-lg bg-background/50">
                <h3 className="text-lg font-semibold mb-4">Form Tambah Admin Ahli</h3>
                <AddAhliForm onSave={handleAddAhli} onCancel={() => setShowAddAhliForm(false)} isLoading={loadingAhli} />
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Pekerjaan</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>{admin.nama}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.pekerjaan}</TableCell>
                      <TableCell>
                        <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                          {admin.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job List Table */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-foreground">Daftar Pekerjaan</CardTitle>
            <CardDescription>Kelola semua pekerjaan dalam sistem</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="creatorFilter" className="whitespace-nowrap">Filter User Create:</Label>
            <select
              id="creatorFilter"
              className="h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={creatorFilter}
              onChange={(e) => setCreatorFilter(e.target.value)}
            >
              <option value="all">Semua User</option>
              {uniqueCreators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat pekerjaan...</span>
            </div>
          ) : (
            paginatedPekerjaan.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                {pekerjaan.length === 0 ? "Belum ada data pekerjaan. Silakan tambahkan pekerjaan baru." : "Tidak ada pekerjaan yang sesuai dengan filter."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">No</TableHead>
                      <TableHead>Nama Pekerjaan</TableHead>
                      <TableHead>Dibuat Oleh</TableHead>
                      <TableHead>Rata-rata Gaji</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="w-[100px] text-center">AHP-PM</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPekerjaan.map((job, index) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">{job.nama}</TableCell>
                        <TableCell className="text-muted-foreground">{job.nama_admin || 'Tidak Diketahui'}</TableCell>
                        <TableCell>Rp {job.rata_rata_gaji.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                          {job.deskripsi}
                        </TableCell>
                        <TableCell className="text-center">
                          {job.nilai_total_ahp_pm !== null && job.nilai_total_ahp_pm !== undefined ?
                            job.nilai_total_ahp_pm.toFixed(4) :
                            <span className="italic text-muted-foreground text-sm">Belum dihitung</span>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-center gap-2">
                            <Link to={`/admin/pekerjaan/${job.id}/kriteria`}>
                              <Button variant="outline" size="icon" title="Atur Kriteria">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link to={`/admin/pekerjaan/${job.id}/ahp`}>
                              <Button variant="outline" size="icon" title="Hitung AHP">
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link to={`/admin/pekerjaan/${job.id}/pm`}>
                              <Button variant="outline" size="icon" title="Atur PM">
                                <Target className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Edit Pekerjaan"
                              onClick={() => handleEditJob(job)}
                              disabled={Number(job.admin_id) !== loggedInAdminId && userRole !== 'superadmin'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {/* Delete Confirmation Dialog */}
                            <Dialog open={isDeleteConfirmModalOpen && jobToDelete?.id === job.id} onOpenChange={setIsDeleteConfirmModalOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title="Hapus Pekerjaan"
                                  className="text-red-400 hover:text-red-300"
                                  disabled={Number(job.admin_id) !== loggedInAdminId && userRole !== 'superadmin'}
                                  onClick={() => {
                                    setJobToDelete(job);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
                                  <DialogDescription>
                                    Apakah Anda yakin ingin menghapus pekerjaan "{job.nama}"? Aksi ini tidak dapat dibatalkan.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setIsDeleteConfirmModalOpen(false)}>Batal</Button>
                                  <Button type="button" variant="destructive" onClick={() => jobToDelete && handleDeleteJob(jobToDelete.id)}>Hapus</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}
          
          {/* Pagination Controls */}
          {filteredPekerjaan.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Sebelumnya
              </Button>
              <div className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </div>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
      
      {/* Modal for adding/editing a job */}
      <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Edit Pekerjaan' : 'Tambah Pekerjaan Baru'}</DialogTitle>
            <DialogDescription>
              {editingJob ? `Mengedit data pekerjaan: ${editingJob.nama}` : 'Masukkan detail pekerjaan baru.'}
            </DialogDescription>
          </DialogHeader>
          <JobForm
            initialData={editingJob}
            onSave={handleSaveJob}
            onCancel={() => setIsJobModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;