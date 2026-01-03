# SMCE E-Book Platform

Digital library platform for Stella Mary's College of Engineering students to access engineering textbooks and study materials.

**Live Site**: https://smce-e-book.vercel.app

---

## Architecture

**Frontend**: React SPA with Vite build tool  
**Backend**: Supabase (PostgreSQL + Auth + Storage)  
**Deployment**: Vercel (auto-deploy from GitHub)  
**Authentication**: Email/Password + Google OAuth

```
Frontend (React)
    ↓
Supabase Client
    ↓
Supabase Services
    ├── PostgreSQL Database (profiles, departments, subjects, ebooks)
    ├── Auth (email + OAuth)
    └── Storage (PDF files)
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **UI Library** | Shadcn UI (Radix UI + Tailwind CSS) |
| **Routing** | React Router v6 |
| **State Management** | TanStack Query (React Query) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Authentication** | Supabase Auth (Email + Google OAuth) |
| **PDF Viewer** | react-pdf |
| **Icons** | Lucide React |
| **Styling** | Tailwind CSS 3 |
| **Deployment** | Vercel |

---

## Features

### Student Features
- **Browse by Department**: CSE, ECE, EEE, MECH, AIDS, CIVIL
- **Semester Navigation**: 8 semesters with subject organization
- **PDF Viewer**: In-browser PDF reading with zoom, navigation, download
- **Search & Filter**: Find books by name, subject, author
- **Favorites**: Save subjects for quick access
- **User Profile**: Manage account details, view academic info
- **Google OAuth**: Quick sign-in with Google account

### Admin Features
- **Dashboard**: View statistics (users, books, departments, subjects)
- **User Management**: Create, edit, delete user accounts
- **Department Management**: Add, edit, remove departments
- **Subject Management**: Create subjects (regular or common across departments)
- **Book Management**: Upload PDF books, edit metadata, delete books
- **Storage Diagnostics**: Monitor storage usage and orphaned files

### Technical Features
- **Row Level Security**: Database-level access control
- **Auto Profile Creation**: Seamless signup for OAuth users
- **Responsive Design**: Mobile-first UI with desktop optimization
- **SEO Optimized**: Meta tags for search engines and social sharing
- **Performance**: Code splitting, lazy loading, optimized builds

---

## Local Development

```bash
# Clone repository
git clone https://github.com/infance-tony/smce-e-book.git
cd smce-e-book

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
# Add your Supabase credentials to .env

# Start development server
npm run dev
```

Server runs at `http://localhost:8080`

---

## Deployment

Deployed on **Vercel** with automatic deployments from `main` branch.

**Deploy your own:**
1. Fork this repository
2. Import to Vercel
3. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy

---

## Database Schema

**Tables:**
- `profiles` - User information (name, email, student ID)
- `departments` - Engineering departments (CSE, ECE, etc.)
- `semesters` - Semester info per department
- `subjects` - Courses/subjects per semester
- `ebooks` - PDF book metadata and storage references
- `student_academic_info` - Academic records (CGPA, semester)

**Storage Buckets:**
- `ebooks` - PDF files for textbooks

---

## Contributing

Developed by **Infance Tony**  
Distributed by **Byte Bash Blitz**

---

## License

© 2026 Stella Mary's College of Engineering. All rights reserved.
