// src/pages/Admin/JobCriteriaToggle.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ArrowLeft,
  Save,
  Settings,
  Loader2 // For loading spinner
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Definisi interface untuk struktur data
interface GlobalCriterion {
  id: number;
  nama_kriteria: string;
}

interface JobCriterionStatus { // Status aktif kriteria utama untuk pekerjaan
  id: number; // id from pekerjaan_kriteria table
  kriteria_id: number; // id from kriteria_global
  nama_kriteria: string;
  aktif: number; // 0 or 1
}

interface SubKriteriaGlobal {
  id: number; // sub_kriteria_global_id
  kriteria_global_id: number;
  nama_kriteria: string; // nama kriteria utama dari join
  nama_sub_kriteria: string;
  kode_sub_kriteria: string;
}

interface JobSubCriterionDetail { // Status aktif dan nilai ideal sub-kriteria untuk pekerjaan
  id: number; // id from pekerjaan_sub_kriteria_detail table
  pekerjaan_id: number;
  sub_kriteria_global_id: number;
  nama_sub_kriteria: string;
  kode_sub_kriteria: string;
  kriteria_global_id: number;
  nama_kriteria: string; // Nama kriteria utama dari join
  aktif: number; // 0 or 1
  nilai_ideal: number;
}

// Base URL untuk API backend Anda
const API_BASE_URL = 'http://sipemalem.my.id/backend-rekomendasi-karir';

const JobCriteriaToggle: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast(); // Menggunakan useToast dari shadcn/ui

  const [jobName, setJobName] = useState<string>('');
  const [globalCriteria, setGlobalCriteria] = useState<GlobalCriterion[]>([]);
  const [jobMainCriteriaStatus, setJobMainCriteriaStatus] = useState<JobCriterionStatus[]>([]);
  const [allSubKriteriaGlobal, setAllSubKriteriaGlobal] = useState<SubKriteriaGlobal[]>([]);
  const [jobSubCriteriaDetail, setJobSubCriteriaDetail] = useState<JobSubCriterionDetail[]>([]);
  const [jobAdminId, setJobAdminId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  const adminDataString = localStorage.getItem('adminAuth');
  const adminData = adminDataString ? JSON.parse(adminDataString) : {};
  const userRole = adminData.role;
  const loggedInAdminId = adminData.userId;

  // Cek otorisasi
  const isAuthorizedToEdit = jobAdminId === loggedInAdminId || userRole === 'superadmin';

  // Fungsi untuk Mengambil Data dari API
  const fetchJobDetails = useCallback(async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan/${id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setJobName(data.nama);
      setJobAdminId(data.admin_id); // Set admin ID pekerjaan
    } catch (error: any) {
      console.error("Gagal mengambil detail pekerjaan:", error);
      toast({
        title: "Gagal Memuat Detail Pekerjaan",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchGlobalCriteria = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/kriteria`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: GlobalCriterion[] = await response.json();
      setGlobalCriteria(data.map(item => ({ ...item, id: parseInt(item.id.toString()) })));
    } catch (error: any) {
      console.error("Gagal mengambil kriteria global:", error);
      toast({
        title: "Gagal Memuat Kriteria Global",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchJobSpecificMainCriteria = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan_kriteria/${id}`);
      // Check for 404 specifically as it means no active criteria, not necessarily an error
      if (!response.ok && response.status !== 404) throw new Error(`HTTP error! status: ${response.status}`);
      const data: JobCriterionStatus[] = response.status === 404 ? [] : await response.json();
      setJobMainCriteriaStatus(data);
    } catch (error: any) {
      console.error("Gagal mengambil kriteria utama spesifik pekerjaan:", error);
      toast({
        title: "Gagal Memuat Kriteria Utama Pekerjaan",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAllSubKriteriaGlobal = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sub_kriteria_global`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: SubKriteriaGlobal[] = await response.json();
      setAllSubKriteriaGlobal(data.map(item => ({
        ...item,
        id: parseInt(item.id.toString()),
        kriteria_global_id: parseInt(item.kriteria_global_id.toString())
      })));
    } catch (error: any) {
      console.error("Gagal mengambil sub-kriteria global:", error);
      toast({
        title: "Gagal Memuat Sub-Kriteria Global",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchJobSpecificSubCriteriaDetail = useCallback(async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan_sub_kriteria_detail/${id}`);
      if (!response.ok && response.status !== 404) throw new Error(`HTTP error! status: ${response.status}`);
      const data: JobSubCriterionDetail[] = response.status === 404 ? [] : await response.json();
      setJobSubCriteriaDetail(data);
    } catch (error: any) {
      console.error("Gagal mengambil detail sub-kriteria pekerjaan:", error);
      toast({
        title: "Gagal Memuat Detail Sub-Kriteria Pekerjaan",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // useEffect untuk memuat data saat komponen dimuat atau jobId berubah
  useEffect(() => {
    if (jobId) {
      const parsedJobId = parseInt(jobId);
      fetchJobDetails(parsedJobId);
      fetchGlobalCriteria();
      fetchJobSpecificMainCriteria(parsedJobId);
      fetchAllSubKriteriaGlobal();
      fetchJobSpecificSubCriteriaDetail(parsedJobId);
    }
  }, [jobId, fetchJobDetails, fetchGlobalCriteria, fetchJobSpecificMainCriteria, fetchAllSubKriteriaGlobal, fetchJobSpecificSubCriteriaDetail]);

  // Handler untuk mengaktifkan/menonaktifkan kriteria utama
  const handleMainCriterionToggle = async (kriteriaId: number, isChecked: boolean) => {
    if (!isAuthorizedToEdit) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mengedit kriteria pekerjaan ini.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan_kriteria/toggle?adminId=${loggedInAdminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pekerjaan_id: parseInt(jobId!),
          kriteria_id: kriteriaId,
          aktif: isChecked ? 1 : 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error response (raw text):", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (jsonError) {
          throw new Error(`Respons dari server bukan JSON yang valid. Pastikan tidak ada PHP errors/warnings di backend Anda. Raw response: ${errorText.substring(0, 200)}...`);
        }
      }

      const responseData = await response.json();
      toast({
        title: "Status Kriteria Utama Diperbarui",
        description: responseData.message || 'Status kriteria utama berhasil diperbarui.',
        variant: "default"
      });
      fetchJobSpecificMainCriteria(parseInt(jobId!)); // Re-fetch main criteria status
      fetchJobSpecificSubCriteriaDetail(parseInt(jobId!)); // Re-fetch sub-criteria status
    } catch (error: any) {
      console.error("Gagal memperbarui status kriteria utama:", error);
      toast({
        title: "Gagal Memperbarui Status Kriteria Utama",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Handler untuk mengaktifkan/menonaktifkan sub-kriteria
  const handleSubCriterionToggle = async (subKriteriaGlobalId: number, isChecked: boolean) => {
    if (!isAuthorizedToEdit) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mengedit kriteria pekerjaan ini.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan_sub_kriteria_detail/toggle?adminId=${loggedInAdminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pekerjaan_id: parseInt(jobId!),
          sub_kriteria_global_id: subKriteriaGlobalId,
          aktif: isChecked ? 1 : 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error response (raw text):", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (jsonError) {
          throw new Error(`Respons dari server bukan JSON yang valid. Pastikan tidak ada PHP errors/warnings di backend Anda. Raw response: ${errorText.substring(0, 200)}...`);
        }
      }

      const responseData = await response.json();
      toast({
        title: "Status Sub-Kriteria Diperbarui",
        description: responseData.message || 'Status sub-kriteria berhasil diperbarui.',
        variant: "default"
      });
      fetchJobSpecificSubCriteriaDetail(parseInt(jobId!)); // Re-fetch sub-criteria status
    } catch (error: any) {
      console.error("Gagal memperbarui status sub-kriteria:", error);
      toast({
        title: "Gagal Memperbarui Status Sub-Kriteria",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Logika Penggabungan Data untuk Tampilan UI (Memoized for performance)
  const mergedMainCriteria = useMemo(() => {
    return globalCriteria.map(gc => {
      const jobC = jobMainCriteriaStatus.find(jc => jc.kriteria_id === gc.id);
      return {
        kriteria_id: gc.id,
        nama_kriteria: gc.nama_kriteria,
        aktif: jobC ? (jobC.aktif === 1) : false,
      };
    });
  }, [globalCriteria, jobMainCriteriaStatus]);

  // Filter ID kriteria utama yang aktif
  const activeMainKriteriaIds = useMemo(() => {
    return mergedMainCriteria.filter(mc => mc.aktif).map(mc => mc.kriteria_id);
  }, [mergedMainCriteria]);

  // Filter dan gabungkan sub-kriteria yang relevan (Memoized for performance)
  const mergedSubKriteria = useMemo(() => {
    const relevantSubKriteriaGlobal = allSubKriteriaGlobal.filter(skg =>
      activeMainKriteriaIds.includes(skg.kriteria_global_id)
    );

    return relevantSubKriteriaGlobal.map(skg => {
      const jobSKD = jobSubCriteriaDetail.find(jsd => jsd.sub_kriteria_global_id === skg.id);
      return {
        sub_kriteria_global_id: skg.id,
        nama_sub_kriteria: skg.nama_sub_kriteria,
        kode_sub_kriteria: skg.kode_sub_kriteria,
        nama_kriteria_utama: skg.nama_kriteria,
        aktif: jobSKD ? (jobSKD.aktif === 1) : false,
      };
    }).sort((a, b) => a.nama_kriteria_utama.localeCompare(b.nama_kriteria_utama) || a.nama_sub_kriteria.localeCompare(b.nama_sub_kriteria));
  }, [allSubKriteriaGlobal, activeMainKriteriaIds, jobSubCriteriaDetail]);

  // Tampilkan pesan jika jobId tidak ditemukan
  if (!jobId) {
    return (
      <div className="p-6 bg-background min-h-screen flex flex-col items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center">
          <CardTitle className="text-destructive mb-4">Kesalahan</CardTitle>
          <CardDescription>ID Pekerjaan tidak ditemukan. Silakan kembali ke dashboard.</CardDescription>
          <Button onClick={() => navigate('/admin')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/admin">
            <Button variant="outline" size="sm" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Kriteria Pekerjaan</h1>
            <p className="text-muted-foreground">Konfigurasi kriteria untuk: <span className="font-medium text-foreground">{jobName || 'Memuat...'}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to={`/admin/pekerjaan/${jobId}/ahp`}>
            <Button variant="outline" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Setup AHP
            </Button>
          </Link>
          <Link to={`/admin/pekerjaan/${jobId}/pm`}>
            <Button variant="outline" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" /> {/* Using Settings icon as a placeholder */}
              Setup Profile Matching
            </Button>
          </Link>
          {/* Removing the "Simpan Konfigurasi" button from KODE 2 as KODE 1's toggles save immediately */}
        </div>
      </div>

      {/* Summary Card (adapted for KODE 1's data structure) */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Ringkasan Kriteria Aktif</CardTitle>
          <CardDescription>Kriteria utama yang akan digunakan untuk penilaian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{activeMainKriteriaIds.length}</div>
              <div className="text-sm text-muted-foreground">Kriteria Utama Aktif</div>
            </div>
            {/* Removed total weight as KODE 1's data model in this file does not track it */}
            <div className="text-center md:col-span-2">
              <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Status: Pembaruan Otomatis
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Perubahan disimpan secara otomatis saat Anda mengubah status aktif.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menampilkan Loading Spinner jika data sedang dimuat */}
      {loading ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Memuat data kriteria...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bagian Kriteria Utama */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Kriteria Utama</CardTitle>
              <CardDescription>Pilih kriteria utama yang relevan untuk pekerjaan ini.</CardDescription>
            </CardHeader>
            <CardContent>
              {mergedMainCriteria.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  Tidak ada kriteria utama global ditemukan. Silakan tambahkan di
                  <Link to="/admin/kriteria-global" className="text-primary hover:underline ml-1">Manajemen Kriteria Global</Link>.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-4/5">Nama Kriteria Utama</TableHead>
                        <TableHead className="text-center w-1/5">Status Aktif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mergedMainCriteria.map((item) => (
                        <TableRow key={item.kriteria_id}>
                          <TableCell className="font-medium">{item.nama_kriteria}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Switch
                                id={`main-criteria-${item.kriteria_id}`}
                                checked={item.aktif}
                                onCheckedChange={(checked) => handleMainCriterionToggle(item.kriteria_id, checked)}
                                disabled={!isAuthorizedToEdit} // Disable jika tidak diizinkan
                              />
                              <Label htmlFor={`main-criteria-${item.kriteria_id}`} className="text-sm">
                                {item.aktif ? 'Aktif' : 'Tidak Aktif'}
                              </Label>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bagian Sub-Kriteria (Hanya tampil jika ada kriteria utama aktif) */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Sub-Kriteria</CardTitle>
              <CardDescription>Pilih sub-kriteria yang relevan di bawah kriteria utama yang aktif.</CardDescription>
            </CardHeader>
            <CardContent>
              {activeMainKriteriaIds.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  Tidak ada kriteria utama yang aktif. Sub-kriteria akan ditampilkan di sini setelah Anda mengaktifkan setidaknya satu kriteria utama.
                </p>
              ) : mergedSubKriteria.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  Belum ada sub-kriteria global yang terkait dengan kriteria utama yang aktif.
                  Silakan tambahkan di
                  <Link to="/admin/kriteria-global" className="text-primary hover:underline ml-1">Manajemen Kriteria Global</Link>.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3">Kriteria Utama</TableHead>
                        <TableHead className="w-1/2">Nama Sub-Kriteria</TableHead>
                        <TableHead className="text-center w-1/6">Status Aktif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mergedSubKriteria.map((item) => (
                        <TableRow key={item.sub_kriteria_global_id}>
                          <TableCell className="font-medium">{item.nama_kriteria_utama}</TableCell>
                          <TableCell className="text-muted-foreground">{item.nama_sub_kriteria}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Switch
                                id={`sub-criteria-${item.sub_kriteria_global_id}`}
                                checked={item.aktif}
                                onCheckedChange={(checked) => handleSubCriterionToggle(item.sub_kriteria_global_id, checked)}
                                disabled={!isAuthorizedToEdit} // Disable jika tidak diizinkan
                              />
                              <Label htmlFor={`sub-criteria-${item.sub_kriteria_global_id}`} className="text-sm">
                                {item.aktif ? 'Aktif' : 'Tidak Aktif'}
                              </Label>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Action Buttons - Moved to header, keeping this section for PM link if needed */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div>
              <h3 className="font-semibold text-foreground">Langkah Selanjutnya</h3>
              <p className="text-sm text-muted-foreground">
                Setelah mengkonfigurasi kriteria, lanjutkan ke setup AHP atau Profile Matching.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link to={`/admin/pekerjaan/${jobId}/ahp`}>
                <Button variant="outline">
                  Setup AHP
                </Button>
              </Link>
              <Link to={`/admin/pekerjaan/${jobId}/pm`}>
                <Button variant="outline">
                  Setup Profile Matching
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobCriteriaToggle;