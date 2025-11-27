// Portfolio Data - Enriched for SEO & Marketing
// Keywords: Senior Software Engineer, .NET Developer, Azure Cloud Architect, Technical Lead, Legacy Modernization

export const experiences = [
  {
    company: 'Symphony',
    role: 'Senior Software Engineer',
    period: '2024 – Present',
    summary: 'Spearheading the modernization of legacy monolith systems into scalable cloud-native microservices using .NET 8, Azure Functions, and Service Bus. Reduced technical debt while accelerating MVP delivery for enterprise clients. Actively mentoring junior engineers in backend development and cloud architecture best practices.',
    technologies: ['C#', '.NET', 'Azure', 'Microservices', 'Service Bus', 'Azure Functions', 'LaunchDarkly', 'SendGrid', 'Twilio' ],
  },
  {
    company: 'HTEC Group',
    role: 'Senior Software Engineer',
    period: '2022 – 2024',
    summary: 'Led enterprise CMS migration to microservices architecture, cutting maintenance overhead by 25%. Achieved 99.9% CI/CD pipeline success rate across 50+ production releases. Engineered custom Azure Data Factory testing framework that reduced testing effort by 50%, adopted company-wide.',
    technologies: ['.NET', 'Azure', 'Docker', 'CI/CD', 'Azure Data Factory'],
  },
  {
    company: 'Authority Partners',
    role: 'Software Developer → Team Lead',
    period: '2019 – 2022',
    summary: 'Rapidly promoted to Team Lead within 20 months. Directed a 6-engineer team delivering mission-critical applications for Fortune 500 clients, including systems handling 20,000+ concurrent orders. Improved team velocity by 25% through Agile refinement and process optimization.',
    technologies: ['.NET Core', 'Angular', 'Azure DevOps', 'Agile', 'SQL Server'],
  },
  {
    company: 'University of Sarajevo',
    role: 'Teaching Assistant',
    period: '2022 – Present',
    summary: 'Mentoring 100+ students annually in .NET development, Azure DevOps, and software project management. Achieved 95% course satisfaction rating. Designed hands-on labs covering clean architecture, design patterns, and modern development workflows.',
    technologies: ['Teaching', '.NET', 'Azure DevOps', 'Architecture', 'Mentoring'],
  },
];

export const education = [
  {
    degree: 'Master of Engineering',
    field: 'Computer Science & Informatics',
    institution: 'Faculty of Electrical Engineering, University of Sarajevo',
    period: '2018 – 2021',
  },
  {
    degree: 'Bachelor of Engineering',
    field: 'Computer Science & Informatics',
    institution: 'Faculty of Electrical Engineering, University of Sarajevo',
    period: '2014 – 2018',
  },
];

export const certifications = [
  {
    name: 'Microsoft Certified: Azure Fundamentals',
    issuer: 'Microsoft',
    description: 'Foundational certification demonstrating knowledge of cloud concepts and Azure services including compute, networking, storage, security, and governance.',
  },
  {
    name: 'AP Lab Cloud Masters',
    issuer: 'AP Lab',
    period: 'Oct 2019 – Feb 2020',
    description: '16-week intensive training program covering the full software development lifecycle from planning and design to testing and deployment.',
  },
];

export const projects = [
  {
    title: 'CryptoDesk – Real-time Trading Platform',
    description: 'Architected a high-performance trading platform integrating multiple cryptocurrency exchanges with real-time data synchronization. Implemented bot-driven asset protection engine and asynchronous transaction processing for maximum reliability.',
    impact: 'Platform stability and performance exceeded expectations, leading the client to significantly expand project scope and long-term partnership.',
    technologies: ['.NET', 'Azure Functions', 'Event-Driven', 'Real-time'],
    icon: '📈',
  },
  {
    title: 'Karter.ba – Event Ticketing Platform',
    description: 'Founding backend developer for Bosnia\'s leading online ticketing startup. Architected scalable .NET and PostgreSQL infrastructure handling 5,000+ concurrent users. Built automated CI/CD pipelines with Docker for seamless deployments.',
    impact: '70% revenue increase and 40% growth in event attendance for partner venues within first year of launch.',
    technologies: ['.NET', 'PostgreSQL', 'Docker', 'Payment APIs'],
    icon: '🎫',
  },
  {
    title: 'Government Cloud-to-OnPrem Migration',
    description: 'Led critical migration of government application from Azure cloud to secure on-premise infrastructure. Refactored entire codebase to remove cloud dependencies while implementing new CI/CD workflows for internal deployment.',
    impact: 'Ensured operational continuity, improved data sovereignty, and met strict government security compliance requirements.',
    technologies: ['.NET', 'Angular', 'SQL Server', 'DevOps'],
    icon: '🏛️',
  },
  {
    title: 'Technical Writing & Thought Leadership',
    description: 'Publishing in-depth technical articles on Medium covering emerging technologies including LLMs, Azure Functions, Docker containerization, and .NET best practices. Content used internally for team onboarding and knowledge sharing.',
    impact: 'Articles regularly referenced by engineering peers for technical guidance and architectural decisions.',
    technologies: ['Writing', 'Azure', 'LLM', 'Docker'],
    icon: '✍️',
  },
];

export const services = [
  {
    title: 'Legacy Modernization',
    description: 'Transform aging monolithic systems into clean, modern, and maintainable architectures. I lead full modernization cycles — from deep-dive assessments to hands-on execution — backed by 6+ years of real-world enterprise experience.',
    tooltip: {
      icon: '✨',
      title: 'AI-Powered Modernization',
      description: 'Accelerate migrations using AI-assisted analysis, dependency mapping, automated code suggestions, and structural refactoring. Reduce technical debt faster with higher accuracy.',
    },
    icon: '🔄',
  },
  {
    title: 'Cloud & Backend Development',
    description: 'End-to-end backend engineering for startups and enterprises. I build scalable, production-ready platforms capable of handling thousands of concurrent users on Azure cloud infrastructure. From MVPs to mission-critical distributed systems, I deliver robust architectures built for growth.',
    icon: '☁️',
  },
  {
    title: 'Product & Technical Consultancy',
    description: 'Strategic guidance to accelerate your product and engineering outcomes. I partner with founders, CTOs, and product teams to translate business goals into technical roadmaps, conduct architecture reviews, optimize development workflows, and help you ship faster with confidence.',
    icon: '💼',
  },
  {
    title: 'AI-Guided Development Enablement',
    description: 'Empower your engineering team to achieve next-level speed, clarity, and maintainability through AI-guided programming practices.',
    badge: 'High-Impact, In-Demand',
    wide: true,
    features: [
      'AI coding workflows and tools (ChatGPT, GitHub Copilot, custom assistants)',
      'AI-safe code rules, templates, and standards',
      'Repository structures optimized for AI code understanding',
      'Migration from traditional workflows to AI-augmented development',
      'Knowledge-extraction pipelines and codebase embeddings for advanced internal assistants',
    ],
    outcome: 'Teams that write cleaner code, understand complex systems faster, and ship features at a significantly higher velocity — with less cognitive load.',
    icon: '🤖',
  },
];

export const skills = {
  // Mountain Range - height represents expertise depth
  peaks: [
    {
      name: 'Backend',
      height: 100, // Tallest peak
      years: 6,
      items: ['C#', '.NET', 'ASP.NET Core', '.NET Framework', 'Entity Framework', 'REST APIs', 'Microservices', 'Unit Testing', 'Integration Testing',],
      color: 'accent', // Orange
    },
    {
      name: 'Azure Cloud',
      height: 92,
      years: 5,
      items: ['Azure Functions', 'Service Bus', 'App Insights', 'Blob Storage', 'App Services', 'Container Apps', 'Key Vault', 'Azure DevOps'],
      color: 'accent',
    },
    {
      name: 'Databases',
      height: 75,
      years: 6,
      items: ['SQL Server', 'PostgreSQL', 'MongoDB'],
      color: 'violet',
    },
    {
      name: 'DevOps',
      height: 70,
      years: 5,
      items: ['CI/CD', 'Git', 'Azure DevOps', 'Docker', 'GitHub Actions'],
      color: 'violet',
    },
    {
      name: 'Architecture',
      height: 65,
      years: 4,
      items: ['System Design', 'Clean Architecture', 'DDD', 'Event-Driven'],
      color: 'violet',
    },
    {
      name: 'Frontend',
      height: 25, // Foothill
      months: 6,
      items: ['Angular', 'HTML', 'CSS', 'JavaScript', 'TypeScript'],
      color: 'teal',
    },
  ],
};

// SEO-optimized meta content
export const seoMeta = {
  title: 'Dino Cosic | Senior Software Engineer & .NET Specialist',
  description: 'Senior Software Engineer specializing in .NET, Azure, and legacy modernization. 6+ years helping enterprises transform monoliths into modern cloud-native architectures.',
  keywords: 'Senior Software Engineer, .NET Developer, Azure Cloud Architect, Legacy Modernization, Microservices, Technical Lead, Bosnia, Remote Developer',
};
