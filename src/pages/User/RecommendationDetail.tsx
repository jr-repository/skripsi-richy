import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Loader2 } from "lucide-react"
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  BookOpen,
  Award,
  Search,
  Info,
  Calculator
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface UserInput {
  [subKriteriaId: number]: number;
}

interface PMGapBobotDetail {
  pekerjaan_id: number;
  kriteria_id: number;
  nama_kriteria: string;
  sub_kriteria_id: number;
  nama_sub_kriteria: string;
  nilai_ideal_pekerjaan: number;
  nilai_aktual_user: number | null;
  gap: number | null;
  bobot_nilai: number | null;
}

interface PMTotalAspekDetailEntry {
  kriteria_id: number;
  nama_kriteria: string;
  nilai_aspek: number;
}

interface JobStatistics {
  perhitungan_gap_bobot_nilai: PMGapBobotDetail[];
  perhitungan_nilai_total_aspek: PMTotalAspekDetailEntry[];
  nilai_akhir_total_pm: number;
  message?: string;
}

const API_STATISTICS_URL_BASE = 'https://support.antlia.id/api/statistics.php';
const API_BASE_URL = 'https://support.antlia.id/api';

const RecommendationDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const {
    userInput,
    jobName: navigatedJobName,
    jobDescription: navigatedJobDescription,
    jobSalary: navigatedJobSalary,
    pm_details: navigatedPmDetails
  } = (location.state || {}) as {
    userInput?: UserInput,
    jobName?: string,
    jobDescription?: string,
    jobSalary?: number,
    pm_details?: JobStatistics
  };

  const [jobName, setJobName] = useState<string>(navigatedJobName || '');
  const [jobDescription, setJobDescription] = useState<string>(navigatedJobDescription || '');
  const [jobSalary, setJobSalary] = useState<number>(navigatedJobSalary || 0);
  const [statistics, setStatistics] = useState<JobStatistics | null>(navigatedPmDetails || null);
  const [loading, setLoading] = useState<boolean>(true);

  // Function to fetch job details (fallback if not navigated with state)
  const fetchJobDetails = useCallback(async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pekerjaan/${id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setJobName(data.nama);
      setJobDescription(data.deskripsi);
      setJobSalary(data.rata_rata_gaji);
    } catch (error: any) {
      console.error("Gagal mengambil detail pekerjaan:", error);
      toast({
        title: "Gagal Memuat Detail Pekerjaan",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Function to fetch job statistics
  const fetchJobStatistics = useCallback(async (id: number, userInputs: UserInput) => {
    setLoading(true);
    console.log('Mengambil statistik untuk jobId:', id, 'dengan input pengguna:', userInputs);
    try {
      const response = await fetch(`${API_STATISTICS_URL_BASE}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_kriteria_nilai: userInputs }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Data error dari API statistik (raw):", errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: JobStatistics = await response.json();
      console.log('Data statistik yang diterima:', data);

      const processedData: JobStatistics = {
        ...data,
        perhitungan_gap_bobot_nilai: data.perhitungan_gap_bobot_nilai || [],
        perhitungan_nilai_total_aspek: data.perhitungan_nilai_total_aspek || [],
      };
      setStatistics(processedData);
    } catch (error: any) {
      console.error("Gagal mengambil statistik perhitungan:", error);
      toast({
        title: "Gagal Memuat Statistik",
        description: `Gagal memuat statistik: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (jobId) {
      const parsedJobId = parseInt(jobId);
      if (!navigatedJobName) {
        fetchJobDetails(parsedJobId);
      }
      const shouldFetchStats = !navigatedPmDetails ||
        !Array.isArray(navigatedPmDetails.perhitungan_gap_bobot_nilai) ||
        !Array.isArray(navigatedPmDetails.perhitungan_nilai_total_aspek) ||
        (navigatedPmDetails.perhitungan_gap_bobot_nilai.length === 0 &&
         navigatedPmDetails.perhitungan_nilai_total_aspek.length === 0);

      if (shouldFetchStats) {
        fetchJobStatistics(parsedJobId, userInput || {});
      } else {
        setLoading(false);
      }
    }
  }, [jobId, userInput, navigatedJobName, navigatedPmDetails, fetchJobDetails, fetchJobStatistics]);

  const matchPercentageValue = statistics?.nilai_akhir_total_pm ? ((statistics.nilai_akhir_total_pm / 5) * 100) : 0;
  const matchPercentage = matchPercentageValue.toFixed(1);

  const matchClass = useMemo(() => {
    const score = statistics?.nilai_akhir_total_pm || 0;
    if (score >= 4.5) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 3.5) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }, [statistics]);

  const matchLabel = useMemo(() => {
    const score = statistics?.nilai_akhir_total_pm || 0;
    if (score >= 4.5) return 'Sangat Cocok';
    if (score >= 3.5) return 'Cocok';
    return 'Cukup Cocok';
  }, [statistics]);

  const getGapColor = (gap: number | null) => {
    if (gap === null) return 'text-muted-foreground';
    if (gap === 0) return 'text-green-400';
    if (Math.abs(gap) === 1) return 'text-blue-400';
    return 'text-red-400';
  };

  const handleApplyNow = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, currentMonth, 1);
    const formattedStartDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, currentMonth + 1, 0);
    const formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
    const query = `site:linkedin.com/jobs "${jobName}" Yogyakarta after:${formattedStartDate} before:${formattedEndDate}`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(googleSearchUrl, '_blank');
  };

  // Grouping logic for the table, memoized for performance
  const groupedGapBobot = useMemo(() => {
    if (!statistics?.perhitungan_gap_bobot_nilai) return [];

    const grouped: { kriteria_id: number; nama_kriteria: string; sub_kriteria_list: PMGapBobotDetail[] }[] = [];
    let currentKriteriaId: number | null = null;
    let currentGroup: any = null;

    statistics.perhitungan_gap_bobot_nilai.forEach(item => {
      if (item.kriteria_id !== currentKriteriaId) {
        // New group
        if (currentGroup) {
          grouped.push(currentGroup);
        }
        currentKriteriaId = item.kriteria_id;
        currentGroup = {
          kriteria_id: item.kriteria_id,
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
  }, [statistics]);

  if (!jobId) {
    return (
      <div className="p-6 bg-background min-h-screen flex flex-col items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center">
          <CardTitle className="text-destructive mb-4">Kesalahan</CardTitle>
          <CardDescription>ID Pekerjaan tidak ditemukan. Silakan kembali ke halaman rekomendasi.</CardDescription>
          <Button onClick={() => navigate('/user')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Rekomendasi
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
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{jobName || 'Memuat Pekerjaan...'}</h1>
            <p className="text-muted-foreground">{jobDescription || 'Memuat Deskripsi...'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <span className="text-2xl font-bold text-foreground">{matchPercentage}%</span>
          <Badge className={matchClass}>
            {matchLabel}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">

          {/* Calculation Statistics Table */}
          {loading ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Memuat statistik perhitungan...</span>
              </CardContent>
            </Card>
          ) : (statistics === null ||
              (statistics.perhitungan_gap_bobot_nilai.length === 0 &&
               statistics.perhitungan_nilai_total_aspek.length === 0)) ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="py-10 text-center text-muted-foreground">
                Statistik belum tersedia untuk pekerjaan ini. Pastikan konfigurasi PM telah dihitung oleh admin.
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Detail Perhitungan Skor
                </CardTitle>
                <CardDescription>Statistik perhitungan menggunakan metode Profile Matching</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Nilai Rekomendasi Akhir */}
                <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-primary mb-2">Nilai Rekomendasi Akhir Pekerjaan Ini</h3>
                    <p className="text-foreground text-lg">
                      Nilai kesesuaian Anda dengan pekerjaan ini adalah:
                      <span className="font-extrabold text-2xl ml-2 text-primary">{statistics.nilai_akhir_total_pm?.toFixed(4)}</span>
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">
                      (Skor ini dihitung berdasarkan input Anda, bobot AHP pekerjaan ini, dan profil ideal pekerjaan.)
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-4 sm:mt-0">
                    <Button className="flex items-center justify-center gradient-blue" onClick={handleApplyNow} type="button">
                      <Search className="h-4 w-4 mr-2" />
                      Cari Lowongan
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center justify-center">
                          <Info className="h-4 w-4 mr-2" />
                          Detail
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Detail Pekerjaan</DialogTitle>
                          <DialogDescription>
                            Informasi lebih lanjut mengenai pekerjaan, gaji, persyaratan, dan fasilitas.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4"> 
                          {/* Salary Info */}
                          <div>
                            <h4 className="flex items-center font-semibold text-foreground mb-2">
                              <TrendingUp className="h-5 w-5 mr-2" /> Informasi Gaji
                            </h4>
                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                              <div className="text-2xl font-bold text-blue-400 mb-2">
                                Rp {jobSalary?.toLocaleString('id-ID') || 'N/A'}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Rata-rata gaji untuk posisi ini
                              </p>
                              <p className="text-muted-foreground text-sm">{jobDescription || 'Memuat deskripsi...'}</p>
                              <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                                Fresh Graduate Friendly
                              </Badge>

                            </div>
                          </div>
                          
                          {/* Requirements */}
                          <div>
                            <h4 className="flex items-center font-semibold text-foreground mb-2">
                              <BookOpen className="h-5 w-5 mr-2" /> Persyaratan
                            </h4>
                            <ul className="space-y-3 p-4 bg-muted/30 rounded-lg">
                              <li className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">Minimal S1 Teknik Informatika atau bidang terkait</span>
                              </li>
                              <li className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">Kemampuan problem solving yang baik</span>
                              </li>
                              <li className="flex items-start space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">Komunikasi dan kerjasama tim yang efektif</span>
                              </li>
                            </ul>
                          </div>

                          {/* Benefits */}
                          <div>
                            <h4 className="flex items-center font-semibold text-foreground mb-2">
                              <Award className="h-5 w-5 mr-2" /> Tunjangan & Fasilitas
                            </h4>
                            <div className="grid md:grid-cols-1 gap-3 p-4 bg-muted/30 rounded-lg">
                              <div className="flex items-center space-x-3 p-2 rounded-lg bg-card border">
                                <CheckCircle className="h-4 w-4 text-blue-400" />
                                <span className="text-foreground">Gaji kompetitif + bonus performance</span>
                              </div>
                              <div className="flex items-center space-x-3 p-2 rounded-lg bg-card border">
                                <CheckCircle className="h-4 w-4 text-blue-400" />
                                <span className="text-foreground">Asuransi kesehatan keluarga</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Hasil Perhitungan Gap dan Bobot Nilai */}
                <div className="mb-6 overflow-x-auto rounded-lg border border-border">
                  <h4 className="text-md font-semibold text-foreground mb-4 p-4 bg-muted/20 border-b border-border">1. Perhitungan Gap dan Bobot Nilai (Profil Aktual Anda vs. Profil Ideal Pekerjaan)</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Kriteria Utama</TableHead>
                        <TableHead className="w-[200px]">Sub Kriteria</TableHead>
                        <TableHead className="text-center">Ideal Pekerjaan</TableHead>
                        <TableHead className="text-center">Anda</TableHead>
                        <TableHead className="text-center">Gap</TableHead>
                        <TableHead className="text-center">Bobot Nilai</TableHead>
                        <TableHead className="text-center">Persentase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedGapBobot.length > 0 ? (
                        groupedGapBobot.map((group, groupIndex) => (
                          group.sub_kriteria_list.map((row, rowIndex) => (
                            <TableRow key={row.sub_kriteria_id}>
                              {rowIndex === 0 && (
                                <TableCell rowSpan={group.sub_kriteria_list.length} className="font-bold border-r">
                                  {row.nama_kriteria}
                                </TableCell>
                              )}
                              <TableCell className="text-muted-foreground">{row.nama_sub_kriteria}</TableCell>
                              <TableCell className="text-center"><Badge variant="outline">{row.nilai_ideal_pekerjaan}</Badge></TableCell>
                              <TableCell className="text-center">
                                {row.nilai_aktual_user !== null ? <Badge variant="secondary">{row.nilai_aktual_user}</Badge> : <span className="italic text-muted-foreground">N/A</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.gap !== null ? <Badge variant="secondary" className={getGapColor(row.gap)}>{row.gap > 0 ? '+' : ''}{row.gap}</Badge> : <span className="italic text-muted-foreground">-</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.bobot_nilai !== null ? <Badge variant="default">{row.bobot_nilai}</Badge> : <span className="italic text-muted-foreground">-</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.bobot_nilai !== null ? <Badge variant="default">{((row.bobot_nilai / 5) * 100).toFixed(0)}%</Badge> : <span className="italic text-muted-foreground">-</span>}
                              </TableCell>
                            </TableRow>
                          ))
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="py-4 text-center text-muted-foreground">Tidak ada sub-kriteria yang diisi atau dikonfigurasi untuk perhitungan ini.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Perhitungan Nilai Total Aspek */}
                <div className="overflow-x-auto rounded-lg border border-border">
                  <h4 className="text-md font-semibold text-foreground mb-4 p-4 bg-muted/20 border-b border-border">2. Perhitungan Nilai Total Aspek (Rata-rata Bobot Nilai Sub-Kriteria per Kriteria Utama)</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kriteria Utama</TableHead>
                        <TableHead className="text-center">Nilai Total Aspek</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statistics.perhitungan_nilai_total_aspek?.length > 0 ? (
                        statistics.perhitungan_nilai_total_aspek.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.nama_kriteria}</TableCell>
                            <TableCell className="text-center"><Badge variant="default">{item.nilai_aspek.toFixed(4)}</Badge></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="py-4 text-center text-muted-foreground">Tidak ada data nilai total aspek berdasarkan input Anda.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationDetail;
