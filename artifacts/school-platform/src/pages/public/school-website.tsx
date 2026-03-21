import { useParams, Link } from "wouter";
import { useGetPublicSchool, useGetPublicSchoolNotifications, useGetPublicSchoolGallery } from "@workspace/api-client-react";
import { Phone, Mail, MapPin, ChevronDown, GraduationCap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicSchoolWebsite() {
  const { slug } = useParams();
  
  const { data: school, isLoading } = useGetPublicSchool(slug || "");
  const { data: notices = [] } = useGetPublicSchoolNotifications(slug || "");
  const { data: gallery = [] } = useGetPublicSchoolGallery(slug || "");

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!school) return <div className="min-h-screen flex items-center justify-center text-2xl">School not found</div>;

  return (
    <div className="min-h-screen font-sans bg-white flex flex-col">
      {/* Top Bar */}
      <div className="bg-secondary text-secondary-foreground py-2 px-4 sm:px-8 text-sm flex flex-col sm:flex-row justify-between items-center z-50 relative">
        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
          <span className="text-primary font-bold tracking-wider text-xs">
            WE HAVE MORE THAN {school.yearsOfExperience || 20} YEARS OF EXPERIENCES
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 hidden md:flex text-gray-300">
            <Phone className="w-3 h-3 text-primary" /> <span>{school.phone || "+1 234 567 890"}</span>
          </div>
          <div className="flex items-center space-x-2 hidden lg:flex text-gray-300">
            <Mail className="w-3 h-3 text-primary" /> <span>{school.email || "info@school.edu"}</span>
          </div>
          <Link href="/student/login">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-none h-8 px-6 text-xs tracking-wider">
              STUDENT LOGIN
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Header / Nav */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={school.logoUrl || `${import.meta.env.BASE_URL}images/logo-placeholder.png`} 
              alt="Logo" 
              className="h-12 w-auto object-contain"
            />
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-secondary leading-none uppercase tracking-tight">
                {school.name}
              </h1>
              {school.tagline && <p className="text-xs text-gray-500 mt-1">{school.tagline}</p>}
            </div>
          </div>
          
          <nav className="hidden xl:flex items-center space-x-8 text-sm font-semibold text-gray-700">
            <a href="#" className="text-primary hover:text-primary transition-colors">HOME</a>
            <a href="#about" className="hover:text-primary transition-colors">ABOUT US</a>
            <div className="relative group cursor-pointer">
              <span className="flex items-center hover:text-primary transition-colors">
                MESSAGES <ChevronDown className="w-4 h-4 ml-1" />
              </span>
            </div>
            <a href="#facility" className="hover:text-primary transition-colors">FACILITY</a>
            <a href="#gallery" className="hover:text-primary transition-colors">GALLERY</a>
            <a href="#contact" className="hover:text-primary transition-colors">CONTACT US</a>
          </nav>
        </div>
      </header>

      {/* Notice Marquee */}
      {notices.length > 0 && (
        <div className="bg-red-600 text-white flex items-center h-10 overflow-hidden relative">
          <div className="bg-red-700 px-4 h-full flex items-center font-bold text-sm tracking-wider uppercase z-10 whitespace-nowrap shadow-[5px_0_10px_rgba(0,0,0,0.2)]">
            Latest Notice
          </div>
          <div className="flex-1 overflow-hidden relative h-full">
            <div className="animate-marquee whitespace-nowrap absolute top-1/2 -translate-y-1/2">
              {notices.map((n, i) => (
                <span key={n.id} className="mx-8 inline-flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></span>
                  <span className="font-medium">{n.title}:</span> <span className="ml-2 opacity-90">{n.content}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center bg-secondary overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={school.heroImageUrl || `${import.meta.env.BASE_URL}images/hero-bg.png`}
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
              alt="School Campus"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent"></div>
          </div>
          
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-12">
            <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight drop-shadow-lg uppercase tracking-tight">
              Welcome to <br/><span className="text-primary">{school.name}</span>
            </h2>
            <p className="text-xl text-gray-200 mb-10 font-medium max-w-2xl mx-auto drop-shadow">
              {school.mission || "Empowering students with knowledge, character, and vision for a brighter tomorrow."}
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/student/login">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg h-14 px-8 rounded-none font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(255,184,0,0.4)] transition-all hover:-translate-y-1">
                  Student Portal <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 text-primary font-bold tracking-widest uppercase text-sm mb-2">
                <span className="w-12 h-[2px] bg-primary"></span>
                <span>About Our School</span>
              </div>
              <h3 className="text-4xl font-display font-bold text-secondary leading-tight">
                Nurturing Excellence <br/>Since Day One
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {school.about || "We provide a holistic educational experience that fosters intellectual, social, and moral growth. Our dedicated faculty ensures every student reaches their full potential."}
              </p>
              
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-100 mt-8">
                <div>
                  <h4 className="text-4xl font-bold text-primary mb-2">{school.yearsOfExperience || 20}+</h4>
                  <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Years Experience</p>
                </div>
                <div>
                  <h4 className="text-4xl font-bold text-primary mb-2">100%</h4>
                  <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Commitment</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-primary translate-x-4 translate-y-4 rounded-2xl"></div>
              <img 
                src={school.heroImageUrl || `${import.meta.env.BASE_URL}images/hero-bg.png`}
                alt="About" 
                className="relative z-10 rounded-2xl shadow-xl w-full h-[500px] object-cover border-8 border-white"
              />
            </div>
          </div>
        </section>

        {/* Gallery Preview */}
        {gallery.length > 0 && (
          <section id="gallery" className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <div className="inline-flex items-center space-x-2 text-primary font-bold tracking-widest uppercase text-sm mb-2">
                  <span className="w-12 h-[2px] bg-primary"></span>
                  <span>Campus Life</span>
                  <span className="w-12 h-[2px] bg-primary"></span>
                </div>
                <h3 className="text-4xl font-display font-bold text-secondary">Photo Gallery</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.slice(0, 8).map(img => (
                  <div key={img.id} className="relative aspect-square group overflow-hidden bg-gray-200">
                    <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium px-4 text-center">{img.caption}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-secondary text-gray-300 pt-20 pb-10 border-t-4 border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-white p-2 rounded-lg inline-block">
                <img src={school.logoUrl || `${import.meta.env.BASE_URL}images/logo-placeholder.png`} alt="Logo" className="h-10 w-auto" />
              </div>
            </div>
            <p className="text-sm leading-relaxed opacity-80 mb-6">
              {school.tagline || "Providing quality education and shaping the leaders of tomorrow."}
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-lg mb-6 uppercase tracking-wider relative inline-block">
              Quick Links
              <span className="absolute bottom-[-8px] left-0 w-1/2 h-[2px] bg-primary"></span>
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-primary" /> Home</a></li>
              <li><a href="#about" className="hover:text-primary transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-primary" /> About Us</a></li>
              <li><a href="#facility" className="hover:text-primary transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-primary" /> Facilities</a></li>
              <li><a href="#gallery" className="hover:text-primary transition-colors flex items-center"><ChevronRight className="w-4 h-4 mr-1 text-primary" /> Gallery</a></li>
            </ul>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white font-bold text-lg mb-6 uppercase tracking-wider relative inline-block">
              Contact Us
              <span className="absolute bottom-[-8px] left-0 w-1/2 h-[2px] bg-primary"></span>
            </h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-primary mr-3 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{school.address || "123 Education Lane"}, {school.city}, {school.state}</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 text-primary mr-3 shrink-0" />
                <span>{school.phone || "Not available"}</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 text-primary mr-3 shrink-0" />
                <span>{school.email || "Not available"}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm opacity-60">
          <p>&copy; {new Date().getFullYear()} {school.name}. All Rights Reserved.</p>
          <p className="mt-2 md:mt-0">Powered by Replit School Platform</p>
        </div>
      </footer>
    </div>
  );
}
