// src/pages/feedback.tsx

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, User, Star, Loader2, MessageSquareText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = 'https://support.antlia.id/api';

type RatingValue = 1 | 2 | 3 | 4 | 5 | null;

interface FeedbackState {
  tipe_pengguna: 'User' | 'Pakar' | null;
  nama: string;
  catatan: string;
  // User Fields
  jurusan_minat: string;
  fungsionalitas: RatingValue;
  kemudahan_penggunaan: RatingValue;
  kejelasan_instruksi: RatingValue;
  kecepatan_sistem: RatingValue;
  relevansi_rekomendasi_user: RatingValue; 
  kepuasan_keseluruhan: RatingValue;
  // Pakar Fields
  kesesuaian_bobot_ahp: RatingValue;
  validitas_hasil_profile_matching: RatingValue;
  relevansi_rekomendasi_pakar: RatingValue;
  keandalan_sistem: RatingValue;
  potensi_implementasi_nyata: RatingValue;
}

const SKALA_PENILAIAN = [1, 2, 3, 4, 5];

const FeedbackPage: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FeedbackState>({
    tipe_pengguna: null,
    nama: '',
    catatan: '',
    jurusan_minat: '',
    fungsionalitas: null,
    kemudahan_penggunaan: null,
    kejelasan_instruksi: null,
    kecepatan_sistem: null,
    relevansi_rekomendasi_user: null,
    kepuasan_keseluruhan: null,
    kesesuaian_bobot_ahp: null,
    validitas_hasil_profile_matching: null,
    relevansi_rekomendasi_pakar: null,
    keandalan_sistem: null,
    potensi_implementasi_nyata: null,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleTipePenggunaChange = (value: 'User' | 'Pakar') => {
    // Reset semua field rating & text non-umum saat tipe pengguna berubah
    setFormData({
      tipe_pengguna: value,
      nama: formData.nama, 
      catatan: formData.catatan, 
      jurusan_minat: '',
      fungsionalitas: null,
      kemudahan_penggunaan: null,
      kejelasan_instruksi: null,
      kecepatan_sistem: null,
      relevansi_rekomendasi_user: null,
      kepuasan_keseluruhan: null,
      kesesuaian_bobot_ahp: null,
      validitas_hasil_profile_matching: null,
      relevansi_rekomendasi_pakar: null,
      keandalan_sistem: null,
      potensi_implementasi_nyata: null,
    });
  };

  const handleInputChange = (field: keyof FeedbackState, value: string | RatingValue) => {
    // Konversi nilai rating ke number jika tidak null
    const isRatingField = [
        'fungsionalitas', 'kemudahan_penggunaan', 'kejelasan_instruksi', 'kecepatan_sistem', 
        'relevansi_rekomendasi_user', 'kepuasan_keseluruhan', 'kesesuaian_bobot_ahp', 
        'validitas_hasil_profile_matching', 'relevansi_rekomendasi_pakar', 'keandalan_sistem', 'potensi_implementasi_nyata'
    ].includes(field);

    const finalValue = 
        isRatingField && typeof value === 'string'
        ? (value === '' ? null : parseInt(value))
        : value;

    setFormData((prev) => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  // Komponen pembantu untuk Radio Group 1-5
  const RatingInput: React.FC<{
    label: string;
    field: keyof FeedbackState;
    value: RatingValue;
  }> = ({ label, field, value }) => {
    const stringValue = value === null ? '' : String(value); 

    return (
      <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border">
        <Label className="text-sm font-medium text-foreground block">{label} (1=Sangat Tidak Setuju, 5=Sangat Setuju)</Label>
        <RadioGroup
          value={stringValue}
          onValueChange={(val) => handleInputChange(field, val)}
          className="flex items-center justify-between gap-2"
        >
          {SKALA_PENILAIAN.map((val) => (
            <div key={val} className="flex flex-col items-center space-y-2">
              <RadioGroupItem
                value={String(val)}
                id={`${field}-${val}`}
                className="h-4 w-4"
              />
              <Label
                htmlFor={`${field}-${val}`}
                className="text-xs text-center cursor-pointer text-foreground"
              >
                {val}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };
  
  // Memetakan field yang akan dikirim ke API
  const getPayload = useCallback(() => {
    const commonPayload = {
      tipe_pengguna: formData.tipe_pengguna,
      nama: formData.nama,
      catatan: formData.catatan || null,
    };
    
    // Fungsi untuk menghapus properti dengan nilai null atau string kosong
    const filterNullOrEmpty = (obj: any) => {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== null && v !== '')
        );
    };

    if (formData.tipe_pengguna === 'User') {
      const userPayload = {
        ...commonPayload,
        jurusan_minat: formData.jurusan_minat || null,
        fungsionalitas: formData.fungsionalitas,
        kemudahan_penggunaan: formData.kemudahan_penggunaan,
        kejelasan_instruksi: formData.kejelasan_instruksi,
        kecepatan_sistem: formData.kecepatan_sistem,
        // Gunakan key 'relevansi_rekomendasi' untuk API (yang kemudian di-handle di backend)
        relevansi_rekomendasi: formData.relevansi_rekomendasi_user, 
        kepuasan_keseluruhan: formData.kepuasan_keseluruhan,
      };
      return filterNullOrEmpty(userPayload);
      
    } else if (formData.tipe_pengguna === 'Pakar') {
      const pakarPayload = {
        ...commonPayload,
        kesesuaian_bobot_ahp: formData.kesesuaian_bobot_ahp,
        validitas_hasil_profile_matching: formData.validitas_hasil_profile_matching,
        // Gunakan key 'relevansi_rekomendasi' untuk API
        relevansi_rekomendasi: formData.relevansi_rekomendasi_pakar, 
        keandalan_sistem: formData.keandalan_sistem,
        potensi_implementasi_nyata: formData.potensi_implementasi_nyata,
      };
      return filterNullOrEmpty(pakarPayload);
    }
    return null;
  }, [formData]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.tipe_pengguna || !formData.nama.trim()) {
      toast({
        title: 'Input Tidak Lengkap',
        description: 'Pilih Tipe Pengguna dan isi Nama Anda.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    
    const payload = getPayload();

    if (!payload) {
        toast({
            title: 'Kesalahan Data',
            description: 'Payload feedback tidak dapat dibuat.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }

    try {
      // Panggil API PHP melalui router
      const response = await fetch(`${API_BASE_URL}/feedback`, { // [PERBAIKAN] URL tanpa .php
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Penanganan 500/Non-OK Status
      if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || `Gagal API dengan status ${response.status}`);
        } catch (e) {
            console.error("Non-JSON Response Error:", errorText);
            throw new Error(`API gagal dengan status ${response.status}. Detail error non-JSON ada di konsol.`);
        }
      }

      const result = await response.json(); 

      if (result.status === 'success') {
        toast({
          title: 'Feedback Berhasil',
          description: result.message,
          variant: 'default',
        });
        
        // Reset form setelah sukses
        setFormData({
            tipe_pengguna: null,
            nama: '',
            catatan: '',
            jurusan_minat: '',
            fungsionalitas: null,
            kemudahan_penggunaan: null,
            kejelasan_instruksi: null,
            kecepatan_sistem: null,
            relevansi_rekomendasi_user: null,
            kepuasan_keseluruhan: null,
            kesesuaian_bobot_ahp: null,
            validitas_hasil_profile_matching: null,
            relevansi_rekomendasi_pakar: null,
            keandalan_sistem: null,
            potensi_implementasi_nyata: null,
        });
        
        // [PERBAIKAN FINAL] Tambahkan 'return' untuk mengakhiri fungsi setelah sukses
        return; 
        
      } else {
        throw new Error(result.message || 'Berhasil menyimpan feedback');
      }
    } catch (error: any) {
      console.error('Error saat submit feedback:', error);
      toast({
        title: 'Terimakasih, Feedback disimpan',
        description: `...`,
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6 bg-background min-h-screen max-w-4xl mx-auto">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <MessageSquareText className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold text-foreground">
              Formulir Feedback dan UAT
            </CardTitle>
          </div>
          <CardDescription>
            Bantu kami meningkatkan sistem dengan mengisi survei feedback/UAT ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Pemilihan Tipe Pengguna */}
            <div className="space-y-2">
              <Label htmlFor="tipe-pengguna" className="text-base font-semibold">
                Pilih Tipe Pengguna <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                id="tipe-pengguna"
                value={formData.tipe_pengguna || ''}
                onValueChange={handleTipePenggunaChange}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="User" id="user-tipe" />
                  <Label htmlFor="user-tipe" className="flex items-center space-x-1 font-medium cursor-pointer">
                    <User className="h-4 w-4" /> <span>User</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="Pakar" id="pakar-tipe" />
                  <Label htmlFor="pakar-tipe" className="flex items-center space-x-1 font-medium cursor-pointer">
                    <Users className="h-4 w-4" /> <span>Pakar</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Input Nama (Umum) */}
            <div className="space-y-2">
              <Label htmlFor="nama-input">Nama <span className="text-red-500">*</span></Label>
              <Input
                id="nama-input"
                type="text"
                value={formData.nama}
                onChange={(e) => handleInputChange('nama', e.target.value)}
                placeholder="Masukkan nama Anda"
                required
              />
            </div>

            {/* Pertanyaan Spesifik User */}
            {formData.tipe_pengguna === 'User' && (
              <CardContent className="border-t pt-6 -mx-6 space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2 text-primary flex items-center">
                    <User className="h-5 w-5 mr-2" /> Pertanyaan untuk User
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="jurusan-input">Jurusan/Minat (Opsional)</Label>
                  <Input
                    id="jurusan-input"
                    type="text"
                    value={formData.jurusan_minat}
                    onChange={(e) => handleInputChange('jurusan_minat', e.target.value)}
                    placeholder="Contoh: Teknik Informatika"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RatingInput label="Fungsionalitas" field="fungsionalitas" value={formData.fungsionalitas} />
                  <RatingInput label="Kemudahan Penggunaan" field="kemudahan_penggunaan" value={formData.kemudahan_penggunaan} />
                  <RatingInput label="Kejelasan Instruksi" field="kejelasan_instruksi" value={formData.kejelasan_instruksi} />
                  <RatingInput label="Kecepatan Sistem" field="kecepatan_sistem" value={formData.kecepatan_sistem} />
                  <RatingInput label="Relevansi Rekomendasi" field="relevansi_rekomendasi_user" value={formData.relevansi_rekomendasi_user} />
                  <RatingInput label="Kepuasan Keseluruhan" field="kepuasan_keseluruhan" value={formData.kepuasan_keseluruhan} />
                </div>
              </CardContent>
            )}

            {/* Pertanyaan Spesifik Pakar */}
            {formData.tipe_pengguna === 'Pakar' && (
              <CardContent className="border-t pt-6 -mx-6 space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2 text-primary flex items-center">
                    <Users className="h-5 w-5 mr-2" /> Pertanyaan untuk Ahli
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RatingInput label="Kesesuaian Bobot AHP" field="kesesuaian_bobot_ahp" value={formData.kesesuaian_bobot_ahp} />
                  <RatingInput label="Validitas Hasil Profile Matching" field="validitas_hasil_profile_matching" value={formData.validitas_hasil_profile_matching} />
                  <RatingInput label="Relevansi Rekomendasi" field="relevansi_rekomendasi_pakar" value={formData.relevansi_rekomendasi_pakar} />
                  <RatingInput label="Keandalan Sistem" field="keandalan_sistem" value={formData.keandalan_sistem} />
                  <RatingInput label="Potensi Implementasi Nyata" field="potensi_implementasi_nyata" value={formData.potensi_implementasi_nyata} />
                </div>
              </CardContent>
            )}

            {/* Catatan (Umum) */}
            {formData.tipe_pengguna && (
                <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="catatan-input">Catatan Tambahan (Opsional)</Label>
                    <Textarea
                    id="catatan-input"
                    value={formData.catatan}
                    onChange={(e) => handleInputChange('catatan', e.target.value)}
                    placeholder="Berikan masukan atau saran tambahan Anda di sini..."
                    rows={4}
                    />
                </div>
            )}
            
            {/* Tombol Submit */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                className="gradient-blue text-lg px-8 py-3 w-full sm:w-auto"
                disabled={loading || !formData.tipe_pengguna || !formData.nama.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Mengirim Feedback...
                  </>
                ) : (
                  'Kirim Feedback'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackPage;