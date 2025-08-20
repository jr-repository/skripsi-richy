// src/pages/AdminLogin.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_BASE_URL = 'https://sipemalem.my.id/backend-rekomendasi-karir';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Jika respons tidak berhasil, jangan coba parse JSON
        // Cek apakah ada pesan error dari server
        let errorMessage = "Terjadi kesalahan server. Mohon coba lagi.";
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (jsonError) {
          // Jika tidak bisa di-parse sebagai JSON, gunakan pesan default
          console.error("Gagal mengurai respons error sebagai JSON:", jsonError);
        }

        toast({
          title: "Login Gagal",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // Jika respons berhasil, parse data JSON
        const data = await response.json();
        
        // Login berhasil, simpan role dan nama ke localStorage
        localStorage.setItem('adminAuth', JSON.stringify({
          isLoggedIn: true,
          role: data.role,
          name: data.nama,
          userId: data.id,
        }));
        toast({
          title: "Login Berhasil",
          description: `Selamat datang, ${data.nama} sebagai ${data.role}`,
        });
        navigate('/admin');
      }
    } catch (error) {
      console.error("Kesalahan jaringan atau server:", error);
      toast({
        title: "Terjadi Kesalahan",
        description: "Tidak dapat terhubung ke server. Mohon periksa koneksi atau backend.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 border-border backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full gradient-blue flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-foreground">Panel Admin</CardTitle>
          <CardDescription>Masukkan kredensial untuk mengakses</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full gradient-blue" disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
          {/* <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Akun Demo:</strong><br />
              Email: superadmin@example.com<br />
              Password: admin123
            </p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;

