import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';


interface KriteriaGlobal {
  id: number;
  nama_kriteria: string;
}

interface SubKriteriaGlobal {
  id: number;
  kriteria_global_id: number;
  nama_kriteria: string; // nama kriteria utama dari join (from backend)
  nama_sub_kriteria: string;
  kode_sub_kriteria: string;
}

const API_BASE_URL = 'https://antlia.id/antlia-backend/api';

const KriteriaGlobal: React.FC = () => {
  const [kriteria, setKriteria] = useState<KriteriaGlobal[]>([]);
  const [subKriteriaGlobal, setSubKriteriaGlobal] = useState<SubKriteriaGlobal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State untuk Kriteria Utama
  const [isKriteriaModalOpen, setIsKriteriaModalOpen] = useState<boolean>(false);
  const [newKriteriaName, setNewKriteriaName] = useState<string>('');
  const [editingKriteria, setEditingKriteria] = useState<KriteriaGlobal | null>(null);

  // State untuk Sub-Kriteria
  const [isSubKriteriaModalOpen, setIsSubKriteriaModalOpen] = useState<boolean>(false);
  const [newSubKriteriaName, setNewSubKriteriaName] = useState<string>('');
  const [selectedParentKriteriaId, setSelectedParentKriteriaId] = useState<number | null>(null);
  const [editingSubKriteria, setEditingSubKriteria] = useState<SubKriteriaGlobal | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Ambil ID admin yang login dari localStorage
  const adminDataString = localStorage.getItem('adminAuth');
  const adminData = adminDataString ? JSON.parse(adminDataString) : {};
  const loggedInAdminId = adminData.userId;

  // --- Fetching Functions ---
  const fetchKriteriaGlobal = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/kriteria`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: KriteriaGlobal[] = await response.json();
      const processedData = data.map(item => ({
        ...item,
        id: parseInt(item.id.toString())
      }));
      setKriteria(processedData);
    } catch (error: any) {
      console.error("Gagal mengambil data kriteria global:", error);
      toast({
        title: "Gagal Memuat Kriteria Utama",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchSubKriteriaGlobal = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sub_kriteria_global`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: SubKriteriaGlobal[] = await response.json();
      const processedData = data.map(item => ({
        ...item,
        id: parseInt(item.id.toString()),
        kriteria_global_id: parseInt(item.kriteria_global_id.toString())
      }));
      setSubKriteriaGlobal(processedData);
    } catch (error: any) {
      console.error("Gagal mengambil data sub-kriteria global:", error);
      toast({
        title: "Gagal Memuat Sub-Kriteria Global",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKriteriaGlobal();
    fetchSubKriteriaGlobal();
  }, [fetchKriteriaGlobal, fetchSubKriteriaGlobal]);

  // --- Kriteria Global Handlers ---
  const handleKriteriaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKriteriaName.trim()) {
      toast({ title: "Input Kosong", description: "Nama kriteria tidak boleh kosong.", variant: "destructive" });
      return;
    }

    if (!loggedInAdminId) {
      toast({ title: "Unauthorized", description: "Anda harus login untuk melakukan aksi ini.", variant: "destructive" });
      return;
    }

    try {
      const method = editingKriteria ? 'PUT' : 'POST';
      const url = editingKriteria
        ? `${API_BASE_URL}/kriteria/${editingKriteria.id}?adminId=${loggedInAdminId}`
        : `${API_BASE_URL}/kriteria?adminId=${loggedInAdminId}`;

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_kriteria: newKriteriaName }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      toast({
        title: editingKriteria ? 'Kriteria Diperbarui' : 'Kriteria Ditambahkan',
        description: `Kriteria berhasil ${editingKriteria ? 'diperbarui' : 'ditambahkan'}.`,
        variant: "default"
      });
      // Close modal and reset state
      setIsKriteriaModalOpen(false);
      setNewKriteriaName('');
      setEditingKriteria(null);
      fetchKriteriaGlobal();
    } catch (error: any) {
      console.error("Gagal menyimpan kriteria:", error);
      toast({
        title: "Gagal Menyimpan Kriteria",
        description: `Gagal menyimpan kriteria: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleKriteriaDelete = async (id: number) => {
    if (!loggedInAdminId) {
      toast({ title: "Unauthorized", description: "Anda harus login untuk melakukan aksi ini.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/kriteria/${id}?adminId=${loggedInAdminId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      toast({
        title: 'Kriteria Dihapus',
        description: 'Kriteria utama berhasil dihapus.',
        variant: "default"
      });
      fetchKriteriaGlobal();
      fetchSubKriteriaGlobal(); // Refresh sub-kriteria also
    } catch (error: any) {
      console.error("Gagal menghapus kriteria:", error);
      toast({
        title: "Gagal Menghapus Kriteria",
        description: `Gagal menghapus kriteria: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleKriteriaEdit = (item: KriteriaGlobal) => {
    setEditingKriteria(item);
    setNewKriteriaName(item.nama_kriteria);
    setIsKriteriaModalOpen(true);
  };

  const handleKriteriaAdd = () => {
    setEditingKriteria(null);
    setNewKriteriaName('');
    setIsKriteriaModalOpen(true);
  };

  // --- Sub-Kriteria Global Handlers ---
  const generateKodeSubKriteria = (kriteriaName: string, subKriteriaName: string): string => {
    const kriteriaParts = kriteriaName ? kriteriaName.split(' ').map(word => word.charAt(0)).join('') : '';
    const subKriteriaSlug = subKriteriaName.replace(/\s+/g, '-').toLowerCase();
    return `${kriteriaParts.toUpperCase()}-${subKriteriaSlug}`;
  };

  const handleSubKriteriaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubKriteriaName.trim()) {
      toast({ title: "Input Kosong", description: "Nama sub-kriteria tidak boleh kosong.", variant: "destructive" });
      return;
    }
    if (selectedParentKriteriaId === null) {
      toast({ title: "Pilihan Kriteria Utama", description: "Mohon pilih kriteria utama yang valid.", variant: "destructive" });
      return;
    }
    if (!loggedInAdminId) {
      toast({ title: "Unauthorized", description: "Anda harus login untuk melakukan aksi ini.", variant: "destructive" });
      return;
    }

    const parentKriteria = kriteria.find(k => k.id === selectedParentKriteriaId);
    if (!parentKriteria) {
      toast({ title: "Kriteria Utama Tidak Ditemukan", description: "Kriteria utama yang dipilih tidak ditemukan dalam daftar. Harap muat ulang halaman.", variant: "destructive" });
      return;
    }

    const kode_sub_kriteria = generateKodeSubKriteria(parentKriteria.nama_kriteria, newSubKriteriaName);

    try {
      const method = editingSubKriteria ? 'PUT' : 'POST';
      const url = editingSubKriteria
        ? `${API_BASE_URL}/sub_kriteria_global/${editingSubKriteria.id}?adminId=${loggedInAdminId}`
        : `${API_BASE_URL}/sub_kriteria_global?adminId=${loggedInAdminId}`;

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kriteria_global_id: selectedParentKriteriaId,
          nama_sub_kriteria: newSubKriteriaName,
          kode_sub_kriteria: kode_sub_kriteria,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      toast({
        title: editingSubKriteria ? 'Sub-Kriteria Diperbarui' : 'Sub-Kriteria Ditambahkan',
        description: `Sub-kriteria berhasil ${editingSubKriteria ? 'diperbarui' : 'ditambahkan'}.`,
        variant: "default"
      });
      // Close modal and reset state
      setIsSubKriteriaModalOpen(false);
      setNewSubKriteriaName('');
      setSelectedParentKriteriaId(null);
      setEditingSubKriteria(null);
      fetchSubKriteriaGlobal();
    } catch (error: any) {
      console.error("Gagal menyimpan sub-kriteria global:", error);
      toast({
        title: "Gagal Menyimpan Sub-Kriteria",
        description: `Gagal menyimpan sub-kriteria: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleSubKriteriaDelete = async (id: number) => {
    if (!loggedInAdminId) {
      toast({ title: "Unauthorized", description: "Anda harus login untuk melakukan aksi ini.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/sub_kriteria_global/${id}?adminId=${loggedInAdminId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      toast({
        title: 'Sub-Kriteria Dihapus',
        description: 'Sub-kriteria global berhasil dihapus.',
        variant: "default"
      });
      fetchSubKriteriaGlobal();
    } catch (error: any) {
      console.error("Gagal menghapus sub-kriteria:", error);
      toast({
        title: "Gagal Menghapus Sub-Kriteria",
        description: `Gagal menghapus sub-kriteria: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleSubKriteriaEdit = (item: SubKriteriaGlobal) => {
    setEditingSubKriteria(item);
    setNewSubKriteriaName(item.nama_sub_kriteria);
    setSelectedParentKriteriaId(item.kriteria_global_id);
    setIsSubKriteriaModalOpen(true);
  };

  const handleSubKriteriaAdd = () => {
    setEditingSubKriteria(null);
    setNewSubKriteriaName('');
    setSelectedParentKriteriaId(null);
    setIsSubKriteriaModalOpen(true);
  };

  // Memoized data for the grouped table
  const groupedSubCriteria = useMemo(() => {
    const grouped: { [key: number]: SubKriteriaGlobal[] } = {};
    subKriteriaGlobal.forEach(skg => {
      if (!grouped[skg.kriteria_global_id]) {
        grouped[skg.kriteria_global_id] = [];
      }
      grouped[skg.kriteria_global_id].push(skg);
    });

    const sortedGroups = Object.values(grouped).map(group => {
      const kriteriaName = group[0]?.nama_kriteria || 'Kriteria Tidak Diketahui';
      const subCriteria = group.sort((a, b) => a.nama_sub_kriteria.localeCompare(b.nama_sub_kriteria));
      return { kriteriaName, subCriteria };
    }).sort((a, b) => a.kriteriaName.localeCompare(b.kriteriaName));

    return sortedGroups;
  }, [subKriteriaGlobal]);


  return (
    <div className="space-y-8 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Kriteria Global</h1>
          <p className="text-muted-foreground">Kelola kriteria utama dan sub-kriteria yang tersedia secara global</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>
      </div>

      {/* Section Manajemen Kriteria Global (Utama) */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Kriteria Utama Global</CardTitle>
            <CardDescription>Tambah, edit, atau hapus kriteria utama yang akan digunakan di semua pekerjaan.</CardDescription>
          </div>
          <Button onClick={handleKriteriaAdd} className="gradient-blue" disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat kriteria utama...</span>
            </div>
          ) : (
            kriteria.length === 0 ? (
              <p className="text-center text-muted-foreground text-lg py-10">Belum ada kriteria utama global. Silakan tambahkan.</p>
            ) : (
              <div className="overflow-x-auto mt-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Nomor</TableHead>
                      <TableHead>Nama Kriteria Utama</TableHead>
                      <TableHead className="text-center w-[120px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kriteria.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{item.nama_kriteria}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleKriteriaEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* Delete Confirmation Dialog for Main Criteria */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Konfirmasi Penghapusan Kriteria Utama</DialogTitle>
                                  <DialogDescription>
                                    Menghapus kriteria utama "{item.nama_kriteria}" juga akan menghapus semua sub-kriteria terkait dan pengaturan pekerjaan yang menggunakannya. Anda yakin ingin melanjutkan?
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline">Batal</Button>
                                  <Button variant="destructive" onClick={() => handleKriteriaDelete(item.id)}>Hapus</Button>
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
        </CardContent>
      </Card>

      {/* Modal untuk tambah/edit Kriteria Utama */}
      <Dialog open={isKriteriaModalOpen} onOpenChange={setIsKriteriaModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingKriteria ? 'Edit Kriteria Utama' : 'Tambah Kriteria Utama'}</DialogTitle>
            <DialogDescription>
              {editingKriteria ? 'Ubah nama kriteria utama.' : 'Isi nama kriteria utama yang baru.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleKriteriaSubmit} className="space-y-4">
            <div>
              <Label htmlFor="kriteria_name_modal">Nama Kriteria Utama</Label>
              <Input
                type="text"
                id="kriteria_name_modal"
                value={newKriteriaName}
                onChange={(e) => setNewKriteriaName(e.target.value)}
                placeholder="Contoh: Keahlian Teknis, Soft Skills"
                required
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsKriteriaModalOpen(false)}>
                <X className="h-4 w-4 mr-2" /> Batal
              </Button>
              <Button type="submit" className="gradient-blue">
                {editingKriteria ? 'Simpan Perubahan' : 'Tambah Kriteria'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* Section Manajemen Sub-Kriteria Global */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Sub-Kriteria Global</CardTitle>
            <CardDescription>Tambah, edit, atau hapus sub-kriteria global yang terkait dengan kriteria utama.</CardDescription>
          </div>
          <Button onClick={handleSubKriteriaAdd} className="gradient-blue" disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat sub-kriteria...</span>
            </div>
          ) : (
            subKriteriaGlobal.length === 0 ? (
              <p className="text-center text-muted-foreground text-lg py-10">Belum ada sub-kriteria global. Silakan tambahkan.</p>
            ) : (
              <div className="overflow-x-auto mt-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kriteria Utama</TableHead>
                      <TableHead>Nama Sub-Kriteria</TableHead>
                      <TableHead className="w-[250px]">Kode</TableHead>
                      <TableHead className="text-center w-[120px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedSubCriteria.map((group, groupIndex) => (
                      group.subCriteria.map((item, itemIndex) => (
                        <TableRow key={item.id}>
                          
                          {itemIndex === 0 && (
                            <TableCell rowSpan={group.subCriteria.length} className="font-bold border-r">
                              {group.kriteriaName}
                            </TableCell>
                          )}
                          <TableCell>{item.nama_sub_kriteria}</TableCell>
                          <TableCell><Badge variant="outline" className="font-mono">{item.kode_sub_kriteria}</Badge></TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSubKriteriaEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {/* Delete Confirmation Dialog for Sub-Criteria */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Konfirmasi Penghapusan Sub-Kriteria</DialogTitle>
                                    <DialogDescription>
                                      Apakah Anda yakin ingin menghapus sub-kriteria global "{item.nama_sub_kriteria}"? Ini akan memengaruhi semua pengaturan pekerjaan yang menggunakannya. Aksi ini tidak dapat dibatalkan.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="outline">Batal</Button>
                                    <Button variant="destructive" onClick={() => handleSubKriteriaDelete(item.id)}>Hapus</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Modal untuk tambah/edit Sub-Kriteria */}
      <Dialog open={isSubKriteriaModalOpen} onOpenChange={setIsSubKriteriaModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSubKriteria ? 'Edit Sub-Kriteria' : 'Tambah Sub-Kriteria'}</DialogTitle>
            <DialogDescription>
              {editingSubKriteria ? 'Ubah detail sub-kriteria.' : 'Isi detail sub-kriteria yang baru.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubKriteriaSubmit} className="space-y-4">
            <div>
              <Label htmlFor="parent_kriteria_modal">Kriteria Utama</Label>
              <Select
                value={selectedParentKriteriaId !== null ? selectedParentKriteriaId.toString() : ''}
                onValueChange={(value) => setSelectedParentKriteriaId(value ? parseInt(value) : null)}
                disabled={!!editingSubKriteria || kriteria.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kriteria Utama" />
                </SelectTrigger>
                <SelectContent>
                  {kriteria.map(k => (
                    <SelectItem key={k.id} value={k.id.toString()}>{k.nama_kriteria}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sub_kriteria_name_modal">Nama Sub-Kriteria</Label>
              <Input
                type="text"
                id="sub_kriteria_name_modal"
                value={newSubKriteriaName}
                onChange={(e) => setNewSubKriteriaName(e.target.value)}
                placeholder="Contoh: Penguasaan Python, Komunikasi Efektif"
                required
              />
              {selectedParentKriteriaId !== null && newSubKriteriaName.trim() && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Kode akan menjadi: <Badge variant="secondary" className="font-mono">{generateKodeSubKriteria(kriteria.find(k => k.id === selectedParentKriteriaId)?.nama_kriteria || '', newSubKriteriaName)}</Badge>
                </p>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsSubKriteriaModalOpen(false)}>
                <X className="h-4 w-4 mr-2" /> Batal
              </Button>
              <Button
                type="submit"
                className="gradient-blue"
                disabled={selectedParentKriteriaId === null || !newSubKriteriaName.trim()}
              >
                {editingSubKriteria ? 'Simpan Perubahan' : 'Tambah Sub-Kriteria'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KriteriaGlobal;
