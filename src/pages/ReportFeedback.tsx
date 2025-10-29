// src/pages/ReportFeedback.tsx - FIX ABSOLUT UNTUK REF DAN REACT-TO-PRINT

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, User, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useReactToPrint } from 'react-to-print';

const API_BASE_URL = 'https://support.antlia.id/api';

interface FeedbackReport {
    id: number;
    nama: string;
    created_at: string;
    catatan: string | null;
    rata_rata: number | null;
    jurusan_minat?: string | null;
    fungsionalitas?: number | null;
    kemudahan_penggunaan?: number | null;
    kejelasan_instruksi?: number | null;
    kecepatan_sistem?: number | null;
    relevansi_rekomendasi_user?: number | null;
    kepuasan_keseluruhan?: number | null;
    kesesuaian_bobot_ahp?: number | null;
    validitas_hasil_pm?: number | null;
    relevansi_rekomendasi_pakar?: number | null;
    keandalan_sistem?: number | null;
    potensi_implementasi?: number | null;
}

interface ReportData {
    user_report: FeedbackReport[];
    pakar_report: FeedbackReport[];
    user_overall_avg: number | null;
    pakar_overall_avg: number | null;
}

const ReportFeedbackPage: React.FC = () => {
    const { toast } = useToast();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    
    // Inisialisasi Ref
    const componentRef = useRef<HTMLDivElement>(null); 
    
    const [isPrinting, setIsPrinting] = useState(false);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/feedback_report`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Gagal memuat data laporan: Status ${response.status}`);
            }

            const data: ReportData = await response.json();
            setReportData(data);
            toast({
                title: 'Data Berhasil Dimuat',
                description: 'Laporan feedback user dan pakar berhasil diambil.',
            });

        } catch (error: any) {
            console.error('Error fetching report:', error);
            setReportData({
                user_report: [],
                pakar_report: [],
                user_overall_avg: null,
                pakar_overall_avg: null,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // LOGIKA EXPORT PDF PALING STABIL
    const handlePrint = useReactToPrint({
        // Gunakan content: () => componentRef.current
        content: () => componentRef.current,
        
        onBeforeGetContent: () => {
            setIsPrinting(true);
            return Promise.resolve(); 
        },
        
        onAfterPrint: () => {
            setIsPrinting(false);
        },
        
        documentTitle: `Laporan_Feedback_UAT_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}`,
        
        pageStyle: `
            @page { size: A4 landscape; margin: 1cm; } 
            body { font-family: sans-serif; }
            .print-table { border-collapse: collapse; width: 100%; font-size: 10px; }
            .print-table th, .print-table td { border: 1px solid #000; padding: 5px; text-align: center; }
            .print-table th { background-color: #ccc; }
            .no-print { display: none !important; }
        `,
    });
    
    const userHeaders = [
        'Nama', 'Jurusan/Minat', 'Fungsionalitas', 'Kemudahan Penggunaan', 
        'Kejelasan Instruksi', 'Kecepatan Sistem', 'Relevansi Rekomendasi', 
        'Kepuasan Keseluruhan', 'Rata-rata Baris', 'Catatan', 'Tanggal Input'
    ];
    
    const pakarHeaders = [
        'Nama', 'Kesesuaian Bobot AHP', 'Validitas Hasil PM', 'Relevansi Rekomendasi', 
        'Keandalan Sistem', 'Potensi Implementasi Nyata', 'Rata-rata Baris', 
        'Catatan', 'Tanggal Input'
    ];

    const renderTable = (data: FeedbackReport[], type: 'User' | 'Pakar', overallAvg: number | null) => {
        const isUser = type === 'User';
        const headers = isUser ? userHeaders : pakarHeaders;

        if (data.length === 0) {
            return (
                <CardContent className="text-center text-muted-foreground py-10">
                    Tidak ada data feedback untuk {type}.
                </CardContent>
            );
        }

        return (
            <Table className="print-table">
                <TableHeader>
                    <TableRow>
                        {headers.map((header) => (
                            <TableHead key={header} className="text-foreground text-center font-bold">
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell className="font-medium text-left max-w-[150px] truncate">{row.nama}</TableCell>
                            
                            {isUser && (
                                <>
                                    <TableCell className="text-left max-w-[100px] truncate">{row.jurusan_minat || '-'}</TableCell>
                                    <TableCell>{row.fungsionalitas ?? '-'}</TableCell>
                                    <TableCell>{row.kemudahan_penggunaan ?? '-'}</TableCell>
                                    <TableCell>{row.kejelasan_instruksi ?? '-'}</TableCell>
                                    <TableCell>{row.kecepatan_sistem ?? '-'}</TableCell>
                                    <TableCell>{row.relevansi_rekomendasi_user ?? '-'}</TableCell>
                                    <TableCell>{row.kepuasan_keseluruhan ?? '-'}</TableCell>
                                </>
                            )}

                            {!isUser && (
                                <>
                                    <TableCell>{row.kesesuaian_bobot_ahp ?? '-'}</TableCell>
                                    <TableCell>{row.validitas_hasil_pm ?? '-'}</TableCell>
                                    <TableCell>{row.relevansi_rekomendasi_pakar ?? '-'}</TableCell>
                                    <TableCell>{row.keandalan_sistem ?? '-'}</TableCell>
                                    <TableCell>{row.potensi_implementasi ?? '-'}</TableCell>
                                </>
                            )}
                            
                            <TableCell className="font-bold">
                                {row.rata_rata ? row.rata_rata.toFixed(2) : '-'}
                            </TableCell>

                            <TableCell className="text-left max-w-[200px] text-xs truncate">
                                {row.catatan || 'Tidak ada catatan.'}
                            </TableCell>
                            <TableCell className="text-xs">{new Date(row.created_at).toLocaleDateString('id-ID')}</TableCell>
                        </TableRow>
                    ))}
                    
                    <TableRow className="font-bold print-avg">
                        <TableCell colSpan={isUser ? 8 : 6} className="text-right text-lg">Total Rata-Rata Keseluruhan</TableCell>
                        <TableCell className="text-center text-lg text-primary">
                            {overallAvg ? overallAvg.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell colSpan={isUser ? 2 : 2}></TableCell>
                    </TableRow>

                </TableBody>
            </Table>
        );
    };

    // [MODIFIKASI UTAMA] Pindahkan Ref ke Div Luar Kondisional
    return (
        <div className="space-y-10 p-6 bg-background min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground flex items-center">
                    <FileText className="h-6 w-6 mr-3 text-primary" /> Laporan Feedback UAT
                </h1>
                <Button 
                    onClick={handlePrint} 
                    disabled={loading || isPrinting || (!reportData?.user_report.length && !reportData?.pakar_report.length)}
                    className="bg-green-600 hover:bg-green-700 text-white no-print" 
                >
                    {isPrinting ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Menyiapkan PDF...
                        </>
                    ) : (
                        <>
                            <Download className="h-5 w-5 mr-2" /> Export PDF Laporan
                        </>
                    )}
                </Button>
            </div>

            {/* [FIX] Pasang REF di sini (Selalu ada di DOM) */}
            <div ref={componentRef} className="space-y-10 print-container">
                
                {loading ? (
                    // Jika loading, tampilkan spinner di dalam div ref
                    <Card className="bg-card/50 border-border">
                        <CardContent className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Memuat data laporan...</span>
                        </CardContent>
                    </Card>
                ) : (
                    // Jika tidak loading, tampilkan konten laporan
                    <>
                        <div className="print-header">
                            <h2 className="text-xl font-bold text-center">LAPORAN FEEDBACK PENGGUNA DAN PAKAR</h2>
                            <p className="text-center text-sm mb-4">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
                        </div>

                        {/* Report User */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <User className="h-5 w-5 text-blue-500" />
                                    <CardTitle className="text-xl">Laporan Feedback dari User</CardTitle>
                                </div>
                                <CardDescription className="flex items-center space-x-2">
                                    <span>Total Data: {reportData?.user_report.length || 0}</span>
                                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                                        Rata-Rata Keseluruhan: {reportData?.user_overall_avg?.toFixed(2) || 'N/A'}
                                    </Badge>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                {renderTable(reportData?.user_report || [], 'User', reportData?.user_overall_avg || null)}
                            </CardContent>
                        </Card>

                        {/* Report Pakar */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <Users className="h-5 w-5 text-purple-500" />
                                    <CardTitle className="text-xl">Laporan Feedback dari Pakar</CardTitle>
                                </div>
                                <CardDescription className="flex items-center space-x-2">
                                    <span>Total Data: {reportData?.pakar_report.length || 0}</span>
                                    <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
                                        Rata-Rata Keseluruhan: {reportData?.pakar_overall_avg?.toFixed(2) || 'N/A'}
                                    </Badge>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                {renderTable(reportData?.pakar_report || [], 'Pakar', reportData?.pakar_overall_avg || null)}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportFeedbackPage;