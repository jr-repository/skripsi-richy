import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Save,
  Calculator,
  CheckCircle,
  Loader2, // For loading spinner
  AlertCircle,
  X // For closing modal
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';

// Interfaces from KODE 1
interface Kriteria {
  id: number;
  nama_kriteria: string;
}

interface MatriksEntry {
  kriteria_id_1: number;
  kriteria_id_2: number;
  nilai: number;
}

interface AHPResult {
  matriks_perbandingan: { kriteria_id: number; nama_kriteria: string; [key: string]: number | string }[];
  jumlah_kolom_matriks: { [kriteria_id: string]: number };
  matriks_normalisasi: { kriteria_id: number; nama_kriteria: string; [key: string]: number | string }[];
  vektor_prioritas: { [kriteria_id: string]: number };
  lambda_values: { [kriteria_id: string]: number };
  lambda_max: number;
  ci_value: number;
  cr_value: number;
  is_consistent: boolean;
  final_bobot: { [kriteria_id: string]: number };
  message?: string;
}

const API_BASE_URL = 'https://sipemalem.my.id/backend-rekomendasi-karir';
// SAATY_SCALE is used to define the fixed options, so it can include intermediate values.
const SAATY_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const importanceScale = [
  { value: 1, label: 'Sama penting', description: '1' },
  { value: 2, label: 'Antara Sama Penting & Sedikit Lebih Penting', description: '2' },
  { value: 3, label: 'Sedikit lebih penting', description: '3' },
  { value: 4, label: 'Antara Sedikit Lebih Penting & Lebih Penting', description: '4' },
  { value: 5, label: 'Lebih penting', description: '5' },
  { value: 6, label: 'Antara Lebih Penting & Sangat Lebih Penting', description: '6' },
  { value: 7, label: 'Sangat lebih penting', description: '7' },
  { value: 8, label: 'Antara Sangat Lebih Penting & Mutlak Lebih Penting', description: '8' },
  { value: 9, label: 'Mutlak lebih penting', description: '9' }
];


const AHPSetup: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [jobName, setJobName] = useState<string>('');
  // key: "k1_k2", value: Saaty score
  const [comparisonValues, setComparisonValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [ahpCalculationResult, setAhpCalculationResult] = useState<AHPResult | null>(null);
  const [jobAdminId, setJobAdminId] = useState<number | null>(null);
  const [activeCriteria, setActiveCriteria] = useState<Kriteria[]>([]);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState<boolean>(false); // State untuk modal hasil

  const adminDataString = localStorage.getItem('adminAuth');
  const adminData = adminDataString ? JSON.parse(adminDataString) : {};
  const userRole = adminData.role;
  const loggedInAdminId = adminData.userId;

  // Cek otorisasi
  const isAuthorizedToEdit = jobAdminId === loggedInAdminId || userRole === 'superadmin';

  // Fetch job details
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

  // Fetch active criteria for the job
  const fetchActiveCriteria = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan_kriteria/${id}`);
      // Check for 404 specifically as it means no active criteria, not necessarily an error
      if (!response.ok && response.status !== 404) throw new Error(`HTTP error! status: ${response.status}`);
      const data: { kriteria_id: number; nama_kriteria: string; aktif: boolean }[] = response.status === 404 ? [] : await response.json();
      const active = data.filter(c => c.aktif).map(c => ({ id: c.kriteria_id, nama_kriteria: c.nama_kriteria }));
      setActiveCriteria(active);
      if (active.length < 2) {
        toast({
          title: "Kriteria Kurang",
          description: "Dibutuhkan minimal 2 kriteria aktif untuk perhitungan AHP. Silakan atur kriteria.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Gagal mengambil kriteria aktif:", error);
      toast({
        title: "Gagal Memuat Kriteria",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch previously saved comparison values
  const fetchSavedComparisons = useCallback(async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ahp/matriks_perbandingan/${id}`);
      // Check for 404 specifically as it means no saved comparisons, not necessarily an error
      if (!response.ok && response.status !== 404) throw new Error(`HTTP error! status: ${response.status}`);
      const data: MatriksEntry[] = response.status === 404 ? [] : await response.json();
      const initialComparisons: Record<string, number> = {};
      data.forEach(item => {
        initialComparisons[`${item.kriteria_id_1}_${item.kriteria_id_2}`] = item.nilai;
      });
      setComparisonValues(initialComparisons);
    } catch (error: any) {
      console.error("Gagal mengambil perbandingan tersimpan:", error);
      toast({
        title: "Gagal Memuat Perbandingan",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch saved AHP weights (final_bobot)
  const fetchAHPBobot = useCallback(async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ahp/hasil_bobot/${id}`);
      // Check for 404 specifically as it means no saved bobot, not necessarily an error
      if (!response.ok && response.status !== 404) throw new Error(`HTTP error! status: ${response.status}`);
      if (response.status !== 404) {
        const data = await response.json();
        if (data && data.length > 0) {
          const firstEntry = data[0];
          const finalBobot: { [kriteria_id: string]: number } = {};
          const vektorPrioritas: { [kriteria_id: string]: number } = {};
          // Initialize empty for full AHPResult structure; backend might provide these
          const matriksNormalisasi: { kriteria_id: number; nama_kriteria: string; [key: string]: number | string }[] = [];
          const matriksPerbandingan: { kriteria_id: number; nama_kriteria: string; [key: string]: number | string }[] = [];
          const jumlahKolomMatriks: { [kriteria_id: string]: number } = {};

          data.forEach((item: any) => {
            finalBobot[item.kriteria_id] = parseFloat(item.bobot);
            vektorPrioritas[item.kriteria_id] = parseFloat(item.bobot); // Assuming vektor_prioritas is also final_bobot if only bobot is stored
          });

          setAhpCalculationResult({
            matriks_perbandingan: matriksPerbandingan, // Data for this part is not available from the /hasil_bobot endpoint directly
            jumlah_kolom_matriks: jumlahKolomMatriks, // Data for this part is not available from the /hasil_bobot endpoint directly
            matriks_normalisasi: matriksNormalisasi,    // Data for this part is not available from the /hasil_bobot endpoint directly
            vektor_prioritas: vektorPrioritas,
            lambda_values: {}, // Not stored in bobot endpoint
            lambda_max: parseFloat(firstEntry.lambda_max),
            ci_value: parseFloat(firstEntry.ci_value),
            cr_value: parseFloat(firstEntry.cr_value),
            is_consistent: firstEntry.is_consistent === 1, // MySQL boolean (tinyint) to boolean
            final_bobot: finalBobot,
            message: "Hasil AHP yang tersimpan."
          });
        }
      }
    } catch (error: any) {
      console.error("Gagal mengambil bobot AHP tersimpan:", error);
      toast({
        title: "Gagal Memuat Bobot AHP",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);


  useEffect(() => {
    if (jobId) {
      const parsedJobId = parseInt(jobId);
      // Fetch all necessary data when component mounts or jobId changes
      fetchJobDetails(parsedJobId);
      fetchActiveCriteria(parsedJobId);
      fetchSavedComparisons(parsedJobId);
      fetchAHPBobot(parsedJobId);
    }
  }, [jobId, fetchJobDetails, fetchActiveCriteria, fetchSavedComparisons, fetchAHPBobot]);

  // Handler for changing a comparison value
  const handleComparisonChange = (kriteria1Id: number, kriteria2Id: number, value: number) => {
    if (!isAuthorizedToEdit) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mengedit pekerjaan ini.",
        variant: "destructive",
      });
      return;
    }
    const newComparisons = { ...comparisonValues };
    newComparisons[`${kriteria1Id}_${kriteria2Id}`] = value;
    newComparisons[`${kriteria2Id}_${kriteria1Id}`] = 1 / value; // Reciprocal value
    setComparisonValues(newComparisons);
    setAhpCalculationResult(null); // Clear previous results if comparisons change, indicating need for re-calculation
  };

  // Prepare data for saving comparison matrix (Memoized for performance)
  const getComparisonMatrixForSave = useMemo(() => {
    if (activeCriteria.length === 0) return [];
    const matrixForSave: MatriksEntry[] = [];
    for (let i = 0; i < activeCriteria.length; i++) {
      for (let j = i + 1; j < activeCriteria.length; j++) { // Only upper triangle to avoid duplicates
        const k1 = activeCriteria[i];
        const k2 = activeCriteria[j];
        const key = `${k1.id}_${k2.id}`;

        let value = comparisonValues[key] || 1; // Default to 1 if not set
        matrixForSave.push({ kriteria_id_1: k1.id, kriteria_id_2: k2.id, nilai: value });
        matrixForSave.push({ kriteria_id_1: k2.id, kriteria_id_2: k1.id, nilai: 1 / value }); // Add reciprocal for symmetry
      }
    }
    // Add diagonal elements (self-comparison, always 1)
    activeCriteria.forEach(k => {
      matrixForSave.push({ kriteria_id_1: k.id, kriteria_id_2: k.id, nilai: 1 });
    });
    return matrixForSave;
  }, [activeCriteria, comparisonValues]);

  // Function to save the comparison matrix to the DB
  const handleSaveMatrix = async () => {
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
        description: "Tidak dapat menyimpan matriks perbandingan.",
        variant: "destructive",
      });
      return;
    }
    if (activeCriteria.length < 2) {
      toast({
        title: "Kriteria Kurang",
        description: "Dibutuhkan minimal 2 kriteria aktif untuk membuat matriks.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/ahp/matriks_perbandingan?adminId=${loggedInAdminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pekerjaan_id: parseInt(jobId),
          matriks: getComparisonMatrixForSave,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: 'Matriks Perbandingan Disimpan',
        description: 'Matriks perbandingan berhasil disimpan.',
        variant: "default",
      });
    } catch (error: any) {
      console.error("Gagal menyimpan matriks perbandingan:", error);
      toast({
        title: "Gagal Menyimpan Matriks",
        description: `Terjadi kesalahan saat menyimpan matriks: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Function to calculate and save AHP
  const handleCalculateAndSaveAHP = async () => {
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
        description: "Tidak dapat menghitung AHP.",
        variant: "destructive",
      });
      return;
    }
    if (activeCriteria.length < 2) {
      toast({
        title: "Kriteria Kurang",
        description: "Dibutuhkan minimal 2 kriteria aktif untuk perhitungan AHP.",
        variant: "destructive",
      });
      return;
    }

    // Basic check if all necessary comparisons are made
    let allComparisonsSet = true;
    for (let i = 0; i < activeCriteria.length; i++) {
      for (let j = i + 1; j < activeCriteria.length; j++) {
        const k1 = activeCriteria[i];
        const k2 = activeCriteria[j];
        const key = `${k1.id}_${k2.id}`;
        // Check if the comparison value is explicitly set (not just default 1)
        if (comparisonValues[key] === undefined || comparisonValues[key] === 0) { // Consider 0 also as unset/invalid
          allComparisonsSet = false;
          break;
        }
      }
      if (!allComparisonsSet) break;
    }

    if (!allComparisonsSet) {
      toast({
        title: "Matriks Perbandingan Belum Lengkap",
        description: "Silakan isi semua perbandingan antar kriteria sebelum menghitung AHP.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ahp/hitung_dan_simpan/${parseInt(jobId)}?adminId=${loggedInAdminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: AHPResult = await response.json();
      setAhpCalculationResult(result);
      setIsResultsModalOpen(true); // Open the results modal
      toast({
        title: 'Perhitungan AHP Berhasil',
        description: result.message || 'Perhitungan AHP berhasil dan bobot disimpan.',
        variant: "default",
      });
    } catch (error: any) {
      console.error("Gagal menghitung dan menyimpan AHP:", error);
      toast({
        title: "Gagal Menghitung AHP",
        description: `Terjadi kesalahan saat menghitung AHP: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-foreground">Setup AHP</h1>
            <p className="text-muted-foreground">Konfigurasi Analytical Hierarchy Process untuk: <span className="font-medium text-foreground">{jobName || 'Memuat...'}</span></p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={handleCalculateAndSaveAHP}
            className="flex items-center"
            disabled={loading || activeCriteria.length < 2 || !isAuthorizedToEdit}
            type="button" // Ensure it's a button, not submit
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
            {loading ? 'Menghitung...' : 'Hitung & Simpan Bobot'}
          </Button>
          <Button
            onClick={handleSaveMatrix}
            variant="outline"
            className="flex items-center"
            disabled={loading || activeCriteria.length < 2 || !isAuthorizedToEdit}
            type="button" // Ensure it's a button, not submit
          >
            <Save className="h-4 w-4 mr-2" />
            Simpan Perbandingan
          </Button>
          {ahpCalculationResult && (
            <Button
              onClick={() => setIsResultsModalOpen(true)}
              variant="outline"
              className={`flex items-center relative ${!ahpCalculationResult.is_consistent ? 'border-red-500 text-red-500' : ''}`}
            >
              Lihat Hasil AHP
              {!ahpCalculationResult.is_consistent && (
                <AlertCircle className="absolute -top-1 -right-1 h-4 w-4 text-red-500 fill-red-500" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Pairwise Comparisons */}
      {loading ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Memuat kriteria...</span>
          </CardContent>
        </Card>
      ) : activeCriteria.length < 2 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="py-10 text-center text-muted-foreground">
            Tidak ada cukup kriteria aktif untuk melakukan perhitungan AHP. Silakan atur kriteria di
            <Link to={`/admin/pekerjaan/${jobId}/kriteria`} className="text-primary hover:underline ml-1">Atur Kriteria</Link>.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Perbandingan Berpasangan</CardTitle>
            <CardDescription>Bandingkan kepentingan antar kriteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Kriteria</TableHead>
                    {activeCriteria.map(col => (
                      <TableHead key={col.id} className="text-center">{col.nama_kriteria}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeCriteria.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.nama_kriteria}</TableCell>
                      {activeCriteria.map(col => (
                        <TableCell key={col.id} className="text-center">
                          {row.id === col.id ? (
                            <span className="font-bold text-foreground">1</span>
                          ) : row.id < col.id ? (
                            <Select
                              value={(comparisonValues[`${row.id}_${col.id}`] || 1).toString()}
                              onValueChange={(value) => handleComparisonChange(row.id, col.id, parseFloat(value))}
                              disabled={!isAuthorizedToEdit} // Disable jika tidak diizinkan
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih nilai" />
                              </SelectTrigger>
                              <SelectContent>
                                {importanceScale.map(val => (
                                  <SelectItem key={val.value} value={val.value.toString()}>
                                    {val.description} - {val.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground">
                              {(1 / (comparisonValues[`${col.id}_${row.id}`] || 1)).toFixed(4)}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Tables (Outside Modal) */}
      {ahpCalculationResult && (
        <>
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">1. Tabel Matriks Perbandingan (Desimal)</CardTitle>
              <CardDescription>Tabel matriks perbandingan dari input Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Kriteria</TableHead>
                      {activeCriteria.map(c => <TableHead key={c.id} className="text-center">{c.nama_kriteria}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ahpCalculationResult && ahpCalculationResult.matriks_perbandingan && ahpCalculationResult.matriks_perbandingan.length > 0 ? (
                      ahpCalculationResult.matriks_perbandingan.map(row => (
                        <TableRow key={row.kriteria_id}>
                          <TableCell className="font-medium">{row.nama_kriteria}</TableCell>
                          {activeCriteria.map(col => (
                            <TableCell key={col.id} className="text-center">{parseFloat(row[col.id] as string).toFixed(4)}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={activeCriteria.length + 1} className="text-center text-muted-foreground py-4">
                          Data matriks perbandingan tidak tersedia.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">2. Jumlah Kolom Matriks</CardTitle>
              <CardDescription>Jumlah total setiap kolom dari matriks perbandingan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      {activeCriteria.map(c => <TableHead key={c.id} className="text-center">{c.nama_kriteria}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ahpCalculationResult && Object.keys(ahpCalculationResult.jumlah_kolom_matriks).length > 0 ? (
                      <TableRow>
                        {activeCriteria.map(c => (
                          <TableCell key={c.id} className="text-center">{ahpCalculationResult.jumlah_kolom_matriks[c.id]?.toFixed(4)}</TableCell>
                        ))}
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={activeCriteria.length} className="text-center text-muted-foreground py-4">
                          Data jumlah kolom matriks tidak tersedia.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">3. Tabel Normalisasi Matriks</CardTitle>
              <CardDescription>Matriks perbandingan yang telah dinormalisasi.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Kriteria</TableHead>
                      {activeCriteria.map(c => <TableHead key={c.id} className="text-center">{c.nama_kriteria}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ahpCalculationResult && ahpCalculationResult.matriks_normalisasi && ahpCalculationResult.matriks_normalisasi.length > 0 ? (
                      ahpCalculationResult.matriks_normalisasi.map(row => (
                        <TableRow key={row.kriteria_id}>
                          <TableCell className="font-medium">{row.nama_kriteria}</TableCell>
                          {activeCriteria.map(col => (
                            <TableCell key={col.id} className="text-center">{parseFloat(row[col.id] as string).toFixed(4)}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={activeCriteria.length + 1} className="text-center text-muted-foreground py-4">
                          Data matriks normalisasi tidak tersedia.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">4. Hasil Perhitungan Vektor Prioritas (Bobot Prioritas Awal)</CardTitle>
              <CardDescription>Rata-rata dari nilai normalisasi tiap baris.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Kriteria</TableHead>
                      <TableHead className="text-center">Bobot Prioritas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ahpCalculationResult && Object.keys(ahpCalculationResult.vektor_prioritas).length > 0 ? (
                      activeCriteria.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.nama_kriteria}</TableCell>
                          <TableCell className="text-center">{ahpCalculationResult.vektor_prioritas[c.id]?.toFixed(4)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                          Data vektor prioritas tidak tersedia.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      

      {/* Modal for AHP Results */}
      <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
        <DialogContent className="max-w-[700px] w-[95vw] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
              Hasil Perhitungan AHP
            </DialogTitle>
            <DialogDescription>
              Detail perhitungan bobot kriteria dan uji konsistensi.
            </DialogDescription>
          </DialogHeader>
          {ahpCalculationResult && (
            <div className="space-y-6">
              {/* Lambda Max & Consistency */}
              <div className="p-4 bg-muted/30 rounded-lg border-border border">
                <h4 className="font-semibold text-foreground mb-4">5. Perhitungan Lambda Max (λ<sub>max</sub>) dan Hasil Uji Konsistensi (CI & CR)</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-card p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">Lambda Max (λ<sub>max</sub>)</p>
                    <span className="font-semibold text-foreground text-lg">
                      {ahpCalculationResult.lambda_max?.toFixed(4)}
                    </span>
                  </div>
                  <div className="bg-card p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">CI (Consistency Index)</p>
                    <span className="font-semibold text-foreground text-lg">
                      {ahpCalculationResult.ci_value?.toFixed(4)}
                    </span>
                  </div>
                  <div className="bg-card p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground">CR (Consistency Ratio)</p>
                    <span className="font-semibold text-foreground text-lg">
                      {ahpCalculationResult.cr_value?.toFixed(4)}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={ahpCalculationResult.is_consistent ? 'default' : 'destructive'}
                  className={`mt-4 text-sm px-4 py-2 ${ahpCalculationResult.is_consistent
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {ahpCalculationResult.is_consistent ? 'Konsisten (CR ≤ 0.1)' : 'Tidak Konsisten (CR > 0.1), perlu revisi perbandingan.'}
                </Badge>
              </div>

              {/* Final Bobot */}
              <div>
                <h4 className="font-semibold text-foreground mb-4">6. Hasil Akhir Bobot Prioritas AHP</h4>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40">Kriteria</TableHead>
                        <TableHead className="text-center">Bobot Prioritas Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ahpCalculationResult && Object.keys(ahpCalculationResult.final_bobot).length > 0 ? (
                        activeCriteria.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.nama_kriteria}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center space-x-2 justify-center">
                                <div className="w-24 bg-muted rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full gradient-blue"
                                    style={{ width: `${Math.max(0, (ahpCalculationResult.final_bobot[c.id] || 0) * 100)}%` }}
                                  />
                                </div>
                                <Badge variant="outline" className="text-blue-400 border-blue-400">
                                  {((ahpCalculationResult.final_bobot[c.id] || 0) * 100).toFixed(1)}%
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                            Data bobot final tidak tersedia.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button onClick={() => setIsResultsModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-6 flex justify-start">
        <Button onClick={() => navigate(`/admin`)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  );
};

export default AHPSetup;
