import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Target,
  User,
  GraduationCap,
  Briefcase,
  Code,
  Users,
  ChevronRight,
  Star,
  TrendingUp,
  Loader2 // For loading spinner
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KriteriaGlobal {
  id: number;
  nama_kriteria: string;
}

interface SubKriteriaGlobal {
  id: number; // sub_kriteria_global_id
  kriteria_global_id: number;
  nama_kriteria: string; // nama kriteria utama dari join
  nama_sub_kriteria: string;
  kode_sub_kriteria: string;
}

interface UserInput {
  [subKriteriaGlobalId: number]: number; // Key adalah ID sub-kriteria global
}

interface RecommendationResult {
  id: number;
  nama: string;
  rata_rata_gaji: number;
  deskripsi: string;
  nilai_rekomendasi: number; // This is the value on a 1-5 scale (or 0-5 if 0 is "Kosongkan")
  // This 'stats' property will be passed to the detail page via navigation state
  stats?: {
    pm_gap_bobot_details: any[];
    pm_total_aspek_details: { kriteria_id: number; nama_kriteria: string; nilai_aspek: number }[];
    nilai_akhir_total_pm: number;
  };
}

const API_BASE_URL = 'https://support.antlia.id/api';
const SKALA_PENILAIAN = [1, 2, 3, 4, 5]; // Skala 1-5

const UserRecommendation: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [allGlobalCriteria, setAllGlobalCriteria] = useState<KriteriaGlobal[]>([]);
  const [allGlobalSubCriteria, setAllGlobalSubCriteria] = useState<SubKriteriaGlobal[]>([]);
  const [userInput, setUserInput] = useState<UserInput>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [recommendations, setRecommendations] = useState<RecommendationResult[] | null>(null);

  // Fetch all global criteria and sub-criteria
  const fetchAllCriteriaAndSubCriteria = useCallback(async () => {
    setLoading(true); // Set loading true before fetching
    try {
      const kriteriaResponse = await fetch(`${API_BASE_URL}/kriteria`);
      if (!kriteriaResponse.ok) throw new Error(`HTTP error! status: ${kriteriaResponse.status}`);
      const kriteriaData: KriteriaGlobal[] = await kriteriaResponse.json();
      setAllGlobalCriteria(kriteriaData.map(item => ({ ...item, id: parseInt(item.id.toString()) })));

      const subKriteriaGlobalResponse = await fetch(`${API_BASE_URL}/sub_kriteria_global`);
      if (!subKriteriaGlobalResponse.ok) throw new Error(`HTTP error! status: ${subKriteriaGlobalResponse.status}`);
      const subKriteriaGlobalData: SubKriteriaGlobal[] = await subKriteriaGlobalResponse.json();
      setAllGlobalSubCriteria(subKriteriaGlobalData.map(item => ({
        ...item,
        id: parseInt(item.id.toString()),
        kriteria_global_id: parseInt(item.kriteria_global_id.toString())
      })));

    } catch (error: any) {
      console.error("Gagal memuat data kriteria/sub-kriteria:", error);
      toast({
        title: "Gagal Memuat Data",
        description: `Gagal memuat form rekomendasi: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false); // Set loading false after fetching completes (success or error)
    }
  }, [toast]);

  useEffect(() => {
    // Attempt to load saved recommendations and user input from localStorage first
    const savedRecommendations = localStorage.getItem('lastRecommendations');
    const savedUserInput = localStorage.getItem('lastUserInput');

    if (savedRecommendations && savedUserInput) {
      try {
        setRecommendations(JSON.parse(savedRecommendations));
        setUserInput(JSON.parse(savedUserInput));
        // If data is loaded from localStorage, we can immediately show the results
        // And still fetch criteria data in background if needed for fresh form after reset
        setLoading(false);
        // Also fetch global criteria/sub-criteria in background for when user clicks reset
        fetchAllCriteriaAndSubCriteria();
      } catch (e) {
        console.error("Failed to parse saved data from localStorage", e);
        // Clear corrupted data
        localStorage.removeItem('lastRecommendations');
        localStorage.removeItem('lastUserInput');
        // Proceed with fresh fetch
        fetchAllCriteriaAndSubCriteria();
      }
    } else {
      // If no data in localStorage, fetch fresh data
      fetchAllCriteriaAndSubCriteria();
    }
  }, [fetchAllCriteriaAndSubCriteria]); // fetchAllCriteriaAndSubCriteria as dependency

  // Handle user input for sub-criteria radio buttons
  const handleInputChange = (subKriteriaGlobalId: number, value: number) => {
    setUserInput(prev => ({
      ...prev,
      [subKriteriaGlobalId]: value,
    }));
  };

  // Handle "Lihat Rekomendasi" button click
  const handleLihatRekomendasi = async () => {
    setLoading(true);
    setRecommendations(null); // Clear previous recommendations before new calculation

    const filteredUserInput: UserInput = {};
    for (const key in userInput) {
      const value = userInput[key];
      if (value !== null && value !== undefined && value !== 0) {
        filteredUserInput[parseInt(key)] = value;
      }
    }

    if (Object.keys(filteredUserInput).length === 0) {
      toast({
        title: "Input Kosong",
        description: "Silakan isi setidaknya satu nilai kriteria yang relevan untuk mendapatkan rekomendasi.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/rekomendasi/hitung`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_kriteria_nilai: filteredUserInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: RecommendationResult[] = await response.json();
      const sortedRecommendations = data.sort((a, b) => b.nilai_rekomendasi - a.nilai_rekomendasi);
      setRecommendations(sortedRecommendations);

      // Save recommendations and user input to localStorage
      localStorage.setItem('lastRecommendations', JSON.stringify(sortedRecommendations));
      localStorage.setItem('lastUserInput', JSON.stringify(filteredUserInput));

      toast({
        title: 'Rekomendasi Dihitung',
        description: 'Rekomendasi berhasil dihitung.',
        variant: "default",
      });
    } catch (error: any) {
      console.error("Gagal menghitung rekomendasi:", error);
      toast({
        title: "Gagal Menghitung Rekomendasi",
        description: `Gagal menghitung rekomendasi: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Group sub-criteria by global main criteria for better display (Memoized for performance)
  const groupedGlobalSubCriteria = useMemo(() => {
    const grouped: { [key: number]: SubKriteriaGlobal[] } = {};
    allGlobalSubCriteria.forEach(skg => {
      if (!grouped[skg.kriteria_global_id]) {
        grouped[skg.kriteria_global_id] = [];
      }
      grouped[skg.kriteria_global_id].push(skg);
    });
    const sortedGroups = Object.keys(grouped).map(kId => ({
      kriteriaId: parseInt(kId),
      kriteriaName: allGlobalCriteria.find(kg => kg.id === parseInt(kId))?.nama_kriteria || 'Kriteria Tidak Diketahui',
      subCriteria: grouped[parseInt(kId)].sort((a, b) => a.nama_sub_kriteria.localeCompare(b.nama_sub_kriteria))
    })).sort((a, b) => a.kriteriaName.localeCompare(b.kriteriaName));

    return sortedGroups;
  }, [allGlobalSubCriteria, allGlobalCriteria]);

  // Function to get category icons (adapted)
  const getCategoryIcon = (kriteriaName: string) => {
    const lowerCaseName = kriteriaName.toLowerCase();
    if (lowerCaseName.includes('pendidikan')) return <GraduationCap className="h-5 w-5" />;
    if (lowerCaseName.includes('pengalaman')) return <Briefcase className="h-5 w-5" />;
    if (lowerCaseName.includes('teknis')) return <Code className="h-5 w-5" />;
    if (lowerCaseName.includes('soft skills') || lowerCaseName.includes('interpersonal')) return <Users className="h-5 w-5" />;
    return <Target className="h-5 w-5" />;
  };

  const handleResetAssessment = () => {
    localStorage.removeItem('lastRecommendations');
    localStorage.removeItem('lastUserInput');
    setRecommendations(null);
    setUserInput({});
    // Explicitly re-fetch all global criteria and sub-criteria
    // to ensure the form is populated correctly after reset.
    fetchAllCriteriaAndSubCriteria();
  };

  return (
    <div className="space-y-8 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-2">Rekomendasi Karier untuk Fresh Graduate</h1>
          <p className="text-muted-foreground">Silakan masukkan nilai aktual Anda (1-5) untuk setiap sub-kriteria. Anda dapat mengosongkan kriteria yang tidak relevan.</p>
        </div>
        {recommendations && (
          <Button onClick={handleResetAssessment} variant="outline" className="ml-4">
            Mulai Ulang Asesmen
          </Button>
        )}
      </div>

      {/* Conditional rendering based on loading state and presence of recommendations */}
      {loading && (allGlobalCriteria.length === 0 || allGlobalSubCriteria.length === 0) && !recommendations ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Memuat kriteria dan sub-kriteria...</span>
          </CardContent>
        </Card>
      ) : recommendations ? (
        // Display recommendations if already calculated/loaded
        <div className="mt-12 space-y-6">
          <h3 className="text-2xl font-bold text-foreground mb-6 border-b pb-2">Hasil Rekomendasi Pekerjaan</h3>
          {recommendations.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="py-10 text-center text-muted-foreground">
                Tidak ada rekomendasi yang ditemukan berdasarkan input Anda.
                Pastikan Anda mengisi kriteria yang relevan atau hubungi admin untuk konfigurasi pekerjaan.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.slice(0, 4).map((rec, index) => {
                const recommendationPercentage = (rec.nilai_rekomendasi / 5) * 100; // Calculate percentage based on 5
                const matchLabel = recommendationPercentage >= 90 ? 'Sangat Cocok' :
                                    recommendationPercentage >= 70 ? 'Cocok' :
                                    recommendationPercentage >= 50 ? 'Cukup Cocok' :
                                    'Kurang';
                const matchClass = recommendationPercentage >= 90
                  ? 'text-green-400 border-green-400'
                  : recommendationPercentage >= 70
                    ? 'text-blue-400 border-blue-400'
                    : recommendationPercentage >= 50
                      ? 'text-yellow-400 border-yellow-400'
                      : 'text-red-400 border-red-400';

                return (
                  <Card key={rec.id} className="bg-card/50 border-border hover:bg-card/70 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-lg gradient-blue flex items-center justify-center">
                            <Target className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-foreground">{rec.nama}</h3>
                            <p className="text-muted-foreground">{rec.deskripsi}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span className="text-2xl font-bold text-foreground">{recommendationPercentage.toFixed(1)}%</span>
                          </div>
                          <Badge variant="outline" className={matchClass}>
                            {matchLabel}
                          </Badge>
                        </div>
                      </div>

                      {index === 0 && recommendationPercentage >= 50 && (
                        <div className="bg-green-500/10 text-green-700 p-3 rounded-lg mb-4 flex items-center space-x-2">
                          <p className="font-semibold">Ini adalah rekomendasi terbaik untuk Anda! Silakan kembangkan kemampuan Anda di bidang ini.</p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Estimasi Gaji Rata-Rata:</h4>
                          <p className="text-lg font-semibold text-blue-400">Rp {rec.rata_rata_gaji?.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Deskripsi Pekerjaan:</h4>
                          <p className="text-muted-foreground">{rec.deskripsi}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-border">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-muted-foreground">
                            Skor Kesesuaian: {rec.nilai_rekomendasi?.toFixed(4)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/user/rekomendasi/${rec.id}/detail`, {
                            state: {
                              userInput,
                              jobName: rec.nama,
                              jobDescription: rec.deskripsi,
                              jobSalary: rec.rata_rata_gaji,
                              pm_details: rec.stats
                            }
                          })}
                        >
                          Lihat Statistik Perhitungan
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // Display input form if no recommendations are present and not loading initial data
        allGlobalCriteria.length === 0 ? (
          <Card className="bg-card/50 border-border">
            <CardContent className="py-10 text-center text-muted-foreground">
              Belum ada kriteria yang diatur oleh admin. Silakan hubungi administrator.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedGlobalSubCriteria.map(group => (
              <Card key={group.kriteriaId} className="bg-card/50 border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(group.kriteriaName)}
                    <CardTitle className="text-foreground">{group.kriteriaName}</CardTitle>
                  </div>
                  <CardDescription>Pilih tingkat kemampuan Anda untuk setiap sub-kriteria di bawah {group.kriteriaName}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {group.subCriteria.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.subCriteria.map(sub => (
                        <div key={sub.id} className="space-y-4 p-4 rounded-lg bg-muted/20 border border-border">
                          <Label className="text-sm font-medium text-foreground">
                            {sub.nama_sub_kriteria}
                          </Label>

                          <div className="space-y-3">
                            <RadioGroup
                              value={(userInput[sub.id] || 0).toString()}
                              onValueChange={(value) => handleInputChange(sub.id, parseInt(value))}
                              className="flex items-center justify-between gap-2"
                            >
                              {SKALA_PENILAIAN.map(val => (
                                <div key={val} className="flex flex-col items-center space-y-2">
                                  <RadioGroupItem
                                    value={val.toString()}
                                    id={`sub-q-${sub.id}-${val}`}
                                    className="h-4 w-4"
                                  />
                                  <Label
                                    htmlFor={`sub-q-${sub.id}-${val}`}
                                    className="text-xs text-center cursor-pointer text-foreground"
                                  >
                                    {val}
                                  </Label>
                                </div>
                              ))}
                              <div className="flex flex-col items-center space-y-2 ml-4">
                                <RadioGroupItem
                                  value="0"
                                  id={`sub-q-${sub.id}-0`}
                                  className="h-4 w-4"
                                />
                                <Label
                                  htmlFor={`sub-q-${sub.id}-0`}
                                  className="text-xs text-center cursor-pointer text-muted-foreground"
                                >
                                  Kosongkan
                                </Label>
                              </div>
                            </RadioGroup>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Kurang ---  Sedang  --- Sangat Baik</span> 
                              {/* <span>Sangat Baik</span> */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Belum ada sub-kriteria yang diatur untuk kriteria ini.</p>
                  )}
                </CardContent>
              </Card>
            ))}
            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleLihatRekomendasi}
                className="gradient-blue text-lg px-8 py-3"
                disabled={loading}
                type="button"
              >
                {loading ? (
                  <> <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Menghitung... </>
                ) : (
                  'Lihat Rekomendasi'
                )}
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default UserRecommendation;
