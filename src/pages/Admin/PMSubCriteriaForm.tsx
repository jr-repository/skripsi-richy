// src/pages/Admin/PMSubCriteriaForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubKriteriaFormProps {
  pekerjaanId: number;
  kriteriaId: number;
  namaKriteriaUtama: string; // Add name of main criterion for display
  currentSubCriteria: { sub_kriteria_id: number; nama_sub_kriteria: string; nilai_ideal: number }[];
  onSave: (data: { kriteria_id: number; nama_sub_kriteria: string; nilai_ideal: number }, id?: number) => void;
  onDelete: (id: number) => void;
}

const SKALA_PENILAIAN = [1, 2, 3, 4, 5]; // Skala 1-5 untuk nilai ideal

const PMSubCriteriaForm: React.FC<SubKriteriaFormProps> = ({
  pekerjaanId,
  kriteriaId,
  namaKriteriaUtama, // Use this for display
  currentSubCriteria,
  onSave,
  onDelete,
}) => {
  const [newSubKriteriaName, setNewSubKriteriaName] = useState<string>('');
  const [newNilaiIdeal, setNewNilaiIdeal] = useState<number>(3); // Default nilai ideal
  const [editingSubKriteria, setEditingSubKriteria] = useState<{ id: number; nama_sub_kriteria: string; nilai_ideal: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [subKriteriaToDelete, setSubKriteriaToDelete] = useState<{ id: number; nama: string } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Reset form when kriteriaId or pekerjaanId changes
    setNewSubKriteriaName('');
    setNewNilaiIdeal(3);
    setEditingSubKriteria(null);
  }, [kriteriaId, pekerjaanId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubKriteriaName.trim()) {
      toast({ title: "Input Kosong", description: "Nama sub-kriteria tidak boleh kosong.", variant: "destructive" });
      return;
    }

    onSave(
      { kriteria_id: kriteriaId, nama_sub_kriteria: newSubKriteriaName, nilai_ideal: newNilaiIdeal },
      editingSubKriteria?.id
    );

    setNewSubKriteriaName('');
    setNewNilaiIdeal(3);
    setEditingSubKriteria(null);
  };

  const handleEdit = (subKriteria: { sub_kriteria_id: number; nama_sub_kriteria: string; nilai_ideal: number }) => {
    setEditingSubKriteria({ id: subKriteria.sub_kriteria_id, nama_sub_kriteria: subKriteria.nama_sub_kriteria, nilai_ideal: subKriteria.nilai_ideal });
    setNewSubKriteriaName(subKriteria.nama_sub_kriteria);
    setNewNilaiIdeal(subKriteria.nilai_ideal);
  };

  const handleCancelEdit = () => {
    setEditingSubKriteria(null);
    setNewSubKriteriaName('');
    setNewNilaiIdeal(3);
  };

  const handleDeleteClick = (id: number, nama: string) => {
    setSubKriteriaToDelete({ id, nama });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = useCallback(() => {
    if (subKriteriaToDelete) {
      onDelete(subKriteriaToDelete.id);
      setShowDeleteConfirm(false);
      setSubKriteriaToDelete(null);
    }
  }, [onDelete, subKriteriaToDelete]);


  return (
    <Card className="bg-card/50 border-border p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          {namaKriteriaUtama ? `Sub-Kriteria untuk ${namaKriteriaUtama}` : 'Atur Sub-Kriteria & Nilai Ideal'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
          <div className="flex-grow">
            <Label htmlFor={`sub_kriteria_name-${kriteriaId}`} className="block text-sm font-medium text-muted-foreground mb-1">
              Nama Sub-Kriteria
            </Label>
            <Input
              type="text"
              id={`sub_kriteria_name-${kriteriaId}`}
              value={newSubKriteriaName}
              onChange={(e) => setNewSubKriteriaName(e.target.value)}
              placeholder="Contoh: Penguasaan Python"
              required
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor={`nilai_ideal-${kriteriaId}`} className="block text-sm font-medium text-muted-foreground mb-1">
              Nilai Ideal (1-5)
            </Label>
            <Select
              value={newNilaiIdeal.toString()}
              onValueChange={(value) => setNewNilaiIdeal(parseInt(value))}
            >
              <SelectTrigger id={`nilai_ideal-${kriteriaId}`} className="w-full">
                <SelectValue placeholder="Pilih Nilai Ideal" />
              </SelectTrigger>
              <SelectContent>
                {SKALA_PENILAIAN.map(val => (
                  <SelectItem key={val} value={val.toString()}>{val}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button
              type="submit"
              className="gradient-blue flex-shrink-0"
            >
              {editingSubKriteria ? (
                <> <Save className="h-4 w-4 mr-2" /> Simpan Edit </>
              ) : (
                <> <Plus className="h-4 w-4 mr-2" /> Tambah </>
              )}
            </Button>
            {editingSubKriteria && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4 mr-2" /> Batal
              </Button>
            )}
          </div>
        </form>

        {currentSubCriteria.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/3">Sub-Kriteria</TableHead>
                  <TableHead className="text-center w-1/6">Nilai Ideal</TableHead>
                  <TableHead className="text-center w-1/6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSubCriteria.map((item) => (
                  <TableRow key={item.sub_kriteria_id}>
                    <TableCell className="font-medium">{item.nama_sub_kriteria}</TableCell>
                    <TableCell className="text-center">{item.nilai_ideal}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Dialog open={showDeleteConfirm && subKriteriaToDelete?.id === item.sub_kriteria_id} onOpenChange={setShowDeleteConfirm}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                              onClick={() => handleDeleteClick(item.sub_kriteria_id, item.nama_sub_kriteria)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Konfirmasi Penghapusan Sub-Kriteria</DialogTitle>
                              <DialogDescription>
                                Apakah Anda yakin ingin menghapus sub-kriteria "{subKriteriaToDelete?.nama}" ini? Aksi ini tidak dapat dibatalkan.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
                              <Button type="button" variant="destructive" onClick={confirmDelete}>Hapus</Button>
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
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">Belum ada sub-kriteria ditambahkan untuk kriteria ini.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PMSubCriteriaForm;
