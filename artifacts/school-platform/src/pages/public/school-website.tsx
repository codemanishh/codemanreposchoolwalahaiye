import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useGetPublicSchool, useGetPublicSchoolNotifications, useGetPublicSchoolGallery } from "@workspace/api-client-react";
import { Phone, Mail, MapPin, ChevronDown, ChevronRight, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActiveMessage = "principal" | "founder" | "president" | null;
type ActivePage = "home" | "about" | "messages" | "admission" | "facility" | "gallery" | "notice" | "contact";

export default function PublicSchoolWebsite() {
  const { slug } = useParams();
  const { data: school, isLoading } = useGetPublicSchool(slug || "");
  const { data: notices = [] } = useGetPublicSchoolNotifications(slug || "");
  const { data: gallery = [] } = useGetPublicSchoolGallery(slug || "");

  const [activePage, setActivePage] = useState<ActivePage>("home");
  const [activeMessage, setActiveMessage] = useState<ActiveMessage>(null);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (messagesRef.current && !messagesRef.current.contains(e.target as Node)) {
        setMessagesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );

  if (!school) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">School Not Found</h1>
        <p className="text-gray-400">The school you're looking for doesn't exist or is not active.</p>
      </div>
    </div>
  );

  const navItems = [
    { key: "home", label: "Home" },
    { key: "about", label: "About Us" },
    { key: "messages", label: "Messages", hasDropdown: true },
    { key: "admission", label: "Admission" },
    { key: "facility", label: "Facility" },
    { key: "gallery", label: "Gallery" },
    { key: "notice", label: "Notice" },
    { key: "contact", label: "Contact Us" },
  ] as const;

  const messageItems = [
    { key: "principal" as const, label: "From the Principal's Desk", field: school.principalMessage },
    { key: "founder" as const, label: "Founder's Message", field: school.founderMessage },
    { key: "president" as const, label: "President's Message", field: school.presidentMessage },
  ];

  const navigate = (page: ActivePage, msg?: ActiveMessage) => {
    setActivePage(page);
    setMessagesOpen(false);
    setMobileMenuOpen(false);
    if (msg) setActiveMessage(msg);
    else if (page !== "messages") setActiveMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen font-sans bg-white flex flex-col">
      {/* ── Top Bar ── */}
      <div className="bg-gray-900 text-white py-2 px-4 sm:px-8 text-xs flex flex-col sm:flex-row justify-between items-center gap-2">
        <span className="text-yellow-400 font-bold tracking-widest uppercase">
          WE HAVE MORE THAN {school.yearsOfExperience || 20} YEARS OF EXPERIENCES
        </span>
        <div className="flex items-center gap-6">
          {school.phone && (
            <span className="flex items-center gap-1.5 text-gray-300">
              <Phone className="w-3 h-3 text-yellow-400" /> {school.phone}
            </span>
          )}
          {school.email && (
            <span className="flex items-center gap-1.5 text-gray-300 hidden md:flex">
              <Mail className="w-3 h-3 text-yellow-400" /> {school.email}
            </span>
          )}
          <Link href="/student/login">
            <button className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-bold text-xs px-5 py-1.5 tracking-widest uppercase transition-colors">
              🔒 STUDENT LOGIN
            </button>
          </Link>
        </div>
      </div>

      {/* ── Sticky Nav ── */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo + Name */}
          <button onClick={() => navigate("home")} className="flex items-center gap-3 text-left">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded-full border-2 border-yellow-400 p-0.5" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-xl border-2 border-yellow-400">
                {school.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg sm:text-xl text-gray-900 leading-tight uppercase tracking-tight">{school.name}</h1>
              {school.tagline && <p className="text-xs text-gray-500">{school.tagline}</p>}
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-gray-700">
            {navItems.map(item => (
              item.key === "messages" ? (
                <div key="messages" className="relative" ref={messagesRef}>
                  <button
                    onClick={() => setMessagesOpen(prev => !prev)}
                    className={`flex items-center gap-1 px-3 py-2 rounded transition-colors ${activePage === "messages" ? "text-yellow-600 bg-yellow-50" : "hover:text-yellow-600 hover:bg-yellow-50"}`}
                  >
                    Messages <ChevronDown className={`w-3.5 h-3.5 transition-transform ${messagesOpen ? "rotate-180" : ""}`} />
                  </button>
                  {messagesOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-lg min-w-[220px] overflow-hidden z-50">
                      {messageItems.map(m => (
                        <button
                          key={m.key}
                          onClick={() => { navigate("messages", m.key); }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-yellow-50 hover:text-yellow-700 flex items-center gap-2 border-b border-gray-100 last:border-0 transition-colors ${activeMessage === m.key ? "bg-yellow-50 text-yellow-700 font-bold" : "text-gray-700"}`}
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-yellow-500" /> {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key as ActivePage)}
                  className={`px-3 py-2 rounded transition-colors ${activePage === item.key ? "text-yellow-600 bg-yellow-50 font-bold" : "hover:text-yellow-600 hover:bg-yellow-50"}`}
                >
                  {item.label}
                </button>
              )
            ))}
          </nav>

          {/* Mobile menu toggle */}
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(prev => !prev)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
            {navItems.map(item => (
              item.key === "messages" ? (
                <div key="messages">
                  <button
                    className="w-full text-left px-3 py-2 font-semibold text-gray-700 flex items-center justify-between"
                    onClick={() => setMessagesOpen(p => !p)}
                  >
                    Messages <ChevronDown className={`w-4 h-4 transition-transform ${messagesOpen ? "rotate-180" : ""}`} />
                  </button>
                  {messagesOpen && (
                    <div className="pl-4 space-y-1">
                      {messageItems.map(m => (
                        <button key={m.key} onClick={() => navigate("messages", m.key)} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-yellow-600 flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 text-yellow-500" /> {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key as ActivePage)}
                  className="w-full text-left px-3 py-2 font-semibold text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                >
                  {item.label}
                </button>
              )
            ))}
          </div>
        )}
      </header>

      {/* ── Notice Ticker ── */}
      {notices.length > 0 && (
        <div className="bg-red-600 text-white flex items-center h-10 overflow-hidden">
          <div className="bg-red-800 px-5 h-full flex items-center font-bold text-xs tracking-widest uppercase whitespace-nowrap shrink-0 shadow-[5px_0_10px_rgba(0,0,0,0.3)]">
            📢 Latest Notice
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="animate-marquee whitespace-nowrap inline-block">
              {[...notices, ...notices].map((n, i) => (
                <span key={`${n.id}-${i}`} className="mx-10 inline-flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full inline-block"></span>
                  <strong>{n.title}:</strong> {n.content}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────── PAGE CONTENT ─────────── */}
      <main className="flex-1">

        {/* ═══ HOME ═══ */}
        {activePage === "home" && (
          <>
            {/* Hero */}
            <section className="relative h-[70vh] min-h-[520px] flex items-center overflow-hidden bg-gray-900">
              <img
                src={school.heroImageUrl || `${import.meta.env.BASE_URL}images/hero-bg.png`}
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                alt="School Campus"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

              <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8 md:gap-0">
                {/* Left: School intro */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-yellow-400 text-sm font-bold tracking-widest uppercase mb-4">Welcome to</p>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight uppercase tracking-tight drop-shadow-2xl">
                    {school.name}
                  </h2>
                  {(school.city || school.state) && (
                    <p className="text-gray-300 text-lg mb-8 flex items-center justify-center md:justify-start gap-2">
                      <MapPin className="w-4 h-4 text-yellow-400" />
                      {[school.city, school.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <Link href="/student/login">
                      <button className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-bold text-sm px-8 py-4 uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-lg shadow-yellow-400/30">
                        🎓 STUDENT LOGIN
                      </button>
                    </Link>
                    <button onClick={() => navigate("about")} className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold text-sm px-8 py-4 uppercase tracking-widest transition-all hover:-translate-y-0.5">
                      ABOUT US →
                    </button>
                  </div>
                </div>

                {/* Right: Latest Notice panel */}
                {notices.length > 0 && (
                  <div className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-2xl max-h-80">
                    {/* Panel header */}
                    <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
                      <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0"></span>
                      <span className="text-white font-bold text-sm tracking-widest uppercase">Latest Notice</span>
                    </div>
                    {/* Notice list */}
                    <div className="flex-1 overflow-y-auto divide-y divide-white/10">
                      {notices.map((n, i) => (
                        <button
                          key={n.id}
                          onClick={() => navigate("notice")}
                          className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></span>
                            <div>
                              <p className="text-white font-semibold text-sm leading-snug group-hover:text-yellow-400 transition-colors line-clamp-1">
                                {n.title}
                              </p>
                              <p className="text-gray-300 text-xs mt-0.5 line-clamp-2 leading-relaxed">
                                {n.content}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {/* View all link */}
                    <button
                      onClick={() => navigate("notice")}
                      className="bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest py-2 text-center transition-colors"
                    >
                      View All Notices →
                    </button>
                  </div>
                )}
              </div>

              {/* Scroll indicator */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <ChevronDown className="w-6 h-6 text-yellow-400" />
              </div>
            </section>

            {/* Quick info strip */}
            <div className="bg-yellow-400 text-gray-900 py-4">
              <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-sm font-bold uppercase tracking-wider">
                {school.yearsOfExperience && <span>📅 {school.yearsOfExperience}+ Years of Excellence</span>}
                {school.phone && <span>📞 {school.phone}</span>}
                {school.email && <span>✉️ {school.email}</span>}
              </div>
            </div>

            {/* About preview */}
            <section className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-10 h-0.5 bg-yellow-400" />
                    <span className="text-yellow-600 font-bold uppercase tracking-widest text-xs">About Our School</span>
                  </div>
                  <h3 className="text-4xl font-bold text-gray-900 leading-tight">
                    <span className="text-gray-900">{school.name}</span>
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {school.about || "We provide a holistic educational experience that fosters intellectual, social, and moral growth. Our dedicated faculty ensures every student reaches their full potential."}
                  </p>
                  <div className="flex gap-6 pt-4">
                    <button onClick={() => navigate("about")} className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-bold text-sm px-6 py-3 uppercase tracking-wider transition-colors">
                      READ MORE →
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 border-4 border-yellow-400 translate-x-4 translate-y-4 rounded" />
                  <img
                    src={school.heroImageUrl || `${import.meta.env.BASE_URL}images/hero-bg.png`}
                    alt="About"
                    className="relative z-10 w-full h-80 object-cover rounded shadow-xl"
                  />
                </div>
              </div>
            </section>

            {/* Mission & Vision */}
            {(school.mission || school.vision) && (
              <section className="py-20 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-12">
                    <span className="text-yellow-400 font-bold uppercase tracking-widest text-xs">Our Purpose</span>
                    <h3 className="text-3xl font-bold mt-2">{school.name}</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    {school.mission && (
                      <div className="bg-gray-800 rounded-xl p-8 border-l-4 border-yellow-400">
                        <h4 className="font-bold text-yellow-400 uppercase tracking-wider text-sm mb-4">Our Mission</h4>
                        <p className="text-gray-300 leading-relaxed">{school.mission}</p>
                      </div>
                    )}
                    {school.vision && (
                      <div className="bg-gray-800 rounded-xl p-8 border-l-4 border-yellow-400">
                        <h4 className="font-bold text-yellow-400 uppercase tracking-wider text-sm mb-4">Our Vision</h4>
                        <p className="text-gray-300 leading-relaxed">{school.vision}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Gallery Preview */}
            {gallery.filter(g => !g.caption?.startsWith("__section__:")).length > 0 && (
              <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-12">
                    <span className="text-yellow-600 font-bold uppercase tracking-widest text-xs">Our Events</span>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">Photo Gallery</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {gallery.filter(g => !g.caption?.startsWith("__section__:")).slice(0, 8).map(img => (
                      <div key={img.id} className="aspect-square overflow-hidden group bg-gray-200 relative">
                        <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-white text-xs font-medium">{img.caption}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <button onClick={() => navigate("gallery")} className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-bold text-sm px-8 py-3 uppercase tracking-wider transition-colors">
                      VIEW ALL PHOTOS →
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ═══ ABOUT ═══ */}
        {activePage === "about" && (
          <div>
            <PageBanner title="About Us" school={school} />
            <section className="py-20 bg-white">
              <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="grid md:grid-cols-2 gap-16 items-start mb-16">
                  <div className="space-y-6">
                    <SectionHeading tag="Who We Are" title={school.name} />
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {school.about || "Welcome to our school — a place where knowledge meets inspiration, and every student is encouraged to reach for the stars."}
                    </p>
                    {school.yearsOfExperience && (
                      <div className="flex gap-8 py-6 border-y border-gray-100">
                        <Stat value={`${school.yearsOfExperience}+`} label="Years Experience" />
                        <Stat value="100%" label="Dedication" />
                      </div>
                    )}
                  </div>
                  {school.logoUrl ? (
                    <div className="flex justify-center">
                      <div className="border-4 border-yellow-400 p-3 rounded-xl shadow-xl bg-white inline-block">
                        <img src={school.logoUrl} alt="School Logo" className="w-64 h-64 object-contain" />
                      </div>
                    </div>
                  ) : (
                    <img src={school.heroImageUrl || `${import.meta.env.BASE_URL}images/hero-bg.png`} alt="School" className="rounded-xl shadow-xl w-full h-72 object-cover" />
                  )}
                </div>

                {(school.mission || school.vision) && (
                  <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {school.mission && (
                      <div className="bg-gray-900 text-white rounded-xl p-8 border-l-4 border-yellow-400">
                        <h4 className="font-bold text-yellow-400 uppercase tracking-wider text-sm mb-4">Our Mission</h4>
                        <p className="text-gray-300 leading-relaxed">{school.mission}</p>
                      </div>
                    )}
                    {school.vision && (
                      <div className="bg-yellow-400 text-gray-900 rounded-xl p-8">
                        <h4 className="font-bold text-gray-900 uppercase tracking-wider text-sm mb-4">Our Vision</h4>
                        <p className="text-gray-800 leading-relaxed">{school.vision}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ═══ MESSAGES ═══ */}
        {activePage === "messages" && (
          <div>
            <PageBanner title="Messages" school={school} />
            <section className="py-16 bg-gray-50">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-12 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                  {messageItems.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setActiveMessage(m.key)}
                      className={`flex-1 min-w-[160px] py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${activeMessage === m.key ? "bg-yellow-400 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
                    >
                      {m.label.replace("From the ", "").replace("'s Message", " Message").replace("'s Desk", " Desk")}
                    </button>
                  ))}
                </div>

                {messageItems.map(m => (
                  activeMessage === m.key && (
                    <div key={m.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gray-900 px-8 py-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-gray-900 text-xl">
                          {m.label.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-xl">{m.label}</h3>
                          <p className="text-gray-400 text-sm">{school.name}</p>
                        </div>
                      </div>
                      <div className="p-8 md:p-12">
                        {m.field ? (
                          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                            <p className="text-4xl text-yellow-400 font-serif mb-4 leading-none">"</p>
                            {m.field.split("\n").filter(Boolean).map((para, i) => (
                              <p key={i} className="mb-4 text-gray-700 leading-relaxed text-lg">{para}</p>
                            ))}
                            <p className="text-4xl text-yellow-400 font-serif text-right mt-4 leading-none">"</p>
                          </div>
                        ) : (
                          <div className="text-center py-16 text-gray-400">
                            <p className="text-6xl mb-4">📝</p>
                            <p className="text-lg">Message not available yet.</p>
                            <p className="text-sm mt-2">The school admin can add this from the School Portal.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ))}

                {!activeMessage && (
                  <div className="grid md:grid-cols-3 gap-6">
                    {messageItems.map(m => (
                      <button
                        key={m.key}
                        onClick={() => setActiveMessage(m.key)}
                        className="bg-white rounded-xl p-8 border border-gray-200 hover:border-yellow-400 hover:shadow-lg transition-all text-left group"
                      >
                        <div className="w-12 h-12 bg-yellow-100 group-hover:bg-yellow-400 rounded-full flex items-center justify-center font-bold text-yellow-600 group-hover:text-gray-900 text-xl mb-4 transition-colors">
                          {m.label.charAt(0)}
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">{m.label}</h4>
                        <p className="text-gray-500 text-sm line-clamp-3">
                          {m.field || "Click to read the message..."}
                        </p>
                        <span className="text-yellow-600 text-sm font-semibold mt-4 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read Message <ChevronRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ═══ ADMISSION ═══ */}
        {activePage === "admission" && (
          <div>
            <PageBanner title="Admission Criteria & Fee Structure" school={school} />
            <section className="py-20 bg-white">
              <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <SectionHeading tag="Admissions" title="Admission Criteria & Fee Structure" />
                <div className="mt-8">
                  {school.feeStructure ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                      <div
                        className="prose prose-sm max-w-none table-auto w-full fee-table"
                        dangerouslySetInnerHTML={{ __html: school.feeStructure }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <p className="text-5xl mb-4">📋</p>
                      <p className="text-gray-500 text-lg">Fee structure not published yet.</p>
                      <p className="text-gray-400 text-sm mt-2">Please contact the school for admission details.</p>
                    </div>
                  )}

                  {school.phone && (
                    <div className="mt-12 bg-yellow-400 rounded-xl p-8 text-center">
                      <h4 className="font-bold text-gray-900 text-xl mb-2">For Admission Enquiries</h4>
                      <p className="text-gray-800 mb-4">Contact us directly for more information</p>
                      <div className="flex flex-wrap justify-center gap-4">
                        {school.phone && (
                          <a href={`tel:${school.phone}`} className="bg-gray-900 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors">
                            <Phone className="w-4 h-4" /> {school.phone}
                          </a>
                        )}
                        {school.email && (
                          <a href={`mailto:${school.email}`} className="bg-gray-900 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors">
                            <Mail className="w-4 h-4" /> {school.email}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══ FACILITY ═══ */}
        {activePage === "facility" && (
          <div>
            <PageBanner title="Our Facility" school={school} />
            <section className="py-20 bg-white">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <SectionHeading tag="Infrastructure" title="Our Facilities" />
                {school.facilities ? (
                  <div
                    className="mt-8 prose prose-lg max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: school.facilities }}
                  />
                ) : (
                  (() => {
                    const facilityImages = gallery.filter(g => g.caption?.startsWith("__section__:facility-"));
                    const FACILITY_LABELS: Record<string, string> = {
                      "facility-digital": "Digital Class Room",
                      "facility-transport": "Transportation",
                      "facility-computer": "Computer Lab",
                      "facility-sports": "Sports",
                      "facility-cocurr": "Co-curricular Activities",
                      "facility-library": "Library",
                      "facility-water": "RO Water",
                      "facility-lab": "Science Lab",
                    };
                    if (facilityImages.length > 0) {
                      return (
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                          {facilityImages.map(img => {
                            const key = img.caption?.replace("__section__:", "") || "";
                            return (
                              <div key={img.id} className="group relative overflow-hidden rounded-xl shadow-md bg-gray-100 aspect-square">
                                <img src={img.url} alt={FACILITY_LABELS[key] || key} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                  <p className="text-white font-bold text-sm">{FACILITY_LABELS[key] || key}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {["Digital Class Room","Transportation","Computer Lab","Sports","Co-curricular Activities","Library","RO Water","Science Lab"].map(name => (
                          <div key={name} className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 text-center">
                            <p className="text-3xl mb-2">🏫</p>
                            <p className="text-gray-500 text-sm font-medium">{name}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </section>
          </div>
        )}

        {/* ═══ GALLERY ═══ */}
        {activePage === "gallery" && (
          <div>
            <PageBanner title="Gallery" school={school} />
            <section className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <SectionHeading tag="Campus Life" title="Photo Gallery" />
                <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.filter(g => !g.caption?.startsWith("__section__:")).map(img => (
                    <div key={img.id} className="aspect-square overflow-hidden group bg-gray-100 relative rounded-lg shadow-sm">
                      <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      {img.caption && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-white text-sm font-medium">{img.caption}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {gallery.filter(g => !g.caption?.startsWith("__section__:")).length === 0 && (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <p className="text-5xl mb-4">🖼️</p>
                      <p className="text-gray-500 text-lg">No gallery images yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══ NOTICE ═══ */}
        {activePage === "notice" && (
          <div>
            <PageBanner title="Notice Board" school={school} />
            <section className="py-20 bg-white">
              <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <SectionHeading tag="Announcements" title="Notice Board" />
                <div className="mt-8 space-y-4">
                  {notices.length > 0 ? (
                    notices.map((n, i) => (
                      <div key={n.id} className="flex gap-4 bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-yellow-400 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-gray-900">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{n.title}</h4>
                          <p className="text-gray-600 mt-1 leading-relaxed">{n.content}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <p className="text-5xl mb-4">📋</p>
                      <p className="text-gray-500 text-lg">No notices published yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══ CONTACT ═══ */}
        {activePage === "contact" && (
          <div>
            <PageBanner title="Contact Us" school={school} />
            <section className="py-20 bg-white">
              <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <SectionHeading tag="Get in Touch" title="Contact Us" />
                <div className="mt-10 grid md:grid-cols-2 gap-12 items-start">
                  <div className="space-y-6">
                    {school.address && (
                      <ContactCard icon={<MapPin className="w-5 h-5" />} label="Address">
                        {school.address}{school.city ? `, ${school.city}` : ""}{school.state ? `, ${school.state}` : ""}
                      </ContactCard>
                    )}
                    {school.phone && (
                      <ContactCard icon={<Phone className="w-5 h-5" />} label="Phone Number">
                        <a href={`tel:${school.phone}`} className="hover:text-yellow-600 transition-colors">{school.phone}</a>
                      </ContactCard>
                    )}
                    {school.email && (
                      <ContactCard icon={<Mail className="w-5 h-5" />} label="Email Address">
                        <a href={`mailto:${school.email}`} className="hover:text-yellow-600 transition-colors">{school.email}</a>
                      </ContactCard>
                    )}

                    {school.mapUrl && (
                      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-64">
                        <iframe src={school.mapUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen title="School Location" />
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-900 rounded-2xl p-8 text-white">
                    <h4 className="font-bold text-xl mb-6 text-yellow-400">Quick Contact</h4>
                    <div className="space-y-4">
                      <input type="text" placeholder="Your Full Name" className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-500" />
                      <input type="tel" placeholder="Phone Number" className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-500" />
                      <input type="email" placeholder="Email Address" className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-500" />
                      <textarea placeholder="Your Message" rows={4} className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-500 resize-none" />
                      <button className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-bold py-3 rounded-lg uppercase tracking-wider transition-colors">
                        SEND MESSAGE →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8 border-t-4 border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            {school.logoUrl && (
              <div className="bg-white w-16 h-16 rounded-full p-1 mb-4 inline-flex items-center justify-center">
                <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-full" />
              </div>
            )}
            <h4 className="text-white font-bold text-lg mb-2">{school.name}</h4>
            <p className="text-sm leading-relaxed opacity-70">{school.tagline || "Providing quality education and shaping the leaders of tomorrow."}</p>
          </div>
          <div>
            <FooterHeading>Quick Links</FooterHeading>
            <ul className="space-y-2 text-sm">
              {["home","about","admission","facility","gallery","notice","contact"].map(p => (
                <li key={p}>
                  <button onClick={() => navigate(p as ActivePage)} className="hover:text-yellow-400 transition-colors flex items-center gap-1.5 text-left">
                    <ChevronRight className="w-3 h-3 text-yellow-500" />
                    {p.charAt(0).toUpperCase() + p.slice(1).replace("-"," ")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <FooterHeading>Messages</FooterHeading>
            <ul className="space-y-2 text-sm">
              {messageItems.map(m => (
                <li key={m.key}>
                  <button onClick={() => navigate("messages", m.key)} className="hover:text-yellow-400 transition-colors flex items-center gap-1.5 text-left">
                    <ChevronRight className="w-3 h-3 text-yellow-500" />
                    {m.label.replace("From the ", "")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <FooterHeading>Contact Info</FooterHeading>
            <ul className="space-y-3 text-sm">
              {school.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{school.address}{school.city ? `, ${school.city}` : ""}{school.state ? `, ${school.state}` : ""}</span>
                </li>
              )}
              {school.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-yellow-400" />
                  <a href={`tel:${school.phone}`} className="hover:text-yellow-400 transition-colors">{school.phone}</a>
                </li>
              )}
              {school.email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-yellow-400" />
                  <a href={`mailto:${school.email}`} className="hover:text-yellow-400 transition-colors">{school.email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center text-xs opacity-50">
          <p>&copy; {new Date().getFullYear()} {school.name} | All Rights Reserved</p>
          <p className="mt-2 md:mt-0">Developed by : aceit</p>
        </div>
      </footer>

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .fee-table table { width: 100%; border-collapse: collapse; }
        .fee-table th, .fee-table td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 14px; }
        .fee-table th { background: #1f2937; color: white; font-weight: bold; }
        .fee-table tr:nth-child(even) { background: #f9fafb; }
      `}</style>
    </div>
  );
}

function PageBanner({ title, school }: { title: string; school: any }) {
  return (
    <div className="relative h-48 bg-gray-900 flex items-center justify-center overflow-hidden">
      {school.heroImageUrl && (
        <img src={school.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-gray-900" />
      <div className="relative z-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wider">{title}</h2>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-400">
          <span className="text-yellow-400">Home</span>
          <ChevronRight className="w-3 h-3" />
          <span>{title}</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-0.5 bg-yellow-400" />
        <span className="text-yellow-600 font-bold uppercase tracking-widest text-xs">{tag}</span>
      </div>
      <h3 className="text-3xl font-bold text-gray-900">{title}</h3>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-yellow-500">{value}</p>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function ContactCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start p-5 bg-gray-50 rounded-xl border border-gray-200">
      <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-gray-900 shrink-0">{icon}</div>
      <div>
        <p className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-1">{label}</p>
        <p className="text-gray-600 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-5 pb-2 border-b border-gray-700 inline-block w-full">
      {children}
    </h4>
  );
}
