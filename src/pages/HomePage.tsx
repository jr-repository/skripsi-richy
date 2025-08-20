import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  Users, 
  Shield, 
  BarChart3, 
  Target, 
  Star, 
  Zap, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Send
} from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Import images
import heroCareer from '@/assets/hero-career.jpg';
import careerAnalysis from '@/assets/career-analysis.jpg';
import teamWork from '@/assets/team-work.jpg';
import aiTechnology from '@/assets/ai-technology.jpg';

const HomePage = () => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<'admin' | 'user' | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out'
    });
  }, []);

  const handleModeSelect = (mode: 'admin' | 'user') => {
    setSelectedMode(mode);
    setTimeout(() => {
      navigate(`/${mode}`);
    }, 300);
  };

  const features = [
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Rekomendasi Akurat",
      description: "Sistem menggunakan metode AHP dan Profile Matching untuk memberikan rekomendasi karier yang tepat",
      image: careerAnalysis
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Analisis Mendalam", 
      description: "Dashboard analitik lengkap untuk memahami pola dan tren dalam rekomendasi karier",
      image: teamWork
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Proses Cepat",
      description: "Interface yang responsif dan intuitif untuk pengalaman pengguna yang optimal",
      image: aiTechnology
    }
  ];

  const carouselItems = [
    {
      title: "Temukan Karier Impian Anda",
      description: "Sistem pendukung keputusan modern dengan metode ilmiah untuk rekomendasi karier yang tepat",
      image: heroCareer,
      color: "from-blue-500 to-purple-600"
    },
    {
      title: "Analisis Mendalam & Akurat", 
      description: "Menggunakan metode AHP dan Profile Matching yang dikonfirmasi langsung oleh ahli",
      image: careerAnalysis,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Bersama Menuju Sukses",
      description: "Ribuan profesional telah menemukan jalan karier yang tepat dengan metode terpercaya",
      image: teamWork,
      color: "from-green-500 to-blue-600"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter subscription:', email);
    setEmail('');
    alert('Terima kasih! Anda telah berlangganan newsletter kami.');
  };

  // Auto slide carousel
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl"
        data-aos="fade-down"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Target className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  SPK Rekomendasi Karier
                </h1>
                <p className="text-sm text-muted-foreground font-medium">Sistem Pendukung Keputusan</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline" 
                onClick={() => handleModeSelect('admin')}
                className="font-medium"
              >
                <Shield className="h-4 w-4 mr-2" />
                Mode Admin
              </Button>
              <Button
                onClick={() => handleModeSelect('user')}
                className="font-medium"
              >
                <Users className="h-4 w-4 mr-2" />
                Mode User
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        {carouselItems.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <div 
              className="relative h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image})` }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 container mx-auto px-6 h-screen flex items-center">
                <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
                  {/* Left Content */}
                  <div 
                    className="space-y-8"
                    data-aos="fade-right"
                    data-aos-delay="300"
                  >
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-lg px-6 py-2">
                      Inovasi Terdepan
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                      {item.title}
                    </h1>
                    <p className="text-xl text-white/90 leading-relaxed">
                      {item.description}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        size="lg"
                        onClick={() => handleModeSelect('user')}
                        className="text-lg px-8 py-4 h-auto font-semibold"
                      >
                        <Users className="h-5 w-5 mr-2" />
                        Mulai Sebagai User
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleModeSelect('admin')}
                        className="text-lg px-8 py-4 h-auto font-semibold bg-white/10 border-white/30 text-white backdrop-blur-sm hover:bg-white/20"
                      >
                        <Shield className="h-5 w-5 mr-2" />
                        Panel Admin
                      </Button>
                    </div>
                  </div>

                  {/* Right Info Card */}
                  <div 
                    className="lg:justify-self-end"
                    data-aos="fade-left"
                    data-aos-delay="500"
                  >
                    <Card className="bg-white/10 border-white/20 backdrop-blur-xl text-white max-w-md">
                      <CardHeader className="pb-4">
                        <div className="bg-gradient-to-br from-primary to-secondary rounded-full w-16 h-16 flex items-center justify-center mb-4">
                          <Target className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl text-white">
                          Sistem Rekomendasi Terpercaya
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          <span>Metode AHP & Profile Matching</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-primary" />
                          <span>Dikonfirmasi Ahli Langsung</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Star className="h-5 w-5 text-primary" />
                          <span>Akurasi Tinggi & Terukur</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>

        {/* Carousel Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-muted/30 to-muted/50">
        <div className="container mx-auto px-6">
          <div 
            className="text-center mb-20"
            data-aos="fade-up"
          >
            <Badge className="mb-4 text-lg px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white">Fitur Unggulan</Badge>
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Metode Ilmiah Terpercaya
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Dilengkapi dengan metodologi AHP dan Profile Matching yang telah dikonfirmasi ahli untuk hasil akurat
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 200}
              >
                <Card className="group hover:scale-105 transition-all duration-500 hover:shadow-2xl border-0 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm overflow-hidden h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-gradient-to-br from-primary to-secondary backdrop-blur-sm rounded-full p-3 shadow-lg">
                        {feature.icon}
                      </div>
                    </div>
                  </div>
                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <CardDescription className="text-base leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Banner Cards */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div 
              data-aos="fade-right"
              className="space-y-8"
            >
              <Badge className="text-lg px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white">Mengapa Memilih Kami?</Badge>
              <h2 className="text-5xl font-bold leading-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Metode Ilmiah Terpercaya
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Menggunakan metode AHP (Analytical Hierarchy Process) dan Profile Matching yang telah dikonfirmasi langsung oleh ahli, 
                kami memberikan rekomendasi karier yang akurat, terukur, dan sesuai dengan kemampuan serta minat Anda.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-primary to-secondary rounded-full p-2">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-medium">Metode AHP & Profile Matching</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-primary to-secondary rounded-full p-2">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-medium">Dikonfirmasi ahli langsung</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-primary to-secondary rounded-full p-2">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-medium">Hasil terukur & akurat</span>
                </div>
              </div>
            </div>
            
            <div 
              data-aos="fade-left"
              className="relative"
            >
              <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-0 backdrop-blur-sm shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div className="bg-gradient-to-br from-primary to-secondary rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <Target className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">
                    Siap Memulai Perjalanan Karier Anda?
                  </h3>
                  <p className="text-muted-foreground mb-8 text-lg">
                    Bergabunglah dengan ribuan profesional yang telah menemukan 
                    jalur karier yang tepat melalui platform kami.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => handleModeSelect('user')}
                    className="text-lg px-8 py-4 h-auto font-semibold shadow-xl hover:shadow-2xl transition-all"
                  >
                    Mulai Sekarang
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Banners */}
      <section className="py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <Card 
              className="bg-gradient-to-br from-card to-primary/10 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              data-aos="fade-up"
            >
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-primary to-secondary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Analisis Komprehensif</h3>
                <p className="text-muted-foreground">
                  Penilaian menyeluruh terhadap kemampuan, minat, dan potensi karier Anda menggunakan metode AHP.
                </p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-card to-secondary/10 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-secondary to-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Rekomendasi Personal</h3>
                <p className="text-muted-foreground">
                  Saran karier yang disesuaikan dengan profil unik Anda melalui Profile Matching yang presisi.
                </p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-card to-accent/10 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-accent to-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Validasi Ahli</h3>
                <p className="text-muted-foreground">
                  Setiap rekomendasi telah melalui validasi dan konfirmasi dari ahli di bidang karier.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div 
            className="text-center mb-16"
            data-aos="fade-up"
          >
            <Badge className="mb-4 text-lg px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white">Galeri</Badge>
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Proses Rekomendasi Karier
            </h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              className="relative group overflow-hidden rounded-2xl aspect-square"
              data-aos="zoom-in"
            >
              <img 
                src={careerAnalysis} 
                alt="Analisis Karier"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="font-semibold">Analisis Data</p>
              </div>
            </div>
            
            <div 
              className="relative group overflow-hidden rounded-2xl aspect-square"
              data-aos="zoom-in"
              data-aos-delay="100"
            >
              <img 
                src={teamWork} 
                alt="Tim Kerja"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="font-semibold">Evaluasi Tim</p>
              </div>
            </div>
            
            <div 
              className="relative group overflow-hidden rounded-2xl aspect-square"
              data-aos="zoom-in"
              data-aos-delay="200"
            >
              <img 
                src={aiTechnology} 
                alt="Teknologi"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="font-semibold">Sistem Modern</p>
              </div>
            </div>
            
            <div 
              className="relative group overflow-hidden rounded-2xl aspect-square"
              data-aos="zoom-in"
              data-aos-delay="300"
            >
              <img 
                src={heroCareer} 
                alt="Karier Sukses"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="font-semibold">Hasil Optimal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Card Section - Half inside, half outside footer */}
      <section className="relative">
        <div className="container mx-auto px-6">
          <div 
            className="relative z-10 bg-gradient-to-br from-primary to-secondary rounded-3xl shadow-2xl overflow-hidden -mb-16"
            data-aos="fade-up"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
            <div className="relative z-10 p-12 text-center text-white">
              <h3 className="text-4xl font-bold mb-4">
                Tetap Terhubung dengan Kami
              </h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Dapatkan tips karier terbaru, informasi lowongan kerja, dan insight 
                tentang perkembangan dunia profesional langsung di inbox Anda.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="max-w-lg mx-auto">
                <div className="flex gap-4">
                  <Input
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70 backdrop-blur-sm"
                  />
                  <Button 
                    type="submit" 
                    variant="secondary"
                    className="px-8 bg-white text-primary hover:bg-white/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Berlangganan
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t pt-32 pb-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div 
              className="lg:col-span-2"
              data-aos="fade-up"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Target className="h-7 w-7 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  SPK Rekomendasi Karier
                </span>
              </div>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed max-w-md">
                Sistem pendukung keputusan modern dengan metode AHP dan Profile Matching untuk 
                rekomendasi karier yang akurat. Temukan jalur karier impian Anda bersama kami.
              </p>
            </div>

            {/* Contact Info */}
            <div 
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <h3 className="text-lg font-semibold mb-6">Kontak Kami</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <a 
                    href="mailto:richyjohannes@gmail.com"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    richyjohannes@gmail.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <a 
                    href="tel:+6281573635143"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    +62 815 7363 5143
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">
                    Yogyakarta, Indonesia
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div 
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <h3 className="text-lg font-semibold mb-6">Akses Cepat</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleModeSelect('user')}
                  className="block text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Mode User
                </button>
                <button
                  onClick={() => handleModeSelect('admin')}
                  className="block text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Panel Admin
                </button>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div 
            className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
            data-aos="fade-up"
            data-aos-delay="400"
          >
            <p className="text-muted-foreground text-center md:text-left">
              © 2024 SPK Rekomendasi Karier. All rights reserved.
            </p>
            
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;