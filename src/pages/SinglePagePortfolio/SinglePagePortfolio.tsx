import profileImage from '@/assets/413A8961.jpg';
import logoImage from '@/assets/logo.png';
// Icons are now inline SVGs with gradients for consistent styling
import { motion, useScroll } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { certifications, education, experiences, projects, skills } from './data';
import './SinglePagePortfolio.css';

/**
 * Story Portfolio - A narrative journey through professional experience
 * 
 * Design Philosophy:
 * - Story-driven structure with "chapters" instead of sections
 * - Warm, organic color palette (terracotta, gold, sage)
 * - Unique typography: Space Grotesk + Crimson Pro
 * - Minimal, editorial aesthetic
 * - Content simplified to avoid information overload
 */
export function SinglePagePortfolio() {
    const [activeSection, setActiveSection] = useState('home');
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    const sections = useMemo(() => ['home', 'about', 'journey', 'works', 'services', 'contact'], []);
    const navItems = useMemo(() => ['Prologue', 'Story', 'Journey', 'Works', 'Services', 'Epilogue'], []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight / 2;
            setShowBackToTop(window.scrollY > 300);

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        let ticking = false;
        const throttledScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });
        return () => window.removeEventListener('scroll', throttledScroll);
    }, [sections]);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [mobileMenuOpen]);

    const scrollToSection = useCallback((sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
        }
    }, []);

    const handleNavClick = useCallback((index: number) => {
        scrollToSection(sections[index]);
        setMobileMenuOpen(false);
    }, [scrollToSection, sections]);

    return (
        <div className="story-portfolio" ref={containerRef}>
            {/* Navigation */}
            <motion.nav
                className="floating-nav"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="nav-container">
                    <div className="nav-logo">
                        <img src={logoImage} alt="Dino Cosic" className="nav-logo-img" />
                    </div>

                    <div className="nav-links">
                        {navItems.map((item, index) => (
                            <button
                                key={item}
                                className={`nav-link ${activeSection === sections[index] ? 'active' : ''}`}
                                onClick={() => handleNavClick(index)}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    <button
                        className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <>
                    <motion.div
                        className="mobile-menu-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <motion.div
                        className="mobile-menu"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        transition={{ type: 'tween', duration: 0.3 }}
                    >
                        <div className="mobile-menu-header">
                            <img src={logoImage} alt="Dino Cosic" className="mobile-menu-logo" />
                        </div>
                        <div className="mobile-menu-content">
                            {navItems.map((item, index) => (
                                <button
                                    key={item}
                                    className={`mobile-menu-link ${activeSection === sections[index] ? 'active' : ''}`}
                                    onClick={() => handleNavClick(index)}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}

            {/* Progress */}
            <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} />

            {/* Global SVG Gradient Definitions */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e85d04" />
                        <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="iconGradientTeal" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                    <linearGradient id="iconGradientViolet" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e85d04" />
                        <stop offset="50%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                </defs>
            </svg>

            {/* ═══════════════════════════════════════════ */}
            {/* PROLOGUE - Hero Section */}
            {/* ═══════════════════════════════════════════ */}
            <section id="home" className="prologue">
                <div className="prologue-bg">
                    <div className="grain-overlay" />
                    <div className="grid-pattern" />
                    <div className="ambient-glow glow-1" />
                    <div className="ambient-glow glow-2" />
                    <div className="ambient-glow glow-3" />
                </div>

                <div className="prologue-content">
                    <motion.div
                        className="prologue-text"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <motion.span
                            className="greeting"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            Hello, I'm
                        </motion.span>

                        <motion.h1
                            className="main-title"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        >
                            <span className="name">Dino Cosic</span>
                            <span className="role">Product Engineer & Consultant helping startups scale and enterprises modernize</span>
                        </motion.h1>

                        <motion.p
                            className="tagline"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                        >
                            From <strong>legacy migrations</strong> to <strong>SaaS development</strong> —
                            I partner with founders and CTOs to build scalable products and optimize engineering outcomes.
                            Trusted by startups and Fortune 500 alike.
                        </motion.p>

                        <motion.div
                            className="prologue-stats"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.9 }}
                        >
                            <div className="stat">
                                <span className="stat-value">6+</span>
                                <span className="stat-label">Years Experience</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">3+</span>
                                <span className="stat-label">Startups Launched</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">5+</span>
                                <span className="stat-label">Migrations Delivered</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">350+</span>
                                <span className="stat-label">Students Mentored</span>
                            </div>
                        </motion.div>

                        <motion.div
                            className="prologue-cta"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.1 }}
                        >
                            <button className="btn btn-primary" onClick={() => scrollToSection('contact')}>
                                Let's Work Together
                            </button>
                            <button className="btn btn-secondary" onClick={() => scrollToSection('works')}>
                                View My Work
                            </button>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="prologue-image"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="image-wrapper">
                            {/* Animated rings */}
                            <motion.div
                                className="image-ring ring-1"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.div
                                className="image-ring ring-2"
                                animate={{ rotate: -360 }}
                                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.div
                                className="image-ring ring-3"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            />

                            {/* Glow effect */}
                            <div className="image-glow" />

                            {/* Photo container with morphing shape */}
                            <div className="image-container">
                                <img
                                    src={profileImage}
                                    alt="Dino Cosic - Senior Software Engineer"
                                    className="hero-image"
                                    loading="eager"
                                />
                            </div>

                            {/* Floating tech elements */}
                            <div className="floating-elements">
                                <motion.span
                                    className="float-element float-1"
                                    animate={{ y: [-10, 10, -10] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    ⚡
                                </motion.span>
                                <motion.span
                                    className="float-element float-2"
                                    animate={{ y: [10, -10, 10] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    ☁️
                                </motion.span>
                                <motion.span
                                    className="float-element float-3"
                                    animate={{ y: [-8, 8, -8] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    🚀
                                </motion.span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    className="scroll-hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.5 }}
                    onClick={() => scrollToSection('about')}
                >
                    <span>Explore</span>
                    <motion.div
                        className="scroll-line"
                        animate={{ scaleY: [1, 0.6, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* CHAPTER ONE - About */}
            {/* ═══════════════════════════════════════════ */}
            <section id="about" className="chapter about-chapter">
                <motion.div
                    className="about-content"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="about-narrative">
                        <motion.span
                            className="chapter-number"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            Chapter I
                        </motion.span>
                        <motion.h2
                            className="chapter-title"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            The <em>Story</em>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            Six years ago, I wrote my first line of production code. What began as curiosity
                            quickly became a calling — to architect systems that scale, to lead teams that deliver,
                            and to mentor the next generation of engineers.
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            Today, I specialize in enterprise modernization — transforming legacy .NET monoliths into
                            cloud-native microservices on Azure. I've architected mission-critical backends for
                            financial platforms, led teams at Fortune 500 companies, and shipped products handling
                            20,000+ concurrent users. At the University of Sarajevo, I mentor 100+ students annually,
                            achieving 95% course satisfaction.
                        </motion.p>

                        <motion.div
                            className="philosophy"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                        >
                            <p className="philosophy-quote">
                                "Great software isn't just about code — it's about understanding
                                the problem deeply enough to create elegant, maintainable solutions."
                            </p>
                        </motion.div>
                    </div>

                    {/* Skills Mountain Range */}
                    <motion.div
                        className="skills-mountains"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                    >
                        <div className="mountain-range">
                            {/* Background layers for depth */}
                            <div className="mountain-bg-layer layer-3" />
                            <div className="mountain-bg-layer layer-2" />
                            <div className="mountain-bg-layer layer-1" />

                            {/* Snow caps decorative line */}
                            <div className="snow-line" />

                            {/* Mountain peaks */}
                            <div className="peaks-container">
                                {skills.peaks.map((peak, index) => (
                                    <motion.div
                                        key={peak.name}
                                        className={`mountain-peak ${peak.color}`}
                                        style={{ '--peak-height': `${peak.height}%` } as React.CSSProperties}
                                        initial={{ scaleY: 0 }}
                                        whileInView={{ scaleY: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.8,
                                            delay: index * 0.1,
                                            ease: [0.16, 1, 0.3, 1]
                                        }}
                                        whileHover={{ y: -8 }}
                                    >
                                        {/* Peak flag */}
                                        <div className="peak-flag">
                                            <span className="flag-years">
                                                {peak.years ? `${peak.years}y` : `${peak.months}m`}
                                            </span>
                                        </div>

                                        {/* Peak info card */}
                                        <div className="peak-card">
                                            <h4 className="peak-name">{peak.name}</h4>
                                            <div className="peak-techs">
                                                {peak.items.map((tech) => (
                                                    <span key={tech} className="peak-tech">{tech}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mountain shape */}
                                        <div className="mountain-shape">
                                            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <polygon points="50,0 100,100 0,100" />
                                            </svg>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Ground line */}
                            <div className="ground-line" />
                        </div>

                        {/* Legend */}
                        <div className="mountain-legend">
                            <div className="legend-item">
                                <div className="legend-peak tall" />
                                <span>Deep expertise</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-peak medium" />
                                <span>Strong skills</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-peak short" />
                                <span>Explored</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* CHAPTER TWO - Journey (Experience + Education) */}
            {/* ═══════════════════════════════════════════ */}
            <section id="journey" className="chapter journey-chapter">
                <motion.div
                    className="journey-content"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="chapter-number">Chapter II</span>
                    <h2 className="chapter-title">The <em>Journey</em></h2>
                    <p className="chapter-subtitle">
                        Every expert was once a beginner. Here's the path that shaped who I am today.
                    </p>

                    {/* Experience Timeline */}
                    <div className="journey-section">
                        <div className="journey-section-header">
                            <span className="journey-section-label">Professional Experience</span>
                            <div className="journey-section-line" />
                        </div>

                        <div className="timeline">
                            {experiences.map((exp, index) => (
                                <motion.div
                                    key={index}
                                    className="timeline-item"
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                >
                                    <div className="timeline-marker" />
                                    <span className="timeline-period">{exp.period}</span>
                                    <h3 className="timeline-role">{exp.role}</h3>
                                    <span className="timeline-company">{exp.company}</span>
                                    <p className="timeline-summary">{exp.summary}</p>
                                    <div className="timeline-tech">
                                        {exp.technologies.map((tech) => (
                                            <span key={tech} className="tech-tag">{tech}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Education & Certifications */}
                    <div className="journey-section">
                        <div className="journey-section-header">
                            <span className="journey-section-label">Education & Certifications</span>
                            <div className="journey-section-line" />
                        </div>

                        <div className="education-grid">
                            {education.map((edu, index) => (
                                <motion.div
                                    key={index}
                                    className="education-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <svg className="education-icon" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                    </svg>
                                    <h3 className="education-degree">{edu.degree}</h3>
                                    <span className="education-field">{edu.field}</span>
                                    <p className="education-institution">{edu.institution}</p>
                                    <span className="education-period">{edu.period}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="certifications-grid">
                            {certifications.map((cert, index) => (
                                <motion.div
                                    key={index}
                                    className="certification-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <svg className="certification-icon" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradientTeal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    <h4 className="certification-name">{cert.name}</h4>
                                    <span className="certification-issuer">{cert.issuer}</span>
                                    {cert.period && <span className="certification-period">{cert.period}</span>}
                                    <p className="certification-description">{cert.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* CHAPTER THREE - Works (Projects) */}
            {/* ═══════════════════════════════════════════ */}
            <section id="works" className="chapter works-chapter">
                <motion.div
                    className="works-content"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="chapter-number">Chapter III</span>
                    <h2 className="chapter-title">The <em>Works</em></h2>
                    <p className="chapter-subtitle">
                        Selected projects that shaped my craft.
                    </p>

                    <div className="works-grid">
                        {projects.map((project, index) => {
                            // Project-specific SVG icons
                            const projectIcons: { [key: string]: JSX.Element } = {
                                '📈': (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 3v18h18" />
                                        <path d="M18 9l-5 5-4-4-6 6" />
                                        <path d="M14 9h4v4" />
                                    </svg>
                                ),
                                '🎫': (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3v0a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v0a3 3 0 0 1 3-3v0a3 3 0 0 1-3-3z" />
                                        <path d="M9 6v12" strokeDasharray="2 2" />
                                    </svg>
                                ),
                                '🏛️': (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 21h18M4 21V10M20 21V10M12 3L2 9h20L12 3z" />
                                        <path d="M8 21v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" />
                                    </svg>
                                ),
                                '✍️': (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 19l7-7 3 3-7 7-3-3z" />
                                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                        <path d="M2 2l7.586 7.586" />
                                        <circle cx="11" cy="11" r="2" />
                                    </svg>
                                ),
                            };
                            return (
                                <motion.div
                                    key={index}
                                    className="work-card"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                >
                                    <h3 className="work-title">
                                        <span className="work-icon">{projectIcons[project.icon] || project.icon}</span>
                                        {project.title}
                                    </h3>
                                    <p className="work-description">{project.description}</p>
                                    <div className="work-impact">
                                        <strong>Impact:</strong> {project.impact}
                                    </div>
                                    <div className="work-stack">
                                        {project.technologies.map((tech) => (
                                            <span key={tech} className="tech-tag">{tech}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* CHAPTER FOUR - Services */}
            {/* ═══════════════════════════════════════════ */}
            <section id="services" className="chapter services-chapter">
                <motion.div
                    className="services-content"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="chapter-number">Chapter IV</span>
                    <h2 className="chapter-title">How I Can <em>Help</em></h2>
                    <p className="chapter-subtitle">
                        Specialized expertise for your most pressing technical and organizational challenges.
                    </p>

                    <div className="services-grid">
                        {/* Legacy Modernization */}
                        <motion.div
                            className="service-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0 }}
                        >
                            <div className="service-header">
                                <div className="service-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                        <path d="M21 3v5h-5" />
                                        <path d="M12 7v5l3 3" />
                                    </svg>
                                </div>
                                <div className="service-tooltip-trigger">
                                    <span className="tooltip-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                                            <path d="M5 19l1 3 3-1" />
                                            <path d="M19 5l-1-3-3 1" />
                                        </svg>
                                    </span>
                                    <div className="service-tooltip">
                                        <strong>AI-Powered Modernization</strong>
                                        <p>Accelerate migrations using AI-assisted analysis, dependency mapping, automated code suggestions, and structural refactoring. Reduce technical debt faster with higher accuracy.</p>
                                    </div>
                                </div>
                            </div>
                            <h3 className="service-title">Legacy Modernization</h3>
                            <p className="service-description">Transform aging monolithic systems into clean, modern, and maintainable architectures. I lead full modernization cycles — from deep-dive assessments to hands-on execution — backed by 6+ years of real-world enterprise experience.</p>
                        </motion.div>

                        {/* Cloud & Backend Development */}
                        <motion.div
                            className="service-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="service-header">
                                <div className="service-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z" />
                                        <path d="M12 12v4" />
                                        <path d="M12 20v1" />
                                        <path d="M8 12v8" />
                                        <path d="M16 12v8" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="service-title">Cloud & Backend Development</h3>
                            <p className="service-description">End-to-end backend engineering for startups and enterprises. I build scalable, production-ready platforms capable of handling thousands of concurrent users on Azure cloud infrastructure. From MVPs to mission-critical distributed systems, I deliver robust architectures built for growth.</p>
                        </motion.div>

                        {/* Product & Technical Consultancy */}
                        <motion.div
                            className="service-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="service-header">
                                <div className="service-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                                        <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="service-title">Product & Technical Consultancy</h3>
                            <p className="service-description">Strategic guidance to accelerate your product and engineering outcomes. I partner with founders, CTOs, and product teams to translate business goals into technical roadmaps, conduct architecture reviews, optimize development workflows, and help you ship faster with confidence.</p>
                        </motion.div>

                        {/* AI-Guided Development Enablement */}
                        <motion.div
                            className="service-card featured wide"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className="service-header">
                                <div className="service-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradientTeal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        {/* Brain shape */}
                                        <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 5.28.5" />
                                        <path d="M12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1-1.32 4.24 3 3 0 0 1-.34 5.58 2.5 2.5 0 0 1-5.28.5" />
                                        {/* Circuit nodes */}
                                        <circle cx="12" cy="8" r="1" fill="url(#iconGradientTeal)" />
                                        <circle cx="9" cy="13" r="1" fill="url(#iconGradientTeal)" />
                                        <circle cx="15" cy="13" r="1" fill="url(#iconGradientTeal)" />
                                        <path d="M12 8v2M9 13l3-3 3 3" />
                                    </svg>
                                </div>
                                <span className="service-badge">High-Impact, In-Demand</span>
                            </div>
                            <h3 className="service-title">AI-Guided Development Enablement</h3>
                            <p className="service-description">Empower your engineering team to achieve next-level speed, clarity, and maintainability through AI-guided programming practices.</p>

                            <ul className="service-features">
                                <li>AI coding workflows and tools (ChatGPT, GitHub Copilot, custom assistants)</li>
                                <li>AI-safe code rules, templates, and standards</li>
                                <li>Repository structures optimized for AI code understanding</li>
                                <li>Migration from traditional workflows to AI-augmented development</li>
                                <li>Knowledge-extraction pipelines and codebase embeddings for advanced internal assistants</li>
                            </ul>

                            <div className="service-outcome">
                                <strong>The result:</strong> Teams that write cleaner code, understand complex systems faster, and ship features at a significantly higher velocity — with less cognitive load.
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════ */}
            {/* EPILOGUE - Contact */}
            {/* ═══════════════════════════════════════════ */}
            <section id="contact" className="chapter epilogue">
                <motion.div
                    className="epilogue-content"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="chapter-number">Epilogue</span>
                    <h2 className="chapter-title">Let's <em>Connect</em></h2>

                    <p className="epilogue-message">
                        Whether you're modernizing legacy systems, building a new product,
                        or looking for technical leadership — I'd love to hear from you.
                    </p>

                    <div className="contact-links">
                        <a href="mailto:dino.cosic95@gmail.com" className="contact-link" target="_blank" rel="noopener noreferrer">
                            <div className="contact-link-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="M22 6l-10 7L2 6" />
                                </svg>
                            </div>
                            <span className="contact-link-label">Email</span>
                        </a>

                        <a href="https://www.linkedin.com/in/dino-cosic" className="contact-link" target="_blank" rel="noopener noreferrer">
                            <div className="contact-link-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                    <rect x="2" y="9" width="4" height="12" />
                                    <circle cx="4" cy="4" r="2" />
                                </svg>
                            </div>
                            <span className="contact-link-label">LinkedIn</span>
                        </a>

                        <a href="https://medium.com/@dino.cosic" className="contact-link" target="_blank" rel="noopener noreferrer">
                            <div className="contact-link-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16v16H4z" />
                                    <path d="M8 8v8M12 6v12M16 10v4" />
                                </svg>
                            </div>
                            <span className="contact-link-label">Medium</span>
                        </a>

                        <a href="https://x.com/Dino_Codes" className="contact-link" target="_blank" rel="noopener noreferrer">
                            <div className="contact-link-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#iconGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4l16 16M20 4L4 20" />
                                </svg>
                            </div>
                            <span className="contact-link-label">X</span>
                        </a>
                    </div>

                    <div className="availability">
                        Available for consulting & freelance opportunities
                    </div>
                </motion.div>
            </section>

            {/* Back to Top */}
            {showBackToTop && (
                <motion.button
                    className="back-to-top"
                    onClick={() => scrollToSection('home')}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15" />
                    </svg>
                </motion.button>
            )}

            {/* Footer */}
            <footer className="footer">
                <img src={logoImage} alt="Dino Cosic" className="footer-logo" />
                <p>© 2025 Dino Cosic</p>
            </footer>
        </div>
    );
}
