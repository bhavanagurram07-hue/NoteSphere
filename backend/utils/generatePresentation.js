const path = require('path');
const pptxgen = require('pptxgenjs');

async function createPresentation() {
  console.log('Generating NoteSphere Professional College Presentation (.pptx)...');

  const pres = new pptxgen();

  // Set 16:9 widescreen layout
  pres.layout = 'LAYOUT_16x9';

  // Define Design System Colors
  const NAVY = '0F172A';
  const BLUE = '2563EB';
  const LIGHT_BLUE = 'EFF6FF';
  const SLATE = '475569';
  const WHITE = 'FFFFFF';
  const EMERALD = '059669';
  const CARD_BG = 'F8FAFC';
  const BORDER = 'E2E8F0';

  // ==========================================
  // SLIDE 1: TITLE SLIDE
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: NAVY };

    // Header badge
    slide.addText('MAJOR PROJECT PRESENTATION • B.TECH COMPUTER SCIENCE & ENGINEERING', {
      x: 0.8,
      y: 0.8,
      w: 8.5,
      h: 0.4,
      fontSize: 11,
      fontFace: 'Arial',
      color: '93C5FD',
      bold: true,
    });

    // Main Title
    slide.addText('NoteSphere', {
      x: 0.8,
      y: 1.3,
      w: 11.0,
      h: 1.1,
      fontSize: 48,
      fontFace: 'Arial',
      color: WHITE,
      bold: true,
    });

    // Subtitle
    slide.addText('Smart Academic Resource Sharing Platform for Universities', {
      x: 0.8,
      y: 2.3,
      w: 11.0,
      h: 0.6,
      fontSize: 18,
      fontFace: 'Arial',
      color: 'CBD5E1',
    });

    // Decorative line
    slide.addShape(pres.ShapeType.rect, {
      x: 0.8,
      y: 3.1,
      w: 11.7,
      h: 0.04,
      fill: { color: BLUE },
    });

    // Team Card Container
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 3.6,
      w: 11.7,
      h: 2.8,
      fill: { color: '1E293B' },
      line: { color: '334155', width: 1 },
      rectRadius: 0.15,
    });

    slide.addText('PROJECT TEAM DETAILS (TEAM NAME: TEAM NEXUS)', {
      x: 1.1,
      y: 3.8,
      w: 11.0,
      h: 0.35,
      fontSize: 12,
      fontFace: 'Arial',
      color: '60A5FA',
      bold: true,
    });

    // Team members in 3 columns
    const members = [
      { name: '[Student 1 Full Name]', reg: 'Reg No: [e.g., 22BCSE101]', role: 'Team Lead & Backend Developer' },
      { name: '[Student 2 Full Name]', reg: 'Reg No: [e.g., 22BCSE102]', role: 'Frontend & UI/UX Developer' },
      { name: '[Student 3 Full Name]', reg: 'Reg No: [e.g., 22BCSE103]', role: 'Database & QA Engineer' },
    ];

    members.forEach((m, idx) => {
      const colX = 1.1 + idx * 3.8;
      slide.addShape(pres.ShapeType.roundRect, {
        x: colX,
        y: 4.3,
        w: 3.5,
        h: 1.8,
        fill: { color: '0F172A' },
        line: { color: '475569', width: 1 },
        rectRadius: 0.1,
      });

      slide.addText(m.name, {
        x: colX + 0.2,
        y: 4.5,
        w: 3.1,
        h: 0.4,
        fontSize: 13,
        fontFace: 'Arial',
        color: WHITE,
        bold: true,
      });

      slide.addText(m.reg, {
        x: colX + 0.2,
        y: 4.9,
        w: 3.1,
        h: 0.3,
        fontSize: 11,
        fontFace: 'Arial',
        color: '94A3B8',
      });

      slide.addText(m.role, {
        x: colX + 0.2,
        y: 5.3,
        w: 3.1,
        h: 0.6,
        fontSize: 10,
        fontFace: 'Arial',
        color: '38BDF8',
      });
    });

    slide.addNotes(
      'Good morning respected evaluators, faculty members, and peers. Welcome to our major project presentation on NoteSphere - a smart academic resource sharing platform built with the MERN stack. Our team consists of three members: Student 1 as team lead and backend architect, Student 2 as frontend developer, and Student 3 managing database design and quality assurance.'
    );
  }

  // ==========================================
  // SLIDE 2: INTRODUCTION & PROBLEM STATEMENT
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: CARD_BG };

    slide.addText('PROJECT BACKGROUND', { x: 0.8, y: 0.5, w: 8, h: 0.3, fontSize: 11, fontFace: 'Arial', color: BLUE, bold: true });
    slide.addText('Introduction & Problem Statement', { x: 0.8, y: 0.8, w: 11, h: 0.6, fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true });

    // Left Column: The Problem
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.6, w: 5.6, h: 5.1,
      fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.15,
    });
    slide.addText('Current Academic Resource Challenges', { x: 1.1, y: 1.9, w: 5.0, h: 0.4, fontSize: 16, fontFace: 'Arial', color: 'DC2626', bold: true });

    const problemPoints = [
      '• Fragmented Channels: Study notes and question papers scattered across informal WhatsApp groups, Google Drive links, and Telegram channels.',
      '• Missing Quality Verification: Students frequently download outdated, incorrect, or irrelevant syllabus materials before exams.',
      '• Broken Searchability: No metadata indexing by department, semester, subject code, or document format.',
      '• Lost Knowledge Across Batches: Valuable handwritten notes from senior university toppers are permanently lost when graduating.',
      '• Security & Spam Risks: Unverified files risk containing malware, exam leaks, or inappropriate community submissions.',
    ];
    slide.addText(problemPoints.join('\n\n'), { x: 1.1, y: 2.4, w: 5.0, h: 4.0, fontSize: 12, fontFace: 'Arial', color: SLATE, lineSpacing: 18 });

    // Right Column: The NoteSphere Solution
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.8, y: 1.6, w: 5.7, h: 5.1,
      fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.15,
    });
    slide.addText('The NoteSphere Solution', { x: 7.1, y: 1.9, w: 5.1, h: 0.4, fontSize: 16, fontFace: 'Arial', color: EMERALD, bold: true });

    const solutionPoints = [
      '• Centralized Repository: Single university platform indexing lecture notes, previous question papers, and lab manuals.',
      '• Multi-tier Moderation: Dedicated administrative workflow to approve, reject, and moderate uploaded files.',
      '• Multi-Field Filter Engine: Query documents by title, subject, semester, format, and student star ratings.',
      '• Interactive Student Feedback: 5-star ratings, verified reviews, and community violation reporting.',
      '• Resilient Dual Storage: Production Cloudinary cloud streaming with seamless automatic local fallback.',
    ];
    slide.addText(solutionPoints.join('\n\n'), { x: 7.1, y: 2.4, w: 5.1, h: 4.0, fontSize: 12, fontFace: 'Arial', color: SLATE, lineSpacing: 18 });

    slide.addNotes(
      'In this slide we address the motivation behind NoteSphere. College students face huge challenges finding reliable study guides before semester exams. Important handwritten notes are scattered across ephemeral messaging apps and lost each year. NoteSphere solves this through a centralized repository where materials are organized, vetted by faculty moderators, and rated by peer students.'
    );
  }

  // ==========================================
  // SLIDE 3: PROJECT OBJECTIVES
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: CARD_BG };

    slide.addText('GOALS & TARGET OUTCOMES', { x: 0.8, y: 0.5, w: 8, h: 0.3, fontSize: 11, fontFace: 'Arial', color: BLUE, bold: true });
    slide.addText('Key Project Objectives', { x: 0.8, y: 0.8, w: 11, h: 0.6, fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true });

    const objectives = [
      { num: '01', title: 'Seamless Academic Discovery', desc: 'Build an ultra-responsive web interface allowing students to find course materials in under 3 seconds using multi-attribute filters.' },
      { num: '02', title: 'Robust Authentication & RBAC', desc: 'Implement industry-standard JWT authentication and role-based access control protecting student and administrative resources.' },
      { num: '03', title: 'Reliable Cloud File Storage', desc: 'Support PDF, DOCX, and presentations with size caps (25MB), file type verification, and Cloudinary CDN streaming.' },
      { num: '04', title: 'Peer Collaboration & Ratings', desc: 'Enable dynamic 5-star reviews, automatic average rating aggregation, cloud bookmarking, and community content reporting.' },
      { num: '05', title: 'Administrative Supervision', desc: 'Equip faculty moderators with real-time MongoDB analytics, user suspension controls, and a moderation queue.' },
      { num: '06', title: 'Enterprise-grade Security', desc: 'Ensure zero secret exposure, sliding-window rate limiting on auth, NoSQL injection sanitization, and atomic download tracking.' },
    ];

    objectives.forEach((obj, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = 0.8 + col * 3.9;
      const y = 1.6 + row * 2.55;

      slide.addShape(pres.ShapeType.roundRect, {
        x, y, w: 3.7, h: 2.35,
        fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.12,
      });

      slide.addText(obj.num, { x: x + 0.25, y: y + 0.2, w: 0.8, h: 0.4, fontSize: 20, fontFace: 'Arial', color: BLUE, bold: true });
      slide.addText(obj.title, { x: x + 0.25, y: y + 0.65, w: 3.2, h: 0.5, fontSize: 13, fontFace: 'Arial', color: NAVY, bold: true });
      slide.addText(obj.desc, { x: x + 0.25, y: y + 1.15, w: 3.2, h: 1.0, fontSize: 11, fontFace: 'Arial', color: SLATE });
    });

    slide.addNotes(
      'Our project objectives were divided into six core technical goals: fast document discovery, secure authentication with dual-cookie JWT architecture, resilient document upload, interactive peer feedback with real-time rating calculation, administrative auditing, and strict security compliance.'
    );
  }

  // ==========================================
  // SLIDE 4: TECHNOLOGIES & TOOLS USED
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: CARD_BG };

    slide.addText('TECHNICAL FOUNDATION', { x: 0.8, y: 0.5, w: 8, h: 0.3, fontSize: 11, fontFace: 'Arial', color: BLUE, bold: true });
    slide.addText('MERN Technology Stack & Toolchain', { x: 0.8, y: 0.8, w: 11, h: 0.6, fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true });

    const techStack = [
      { layer: 'Frontend Layer', main: 'React 18 + Vite', bullets: ['Tailwind CSS 3 for responsive UI', 'React Router 6 for client navigation', 'Lucide React icon system', 'Axios HTTP with interceptors', 'Vite bundle optimization'] },
      { layer: 'Backend Layer', main: 'Node.js + Express.js', bullets: ['RESTful API routing architecture', 'Multer memory storage pipeline', 'Cookie-parser & CORS security', 'Sliding-window rate limiter', 'Centralized error handling'] },
      { layer: 'Database Layer', main: 'MongoDB + Mongoose', bullets: ['Flexible JSON document schemas', 'Compound indexes for fast lookup', 'Aggregation pipeline for analytics', 'Cascade deletes for orphans', 'Atomic download increments'] },
      { layer: 'Cloud & Security', main: 'JWT + Cloudinary', bullets: ['Bcrypt.js password hashing (10 rounds)', 'JSON Web Tokens with Dual Cookie/Bearer', 'Cloudinary CDN media streaming', 'MIME type & extension guards', 'Strict RBAC permission checks'] },
    ];

    techStack.forEach((t, idx) => {
      const x = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.roundRect, {
        x, y: 1.6, w: 2.8, h: 5.1,
        fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.15,
      });

      slide.addText(t.layer, { x: x + 0.2, y: 1.85, w: 2.4, h: 0.3, fontSize: 10, fontFace: 'Arial', color: BLUE, bold: true });
      slide.addText(t.main, { x: x + 0.2, y: 2.2, w: 2.4, h: 0.6, fontSize: 15, fontFace: 'Arial', color: NAVY, bold: true });

      slide.addShape(pres.ShapeType.rect, { x: x + 0.2, y: 2.8, w: 2.4, h: 0.02, fill: { color: BORDER } });

      const bulletText = t.bullets.map((b) => `• ${b}`).join('\n\n');
      slide.addText(bulletText, { x: x + 0.2, y: 3.0, w: 2.4, h: 3.5, fontSize: 11, fontFace: 'Arial', color: SLATE });
    });

    slide.addNotes(
      'NoteSphere is powered by the complete MERN stack. React and Vite on the client provide rapid hot module reloading and sub-second page transitions. Express and Node.js on the server handle asynchronous multipart document processing and route security. MongoDB stores our documents and reviews with compound indexes. Cloudinary delivers cloud media streaming with a transparent local disk fallback.'
    );
  }

  // ==========================================
  // SLIDE 5: SYSTEM ARCHITECTURE & WORKFLOW
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: CARD_BG };

    slide.addText('ARCHITECTURE OVERVIEW', { x: 0.8, y: 0.5, w: 8, h: 0.3, fontSize: 11, fontFace: 'Arial', color: BLUE, bold: true });
    slide.addText('System Architecture & Application Workflow', { x: 0.8, y: 0.8, w: 11, h: 0.6, fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true });

    // 4 Workflow Boxes
    const stages = [
      { title: '1. Client Layer', tech: 'React.js SPA', items: ['Landing / Explore / Details', 'Upload Drag-and-Drop', 'Real-time Progress Bar', 'Auth & Resource Contexts'] },
      { title: '2. Gateway & Security', tech: 'Express Middlewares', items: ['JWT Auth Protection', 'Sliding Window Rate Limit', 'Multer 25MB Validation', 'RBAC (Student vs Admin)'] },
      { title: '3. Controller / Services', tech: 'RESTful Controllers', items: ['Auth, Resource, Bookmark', 'Review Aggregation Engine', 'Admin Analytics Pipeline', 'Report Resolution System'] },
      { title: '4. Storage & Persistence', tech: 'Database & Cloud', items: ['MongoDB Collections', 'Cloudinary Asset CDN', 'Atomic Field Increments', 'Cascade Deletion Cleanup'] },
    ];

    stages.forEach((st, idx) => {
      const x = 0.8 + idx * 2.95;
      slide.addShape(pres.ShapeType.roundRect, {
        x, y: 1.6, w: 2.8, h: 5.1,
        fill: { color: WHITE }, line: { color: idx === 1 || idx === 2 ? BLUE : BORDER, width: 1.5 }, rectRadius: 0.15,
      });

      slide.addShape(pres.ShapeType.rect, { x: x + 0.2, y: 1.85, w: 2.4, h: 0.35, fill: { color: LIGHT_BLUE } });
      slide.addText(st.title, { x: x + 0.25, y: 1.9, w: 2.3, h: 0.3, fontSize: 12, fontFace: 'Arial', color: BLUE, bold: true });

      slide.addText(st.tech, { x: x + 0.2, y: 2.35, w: 2.4, h: 0.4, fontSize: 14, fontFace: 'Arial', color: NAVY, bold: true });

      const text = st.items.map((i) => `➔ ${i}`).join('\n\n');
      slide.addText(text, { x: x + 0.2, y: 2.9, w: 2.4, h: 3.5, fontSize: 11, fontFace: 'Arial', color: SLATE });
    });

    slide.addNotes(
      'This slide illustrates our four-tier system architecture. Requests travel from our React single-page application through an Express gateway enforced with JWT authentication and sliding-window rate limiters. Business logic controllers manage document validation, review aggregation, and user suspension. Finally, data is committed to MongoDB and media is delivered via Cloudinary.'
    );
  }

  // ==========================================
  // SLIDE 6: FEATURES & FUNCTIONALITIES
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: CARD_BG };

    slide.addText('APPLICATION CAPABILITIES', { x: 0.8, y: 0.5, w: 8, h: 0.3, fontSize: 11, fontFace: 'Arial', color: BLUE, bold: true });
    slide.addText('Core Features & Functionalities', { x: 0.8, y: 0.8, w: 11, h: 0.6, fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true });

    // Left Box: Student Module
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.6, w: 5.6, h: 5.1,
      fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.15,
    });
    slide.addText('Student Portal Features', { x: 1.1, y: 1.9, w: 5.0, h: 0.4, fontSize: 16, fontFace: 'Arial', color: BLUE, bold: true });

    const studentFeatures = [
      '• Intuitive Dashboard: Personal upload statistics, total peer downloads, quick upload actions, and recent campus activities.',
      '• Document Upload: Drag-and-drop file upload with live percentage progress bar wired to Axios upload events.',
      '• Advanced Search & Multi-Filter: Instant search across title, subject, and description with department, semester, category, and rating filters.',
      '• Document Viewer & Download: Built-in document specification viewer with zoom and atomic download counter incrementation.',
      '• Personal Cloud Shelf: Instant bookmarking of study guides with cloud synchronization across sessions.',
      '• Peer Rating & Reviews: 5-star ratings with interactive feedback comments, with inline edit and delete capabilities.',
    ];
    slide.addText(studentFeatures.join('\n\n'), { x: 1.1, y: 2.35, w: 5.0, h: 4.1, fontSize: 11, fontFace: 'Arial', color: SLATE });

    // Right Box: Administrative Module
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.8, y: 1.6, w: 5.7, h: 5.1,
      fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.15,
    });
    slide.addText('Administrative Control Panel', { x: 7.1, y: 1.9, w: 5.1, h: 0.4, fontSize: 16, fontFace: 'Arial', color: NAVY, bold: true });

    const adminFeatures = [
      '• Real-time Database Analytics: Automated MongoDB aggregation metrics covering students, documents, downloads, and bookmarks.',
      '• Visual Statistical Charts: Monthly upload trajectories, category volume distribution, and department resource charts.',
      '• Moderation Pipeline: Comprehensive review queue allowing faculty moderators to inspect, approve, or reject submissions.',
      '• Student Account Management: Searchable student directory with instant account suspension and reinstatement toggles.',
      '• Community Reports Resolution: Audit flagged inappropriate submissions, copyright claims, or incorrect syllabus materials.',
      '• Security Self-Protection: Built-in guards preventing administrators from self-suspension or privilege escalation.',
    ];
    slide.addText(adminFeatures.join('\n\n'), { x: 7.1, y: 2.35, w: 5.1, h: 4.1, fontSize: 11, fontFace: 'Arial', color: SLATE });

    slide.addNotes(
      'Our platform features are divided between the student portal and the administrative control panel. Students enjoy personal upload tracking, instant multi-filter search, one-click cloud bookmarking, and 5-star review interactions. Administrators get complete visibility through real-time MongoDB analytics, user management, and moderation queues.'
    );
  }

  // ==========================================
  // SLIDE 7: DATABASE DESIGN & API INTEGRATION
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: CARD_BG };

    slide.addText('DATA & API ARCHITECTURE', { x: 0.8, y: 0.5, w: 8, h: 0.3, fontSize: 11, fontFace: 'Arial', color: BLUE, bold: true });
    slide.addText('Database Design & RESTful API Integration', { x: 0.8, y: 0.8, w: 11, h: 0.6, fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true });

    // 5 Collections summary cards
    const collections = [
      { name: 'Users Collection', keys: 'name, email, password (bcrypt), department, semester, role, isBlocked', idx: 'Index: email (unique)' },
      { name: 'Resources Collection', keys: 'title, description, subject, department, semester, category, fileUrl, publicId, downloads, averageRating', idx: 'Index: text(title, subject), status' },
      { name: 'Bookmarks Collection', keys: 'user (ref: User), resource (ref: Resource), createdAt', idx: 'Compound Unique: { user, resource }' },
      { name: 'Reviews Collection', keys: 'user (ref: User), resource (ref: Resource), rating (1-5), comment, timestamps', idx: 'Compound Unique: { user, resource }' },
      { name: 'Reports Collection', keys: 'resource, reportedBy, reason, description, status (pending/resolved), resolvedBy', idx: 'Compound Unique: { resource, reportedBy }' },
    ];

    collections.forEach((c, idx) => {
      const y = 1.6 + idx * 1.0;
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8, y, w: 6.8, h: 0.85,
        fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.08,
      });

      slide.addText(c.name, { x: 1.0, y: y + 0.1, w: 2.3, h: 0.3, fontSize: 11, fontFace: 'Arial', color: NAVY, bold: true });
      slide.addText(c.idx, { x: 3.4, y: y + 0.1, w: 4.0, h: 0.3, fontSize: 9.5, fontFace: 'Arial', color: BLUE, bold: true });
      slide.addText(c.keys, { x: 1.0, y: y + 0.4, w: 6.4, h: 0.38, fontSize: 9.5, fontFace: 'Arial', color: SLATE });
    });

    // Right Side: API Endpoints Table Card
    slide.addShape(pres.ShapeType.roundRect, {
      x: 7.9, y: 1.6, w: 4.6, h: 5.1,
      fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.15,
    });

    slide.addText('Core RESTful Endpoints', { x: 8.2, y: 1.85, w: 4.0, h: 0.35, fontSize: 14, fontFace: 'Arial', color: NAVY, bold: true });

    const endpoints = [
      'POST /api/auth/register & /login',
      'GET /api/auth/me & /dashboard-stats',
      'GET & POST /api/resources',
      'GET /api/resources/:id/download',
      'POST /api/bookmarks/:id/toggle',
      'GET & POST /api/resources/:id/reviews',
      'POST /api/reports/:id',
      'GET /api/admin/analytics',
      'GET & PUT /api/admin/users/:id/block',
      'PUT /api/admin/resources/:id/moderate',
    ];

    const apiText = endpoints.map((e) => `✔ ${e}`).join('\n');
    slide.addText(apiText, { x: 8.2, y: 2.3, w: 4.1, h: 4.2, fontSize: 10.5, fontFace: 'Arial', color: SLATE, lineSpacing: 18 });

    slide.addNotes(
      'Our database consists of five collections: Users, Resources, Bookmarks, Reviews, and Reports. We designed compound unique indexes to guarantee integrity - preventing duplicate bookmarks, duplicate reviews, and duplicate active reports. All endpoints follow REST conventions and return structured JSON responses.'
    );
  }

  // ==========================================
  // SLIDE 8: ACTUAL PROJECT SCREENSHOTS
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: CARD_BG };

    slide.addText('USER INTERFACE & EXPERIENCE', { x: 0.8, y: 0.5, w: 8, h: 0.3, fontSize: 11, fontFace: 'Arial', color: BLUE, bold: true });
    slide.addText('Application Interface & Key Screens', { x: 0.8, y: 0.8, w: 11, h: 0.6, fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true });

    const screens = [
      { name: '1. Landing Page', desc: 'Hero section with search bar, quick metrics, academic department cards, and feature highlights.' },
      { name: '2. Explore Library', desc: 'Interactive search bar with autocomplete suggestions, 5 filter controls, and grid/list view toggle.' },
      { name: '3. Resource Details', desc: 'Embedded document viewer, 5-star student review section, download button, and uploader card.' },
      { name: '4. Upload Notes Modal', desc: 'Drag-and-drop document upload with real-time percentage progress bar and validation feedback.' },
      { name: '5. Student Dashboard', desc: 'Personal upload count, peer download counter, saved cloud bookmarks, and recent activity feed.' },
      { name: '6. Admin Control Panel', desc: 'Real-time MongoDB analytics charts, moderation queue, user suspension toggles, and report resolution.' },
    ];

    screens.forEach((sc, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = 0.8 + col * 3.9;
      const y = 1.6 + row * 2.55;

      slide.addShape(pres.ShapeType.roundRect, {
        x, y, w: 3.7, h: 2.35,
        fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.12,
      });

      slide.addText(sc.name, { x: x + 0.25, y: y + 0.25, w: 3.2, h: 0.4, fontSize: 13, fontFace: 'Arial', color: NAVY, bold: true });
      slide.addText(sc.desc, { x: x + 0.25, y: y + 0.75, w: 3.2, h: 1.3, fontSize: 11, fontFace: 'Arial', color: SLATE });
    });

    slide.addNotes(
      'Here we showcase the key user interfaces of NoteSphere. Every page follows a unified SaaS aesthetic with deep navy text, light blue backgrounds, rounded cards, and smooth transitions. The UI is completely responsive across desktops, tablets, and smartphones.'
    );
  }

  // ==========================================
  // SLIDE 9: CHALLENGES FACED & FUTURE SCOPE
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: CARD_BG };

    slide.addText('LESSONS & ROADMAP', { x: 0.8, y: 0.5, w: 8, h: 0.3, fontSize: 11, fontFace: 'Arial', color: BLUE, bold: true });
    slide.addText('Challenges Faced & Future Scope', { x: 0.8, y: 0.8, w: 11, h: 0.6, fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true });

    // Left Column: Challenges Overcome
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 1.6, w: 5.6, h: 5.1,
      fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.15,
    });
    slide.addText('Engineering Challenges Overcome', { x: 1.1, y: 1.9, w: 5.0, h: 0.4, fontSize: 16, fontFace: 'Arial', color: 'DC2626', bold: true });

    const challenges = [
      '• Resilient Dual-Storage Pipeline: Configured Cloudinary memory-streaming with an automatic local fallback when cloud credentials are not active.',
      '• Real-time Aggregate Ratings: Implemented MongoDB static aggregation hooks to recalculate average stars without race conditions.',
      '• NoSQL Injection & Rate Limiting: Hardened auth endpoints with strict type checks and sliding-window rate limiters.',
      '• Clean ID Polymorphism: Unified frontend components to gracefully handle both MongoDB ObjectId and mock IDs without breaking.',
      '• Comprehensive 61-Test QA Suite: Authored automated end-to-end regression suites ensuring 100% test pass rates across all workflows.',
    ];
    slide.addText(challenges.join('\n\n'), { x: 1.1, y: 2.35, w: 5.0, h: 4.1, fontSize: 11, fontFace: 'Arial', color: SLATE });

    // Right Column: Future Scope
    slide.addShape(pres.ShapeType.roundRect, {
      x: 6.8, y: 1.6, w: 5.7, h: 5.1,
      fill: { color: WHITE }, line: { color: BORDER, width: 1 }, rectRadius: 0.15,
    });
    slide.addText('Future Development Roadmap', { x: 7.1, y: 1.9, w: 5.1, h: 0.4, fontSize: 16, fontFace: 'Arial', color: BLUE, bold: true });

    const futureScope = [
      '• AI-Powered Note Summarization: Integrate Gemini API to generate concise chapter summaries and flashcards from uploaded PDFs.',
      '• OCR Text Extraction: Automatically parse handwritten mathematical equations and formulas for full-text indexing.',
      '• Gamified Student Badges: Reward top peer contributors with verified badges and academic recognition on campus.',
      '• Collaborative Real-time Annotations: Allow study groups to highlight and annotate shared PDFs simultaneously.',
      '• Mobile Native Application: Build React Native mobile apps for iOS and Android with offline reading sync.',
    ];
    slide.addText(futureScope.join('\n\n'), { x: 7.1, y: 2.35, w: 5.1, h: 4.1, fontSize: 11, fontFace: 'Arial', color: SLATE });

    slide.addNotes(
      'During development, our biggest engineering challenge was ensuring dual-storage resilience between Cloudinary and local disk, as well as concurrency-safe rating recalculations. For future work, we plan to integrate the Gemini API for automatic lecture summarization, OCR for handwritten notes, and a cross-platform mobile application.'
    );
  }

  // ==========================================
  // SLIDE 10: CONCLUSION
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: NAVY };

    slide.addText('PROJECT WRAP-UP', { x: 0.8, y: 0.8, w: 8.5, h: 0.4, fontSize: 11, fontFace: 'Arial', color: '93C5FD', bold: true });
    slide.addText('Conclusion & Submission Readiness', { x: 0.8, y: 1.3, w: 11.0, h: 0.8, fontSize: 36, fontFace: 'Arial', color: WHITE, bold: true });

    // Summary Card Container
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 2.3, w: 11.7, h: 4.1,
      fill: { color: '1E293B' }, line: { color: '334155', width: 1 }, rectRadius: 0.15,
    });

    const conclusions = [
      '✔ Complete Full-Stack Solution: Successfully engineered a modern MERN academic platform fulfilling all university requirements.',
      '✔ 100% Automated Test Pass Rate: 61 out of 61 automated tests passing across Auth, Resources, Interactions, and Admin workflows.',
      '✔ Robust Role-Based Security: Strict separation between students and faculty administrators with account suspension enforcement.',
      '✔ Clean Production Build: React frontend compiled with Vite with zero errors, zero warnings, and responsive layout styling.',
      '✔ Deployment Ready: Environment variables, seed scripts, database indexes, and deployment guides prepared for Render, Vercel, and Atlas.',
    ];

    slide.addText(conclusions.join('\n\n'), { x: 1.2, y: 2.6, w: 11.0, h: 3.5, fontSize: 13, fontFace: 'Arial', color: 'F1F5F9', lineSpacing: 22 });

    // Thank you text at bottom
    slide.addText('Thank You! Open For Questions & Viva Voce Discussion.', {
      x: 0.8, y: 6.6, w: 11.7, h: 0.4,
      fontSize: 14, fontFace: 'Arial', color: '60A5FA', bold: true, align: 'center',
    });

    slide.addNotes(
      'To conclude, NoteSphere is a fully realized, enterprise-grade academic resource sharing platform. We have verified all 61 automated test cases, guaranteed zero secrets exposure, and verified our production build. We would like to thank our project guide and evaluators. We are now open for viva questions and project demonstration.'
    );
  }

  // Save presentation file in repository root
  const outputPath = path.join(__dirname, '../../NoteSphere_Final_Presentation.pptx');
  await pres.writeFile({ fileName: outputPath });
  console.log(`✓ Presentation generated successfully at: ${outputPath}`);
}

createPresentation().catch((err) => {
  console.error('Failed to generate presentation:', err);
  process.exit(1);
});
