import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import { Input } from '@/components/ui/input'; // Although not used for direct input in this version, kept for completeness of shared components
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
  Calculator, // Using Calculator for PM calculation button
  Loader2, // For loading spinner
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Sub-kriteria yang diaktifkan untuk pekerjaan ini, dengan nilai idealnya
interface JobSubCriterionDetail {
  id: number; // id from pekerjaan_sub_kriteria_detail table
  pekerjaan_id: number;
  sub_kriteria_global_id: number;
  nama_sub_kriteria: string;
  kode_sub_kriteria: string;
  kriteria_global_id: number;
  nama_kriteria: string; // Nama kriteria utama dari join
  aktif: number; // 0 or 1, should always be 1 here because we filter for active ones
  nilai_ideal: number;
}

interface PMCalculationResult {
  // Define precise types based on backend response for 'perhitungan_gap_bobot_nilai'
  perhitungan_gap_bobot_nilai: {
    nama_kriteria: string;
    nama_sub_kriteria: string;
    nilai_ideal_pekerjaan: number;
    nilai_aktual_asumsi: number; // This would typically be a candidate's actual score, but here it's 5 for ideal profile
    gap: number;
    bobot_nilai: number;
  }[];
  perhitungan_nilai_total_aspek: { kriteria_id: number; nama_kriteria: string; nilai_aspek: number }[];
  nilai_akhir_total_pm: number;
  message?: string;
}

const API_BASE_URL = 'http://sipemalem.my.id/backend-rekomendasi-karir';
const SKALA_PENILAIAN = [1, 2, 3, 4, 5]; // Skala 1-5 untuk nilai ideal

const PMSetup: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [jobName, setJobName] = useState<string>('');
  // Hanya ambil sub-kriteria yang aktif untuk pekerjaan ini dari pekerjaan_sub_kriteria_detail
  const [activeJobSubCriteria, setActiveJobSubCriteria] = useState<JobSubCriterionDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pmCalculationResult, setPmCalculationResult] = useState<PMCalculationResult | null>(null);
  const [jobAdminId, setJobAdminId] = useState<number | null>(null);
  const adminDataString = localStorage.getItem('adminAuth');
  const adminData = adminDataString ? JSON.parse(adminDataString) : {};
  const userRole = adminData.role;
  const loggedInAdminId = adminData.userId;
  
  // Cek otorisasi
  const isAuthorizedToEdit = jobAdminId === loggedInAdminId || userRole === 'superadmin';

  // --- Fetching Functions ---
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

  const fetchActiveJobSubCriteria = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan_sub_kriteria_detail/active/${id}`);
      if (!response.ok && response.status !== 404) throw new Error(`HTTP error! status: ${response.status}`);
      const data: JobSubCriterionDetail[] = response.status === 404 ? [] : await response.json();
      setActiveJobSubCriteria(data);
    } catch (error: any) {
      console.error("Gagal mengambil sub-kriteria aktif pekerjaan:", error);
      toast({
        title: "Gagal Memuat Sub-Kriteria Aktif",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (jobId) {
      const parsedJobId = parseInt(jobId);
      fetchJobDetails(parsedJobId);
      fetchActiveJobSubCriteria(parsedJobId);
    }
  }, [jobId, fetchJobDetails, fetchActiveJobSubCriteria]);

  // --- Handlers ---
  const handleIdealValueChange = async (pskdId: number, newValue: number) => {
    if (!isAuthorizedToEdit) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mengedit pekerjaan ini.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan_sub_kriteria_detail/${pskdId}/nilai_ideal?adminId=${loggedInAdminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nilai_ideal: newValue }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      toast({
        title: "Nilai Ideal Diperbarui",
        description: 'Nilai ideal berhasil diperbarui.',
        variant: "default"
      });
      // Update state local for immediate UI feedback
      setActiveJobSubCriteria(prev => prev.map(item =>
        item.id === pskdId ? { ...item, nilai_ideal: newValue } : item
      ));
      setPmCalculationResult(null); // Clear previous calculation result if ideal values change
    } catch (error: any) {
      console.error("Gagal memperbarui nilai ideal:", error);
      toast({
        title: "Gagal Memperbarui Nilai Ideal",
        description: `Gagal memperbarui nilai ideal: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleCalculateAndSavePM = async () => {
    if (!isAuthorizedToEdit) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mengedit pekerjaan ini.",
        variant: "destructive",
      });
      return;
    }
    if (!jobId) {
      toast({
        title: "ID Pekerjaan Tidak Ditemukan",
        description: "Tidak dapat menghitung Profile Matching.",
        variant: "destructive",
      });
      return;
    }
    if (activeJobSubCriteria.length === 0) {
      toast({
        title: "Sub-Kriteria Tidak Ada",
        description: "Tidak ada sub-kriteria aktif untuk pekerjaan ini. Harap atur di 'Atur Kriteria'.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pm/hitung_dan_simpan/${parseInt(jobId)}?adminId=${loggedInAdminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: PMCalculationResult = await response.json();
      setPmCalculationResult(result);
      toast({
        title: "Perhitungan PM Berhasil",
        description: result.message || 'Perhitungan Profile Matching berhasil dan nilai akhir disimpan.',
        variant: "default"
      });
    } catch (error: any) {
      console.log("Error response:", await error.response?.json());
      console.error("Gagal menghitung dan menyimpan PM:", error);
      toast({
        title: "Gagal Menghitung PM",
        description: `Gagal menghitung Profile Matching: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Memoized data for the grouped table
  const groupedSubCriteria = useMemo(() => {
    const grouped: { [key: number]: JobSubCriterionDetail[] } = {};
    activeJobSubCriteria.forEach(sk => {
      if (!grouped[sk.kriteria_global_id]) {
        grouped[sk.kriteria_global_id] = [];
      }
      grouped[sk.kriteria_global_id].push(sk);
    });

    const sortedGroups = Object.values(grouped).map(group => {
      const kriteriaName = group[0]?.nama_kriteria || 'Kriteria Tidak Diketahui';
      const subCriteria = group.sort((a, b) => a.nama_sub_kriteria.localeCompare(b.nama_sub_kriteria));
      return { kriteriaName, subCriteria };
    }).sort((a, b) => a.kriteriaName.localeCompare(b.kriteriaName));
    
    return sortedGroups;
  }, [activeJobSubCriteria]);

  // Memoized grouped data for the calculation results table
  const groupedPmGapBobot = useMemo(() => {
    if (!pmCalculationResult?.perhitungan_gap_bobot_nilai) return [];

    const grouped: { nama_kriteria: string; sub_kriteria_list: any[] }[] = [];
    let currentKriteriaName: string | null = null;
    let currentGroup: any = null;

    pmCalculationResult.perhitungan_gap_bobot_nilai.forEach(item => {
      if (item.nama_kriteria !== currentKriteriaName) {
        // New group
        if (currentGroup) {
          grouped.push(currentGroup);
        }
        currentKriteriaName = item.nama_kriteria;
        currentGroup = {
          nama_kriteria: item.nama_kriteria,
          sub_kriteria_list: [item]
        };
      } else {
        // Add to existing group
        if (currentGroup) {
          currentGroup.sub_kriteria_list.push(item);
        }
      }
    });

    if (currentGroup) {
      grouped.push(currentGroup);
    }

    return grouped;
  }, [pmCalculationResult]);

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
          <Link to={`/admin/pekerjaan/${jobId}/kriteria`}>
            <Button variant="outline" size="sm" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Setup Profile Matching</h1>
            <p className="text-muted-foreground">Konfigurasi profil target untuk: <span className="font-medium text-foreground">{jobName || 'Memuat...'}</span></p>
          </div>
        </div>
        <Button
          onClick={handleCalculateAndSavePM}
          className="gradient-blue flex items-center"
          disabled={loading || activeJobSubCriteria.length === 0 || !isAuthorizedToEdit}
          type="button"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
          {loading ? 'Menghitung...' : 'Hitung & Simpan PM'}
        </Button>
      </div>

      {/* PM Theory Info */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Tentang Profile Matching</CardTitle>
          <CardDescription>
            Profile Matching adalah metode yang membandingkan profil individu dengan profil ideal pekerjaan
          </CardDescription>
        </CardHeader>
        {/* <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Core Factor (CF)</h4>
              <p className="text-sm text-muted-foreground">
                Faktor utama yang harus dimiliki untuk pekerjaan tertentu
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Secondary Factor (SF)</h4>
              <p className="text-sm text-muted-foreground">
                Faktor pendukung yang dapat menambah nilai
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Gap Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Analisis selisih antara profil kandidat dengan profil ideal
              </p>
            </div>
          </div>
        </CardContent> */}
      </Card>

      {/* Ideal Value Setup Table */}
      {loading ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Memuat sub-kriteria aktif...</span>
          </CardContent>
        </Card>
      ) : activeJobSubCriteria.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="py-10 text-center text-muted-foreground">
            Tidak ada sub-kriteria aktif yang ditemukan untuk pekerjaan ini.
            Pastikan Anda telah mengaktifkannya di halaman <Link to={`/admin/pekerjaan/${jobId}/kriteria`} className="text-primary hover:underline">"Atur Kriteria"</Link>.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Pengaturan Nilai Ideal Sub-Kriteria</CardTitle>
            <CardDescription>Pilih nilai ideal (1-5) untuk setiap sub-kriteria aktif.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kriteria Utama</TableHead>
                    <TableHead className="min-w-[150px]">Sub-Kriteria</TableHead>
                    <TableHead className="text-center min-w-[200px]">Nilai Ideal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedSubCriteria.map((group, groupIndex) => (
                    group.subCriteria.map((sub, subIndex) => (
                      <TableRow key={sub.id}>
                        {subIndex === 0 && (
                          <TableCell rowSpan={group.subCriteria.length} className="font-bold border-r">
                            {group.kriteriaName}
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{sub.nama_sub_kriteria}</TableCell>
                        <TableCell>
                          <Select
                            value={sub.nilai_ideal.toString()}
                            onValueChange={(value) => handleIdealValueChange(sub.id, parseInt(value))}
                            disabled={!isAuthorizedToEdit}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih Nilai Ideal" />
                            </SelectTrigger>
                            <SelectContent>
                              {SKALA_PENILAIAN.map(val => (
                                <SelectItem key={val} value={val.toString()}>{val}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PM Calculation Results */}
      {pmCalculationResult && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Asumsi Hasil Perhitungan Profile Matching (Profil Ideal Pekerjaan)</CardTitle>
            <CardDescription>
              Nilai ini merepresentasikan tingkat kesesuaian ideal pekerjaan ini dengan profil yang sempurna,
              menggunakan bobot AHP yang telah dihitung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Perhitungan Gap dan Bobot Nilai */}
              <div>
                <h4 className="font-semibold text-foreground mb-4">1. Perhitungan Gap dan Bobot Nilai (Profil Ideal Pekerjaan vs. Profil Ideal Pekerjaan)</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Kriteria Utama</TableHead>
                        <TableHead className="w-[200px]">Sub Kriteria</TableHead>
                        <TableHead className="text-center">Nilai Ideal Pekerjaan</TableHead>
                        <TableHead className="text-center">Nilai Aktual Asumsi (Ideal)</TableHead>
                        <TableHead className="text-center">Gap</TableHead>
                        <TableHead className="text-center">Bobot Nilai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedPmGapBobot.length > 0 ? (
                        groupedPmGapBobot.map((group, groupIndex) => (
                          group.sub_kriteria_list.map((row, rowIndex) => (
                            <TableRow key={groupIndex + '-' + rowIndex}>
                              {rowIndex === 0 && (
                                <TableCell rowSpan={group.sub_kriteria_list.length} className="font-medium border-r">
                                  {row.nama_kriteria}
                                </TableCell>
                              )}
                              <TableCell className="text-muted-foreground">{row.nama_sub_kriteria}</TableCell>
                              <TableCell className="text-center"><Badge variant="outline">{row.nilai_ideal_pekerjaan}</Badge></TableCell>
                              <TableCell className="text-center"><Badge variant="outline">{row.nilai_aktual_asumsi}</Badge></TableCell>
                              <TableCell className="text-center"><Badge variant="secondary">{row.gap > 0 ? '+' : ''}{row.gap}</Badge></TableCell>
                              <TableCell className="text-center"><Badge variant="default">{row.bobot_nilai}</Badge></TableCell>
                            </TableRow>
                          ))
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="py-4 text-center text-muted-foreground">Tidak ada data perhitungan gap dan bobot.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Perhitungan Nilai Total Aspek */}
              <div>
                <h4 className="font-semibold text-foreground mb-4">2. Perhitungan Nilai Total Aspek (Rata-rata Bobot Nilai Sub-Kriteria per Kriteria Utama)</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kriteria Utama</TableHead>
                        <TableHead className="text-center">Nilai Total Aspek</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pmCalculationResult.perhitungan_nilai_total_aspek.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.nama_kriteria}</TableCell>
                          <TableCell className="text-center"><Badge variant="default">{item.nilai_aspek.toFixed(4)}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Nilai Akhir Total PM */}
              <div>
                <h4 className="font-semibold text-foreground mb-4">3. Nilai Akhir Total Profile Matching (Kesesuaian Ideal Pekerjaan)</h4>
                <CardContent className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground flex justify-between items-center">
                    Nilai Akhir Total PM: <span className="font-semibold text-2xl text-primary">{pmCalculationResult.nilai_akhir_total_pm?.toFixed(4)}</span>
                  </p>
                </CardContent>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex justify-start">
        <Button onClick={() => navigate(`/admin`)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  );
};

export default PMSetup;
