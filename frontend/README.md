# HRS Frontend - Modern Human Resource Management System

A comprehensive, production-ready frontend for human resource management with role-based access control, built with Next.js 14, React Query, and Ant Design.

## 🚀 Features

### 🎯 Role-Based Dashboard
- **Admin Dashboard**: Complete system oversight with user management, analytics, and administrative controls
- **Manager Dashboard**: Team management, performance reviews, and project oversight
- **Employee Dashboard**: Personal profile, leave management, expense tracking, and announcements

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Protected routes with automatic redirection
- Secure API communication with interceptors

### 📊 Analytics & Reporting
- Real-time dashboards with interactive charts
- Performance metrics and KPI tracking
- Department and employee analytics
- Expense and leave reporting

### 💼 Core Features
- **User Management**: Create, edit, and manage user profiles
- **Department Management**: Organize teams and track department metrics
- **Leave Management**: Request and approve time off
- **Expense Tracking**: Submit and approve expense claims
- **Announcements**: Company-wide communications
- **Performance Reviews**: Track and evaluate employee performance

### 🎨 Modern UI/UX
- Responsive design for all devices (mobile, tablet, desktop)
- Professional interface with Ant Design components
- Smooth animations and transitions
- Dark/light theme support
- Accessibility compliance

### ⚡ Performance
- Server-side rendering with Next.js 14
- Optimized data fetching with React Query
- Code splitting and lazy loading
- Image optimization
- SEO-friendly

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Ant Design
- **State Management**: React Context + Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Ant Design Icons + Lucide React
- **Forms**: React Hook Form + Yup
- **Animations**: Framer Motion

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hrs-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Configure your environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (dashboard)/       # Route groups for different roles
│   │   ├── admin/         # Admin-specific pages
│   │   ├── manager/       # Manager-specific pages
│   │   └── employee/      # Employee-specific pages
│   ├── login/             # Authentication pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── auth/             # Authentication components
│   └── providers/        # React providers
├── contexts/             # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utility libraries
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

## 🔐 Authentication Flow

1. **Login**: Users authenticate with email/password
2. **Token Storage**: JWT tokens stored securely in localStorage
3. **Role Detection**: User roles determine dashboard access
4. **Route Protection**: Protected components enforce role-based access
5. **Auto-refresh**: Refresh tokens maintain session continuity
6. **Logout**: Clean token removal and redirect to login

## 📊 API Integration

The application is designed to work with a RESTful API. The expected API structure includes:

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/admin/users` - List users (Admin only)
- `POST /api/admin/users` - Create user (Admin only)
- `PUT /api/admin/users/:id` - Update user (Admin only)
- `DELETE /api/admin/users/:id` - Delete user (Admin only)

### Departments
- `GET /api/admin/departments` - List departments
- `POST /api/admin/departments` - Create department
- `PUT /api/admin/departments/:id` - Update department
- `DELETE /api/admin/departments/:id` - Delete department

### Applications & Expenses
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense

## 🎨 Component Library

### Base Components
- `Button` - Enhanced button with variants and sizes
- `Card` - Flexible card component with hover effects
- `Loading` - Loading states and spinners
- `ProtectedRoute` - Route protection wrapper

### Layout Components
- `DashboardLayout` - Role-specific dashboard layout
- `Sidebar` - Navigation sidebar with role-based menu
- `Header` - Top navigation bar

### Form Components
- `LoginForm` - User authentication form
- `UserForm` - User creation/editing form
- `DepartmentForm` - Department management form

## 📱 Responsive Design

- **Mobile-first approach** with breakpoints:
  - xs: < 576px
  - sm: ≥ 576px
  - md: ≥ 768px
  - lg: ≥ 992px
  - xl: ≥ 1200px
  - xxl: ≥ 1600px

- **Adaptive layouts** for different screen sizes
- **Touch-friendly** interactions on mobile devices
- **Collapsible navigation** for smaller screens

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
Ensure all required environment variables are set in production:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NODE_ENV` - Set to 'production'

### Vercel Deployment (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on git push

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📈 Performance Optimization

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Webpack Bundle Analyzer
- **Caching**: React Query caching strategies
- **Lazy Loading**: Components and routes loaded on demand

## 🔧 Configuration

### Tailwind CSS
Custom theme configuration in `tailwind.config.js`:
- Extended color palette
- Custom animations
- Typography settings

### TypeScript
Strict TypeScript configuration:
- Path aliases (`@/*` → `src/*`)
- Type checking
- Interface definitions

### ESLint
Next.js recommended ESLint configuration with custom rules.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the API integration examples

## 🗺 Roadmap

- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native)
- [ ] Advanced notification system
- [ ] Integration with third-party HR services
- [ ] Advanced role and permission management
- [ ] Audit logging and compliance features
- [ ] Advanced leave policies and rules
- [ ] Performance review workflows
- [ ] Document management system
- [ ] Time tracking and attendance
- [ ] Payroll integration
- [ ] Employee onboarding workflows

---

**Built with ❤️ for modern HR management**