import profileImage from '@/assets/413A8961.jpg';
import logoImage from '@/assets/logo.png';
import { EmailIcon, LinkedInIcon } from '@/components/ui';
import { motion, useScroll } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { certifications, education, experiences, projects, services, skills } from './data';
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
                                    <svg className="education-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                                    <svg className="certification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                        {projects.map((project, index) => (
                            <motion.div
                                key={index}
                                className="work-card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                            >
                                <h3 className="work-title">
                                    <span className="work-icon">{project.icon}</span>
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
                        ))}
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
                        {services.map((service, index) => (
                            <motion.div
                                key={index}
                                className={`service-card ${service.badge ? 'featured' : ''} ${service.wide ? 'wide' : ''}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="service-header">
                                    <div className="service-icon">{service.icon}</div>
                                    {service.badge && <span className="service-badge">{service.badge}</span>}
                                    {service.tooltip && (
                                        <div className="service-tooltip-trigger">
                                            <span className="tooltip-icon">{service.tooltip.icon}</span>
                                            <div className="service-tooltip">
                                                <strong>{service.tooltip.title}</strong>
                                                <p>{service.tooltip.description}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <h3 className="service-title">{service.title}</h3>
                                <p className="service-description">{service.description}</p>

                                {service.features && (
                                    <ul className="service-features">
                                        {service.features.map((feature, i) => (
                                            <li key={i}>{feature}</li>
                                        ))}
                                    </ul>
                                )}

                                {service.outcome && (
                                    <div className="service-outcome">
                                        <strong>The result:</strong> {service.outcome}
                                    </div>
                                )}
                            </motion.div>
                        ))}
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
                                <EmailIcon size={24} />
                            </div>
                            <span className="contact-link-label">Email</span>
                        </a>

                        <a href="https://www.linkedin.com/in/dino-cosic" className="contact-link" target="_blank" rel="noopener noreferrer">
                            <div className="contact-link-icon">
                                <LinkedInIcon size={24} />
                            </div>
                            <span className="contact-link-label">LinkedIn</span>
                        </a>

                        <a href="https://medium.com/@dino.cosic" className="contact-link" target="_blank" rel="noopener noreferrer">
                            <div className="contact-link-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
                                </svg>
                            </div>
                            <span className="contact-link-label">Medium</span>
                        </a>

                        <a href="https://x.com/Dino_Codes" className="contact-link" target="_blank" rel="noopener noreferrer">
                            <div className="contact-link-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
