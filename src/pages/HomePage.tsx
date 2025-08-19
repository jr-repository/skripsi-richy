
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Users, 
  Shield, 
  TrendingUp, 
  CheckCircle, 
  Star,
  ArrowRight,
  BarChart3,
  Briefcase,
  GraduationCap,
  Award,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

const HomePage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const features = [
    {
      icon: <Target className="h-8 w-8 text-blue-400" />,
      title: 'Rekomendasi Akurat',
      description: 'Sistem menggunakan metode AHP dan Profile Matching untuk memberikan rekomendasi karier yang tepat berdasarkan profil Anda.'
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-400" />,
      title: 'Analisis Mendalam',
      description: 'Dapatkan analisis komprehensif tentang kesesuaian karier dengan kemampuan dan minat Anda.'
    },
    {
      icon: <Briefcase className="h-8 w-8 text-purple-400" />,
      title: 'Database Pekerjaan',
      description: 'Akses ribuan peluang karier dari berbagai industri yang telah terverifikasi.'
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-orange-400" />,
      title: 'Panduan Karier',
      description: 'Dapatkan panduan lengkap tentang persyaratan dan jalur karier yang sesuai dengan profil Anda.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Wijaya',
      role: 'Software Engineer',
      content: 'SPK Rekomendasi Karier membantu saya menemukan karier yang tepat sesuai dengan passion dan kemampuan saya.',
      avatar: '👩‍💻'
    },
    {
      name: 'Ahmad Rahman',
      role: 'Data Analyst',
      content: 'Sistemnya sangat akurat dalam menganalisis profil saya dan memberikan rekomendasi yang sesuai.',
      avatar: '👨‍💼'
    },
    {
      name: 'Lisa Chen',
      role: 'UI/UX Designer',
      content: 'Interface yang user-friendly dan hasil analisis yang detail sangat membantu dalam menentukan karier.',
      avatar: '👩‍🎨'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Pengguna Aktif', icon: <Users className="h-6 w-6" /> },
    { number: '500+', label: 'Pekerjaan Tersedia', icon: <Briefcase className="h-6 w-6" /> },
    { number: '95%', label: 'Tingkat Akurasi', icon: <Target className="h-6 w-6" /> },
    { number: '4.8/5', label: 'Rating Pengguna', icon: <Star className="h-6 w-6" /> }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded gradient-blue flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SPK Rekomendasi Karier</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin/login">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Mode Admin</span>
                </Button>
              </Link>
              <Link to="/user">
                <Button className="gradient-blue flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Mode User</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Temukan Karier Impian Anda
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              Sistem Pendukung Keputusan yang menggunakan metode AHP dan Profile Matching 
              untuk memberikan rekomendasi karier yang tepat sesuai dengan profil Anda
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/user">
                <Button size="lg" className="gradient-blue text-lg px-8 py-4">
                  Mulai Asesmen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-slate-900">
                  Panel Admin
                  <Shield className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-800 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4 text-blue-400">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Fitur Unggulan</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Teknologi canggih yang membantu Anda menemukan karier yang tepat
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/50 border-border hover:bg-card/70 transition-colors h-full">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Cara Kerja Sistem</h2>
            <p className="text-xl text-muted-foreground">
              Proses sederhana untuk mendapatkan rekomendasi karier yang akurat
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Isi Profil & Asesmen</h3>
              <p className="text-muted-foreground">
                Lengkapi informasi pribadi dan jawab pertanyaan asesmen tentang kemampuan dan minat Anda
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Analisis Data</h3>
              <p className="text-muted-foreground">
                Sistem menganalisis profil Anda menggunakan metode AHP dan Profile Matching
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Dapatkan Rekomendasi</h3>
              <p className="text-muted-foreground">
                Terima rekomendasi karier yang sesuai dengan profil dan analisis detail kecocokan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Testimoni Pengguna</h2>
            <p className="text-xl text-muted-foreground">
              Apa kata mereka yang telah menggunakan sistem kami
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={prevTestimonial}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <div className="text-center flex-1">
                    <div className="text-4xl mb-4">{testimonials[currentTestimonial].avatar}</div>
                    <blockquote className="text-lg text-foreground mb-4 italic">
                      "{testimonials[currentTestimonial].content}"
                    </blockquote>
                    <div className="font-semibold text-foreground">{testimonials[currentTestimonial].name}</div>
                    <div className="text-muted-foreground">{testimonials[currentTestimonial].role}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={nextTestimonial}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex justify-center space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentTestimonial ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      onClick={() => setCurrentTestimonial(index)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Siap Menemukan Karier Impian Anda?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pengguna yang telah menemukan karier yang tepat melalui sistem kami
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/user">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 rounded gradient-blue flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">SPK Rekomendasi Karier</h3>
              </div>
              <p className="text-gray-400">
                Sistem Pendukung Keputusan untuk membantu Anda menemukan karier yang tepat.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Fitur</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Asesmen Karier</li>
                <li>Rekomendasi Personal</li>
                <li>Analisis Mendalam</li>
                <li>Database Pekerjaan</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Kontak</h4>
              <div className="space-y-2 text-gray-400">
                <p>Email: info@spkkarier.com</p>
                <p>Telepon: (021) 1234-5678</p>
                <p>Alamat: Jakarta, Indonesia</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SPK Rekomendasi Karier. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
