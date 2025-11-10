# HRS Frontend - Human Resource Management System

A modern, responsive Next.js frontend application for managing human resources with role-based interfaces for Admins, Managers, and Employees.

## 🚀 Features

### Admin Features
- **Dashboard**: Comprehensive analytics and system overview
- **Employee Management**: Full CRUD operations for employee records
- **Department Management**: Organize and manage departments
- **Leave Management**: Approve/reject leave applications
- **Expense Approvals**: Review and approve expense claims
- **Job Postings**: Create and manage job openings
- **Payroll Management**: Generate payslips and manage salaries
- **Announcements**: System-wide and department-specific announcements
- **Reports**: Generate attendance, leave, and expense reports

### Manager Features
- **Team Dashboard**: Team performance and statistics
- **Team Management**: View and manage team members
- **Leave Approvals**: Approve team member leave requests
- **Expense Approvals**: Review team expenses
- **Department Announcements**: Create announcements for department
- **Team Reports**: Attendance and performance reports

### Employee Features
- **Personal Dashboard**: Personal statistics and quick actions
- **Profile Management**: Update personal information
- **Attendance**: Check-in/check-out with real-time tracking
- **Leave Applications**: Apply for leaves and track status
- **Expense Claims**: Submit expense claims with receipt uploads
- **Payslips**: View and download payslips
- **Announcements**: View company and department announcements
- **Notifications**: Real-time notifications for important updates

### General Features
- **Multi-language Support**: English and Arabic (i18n)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Ready**: Modern UI with Ant Design components
- **Real-time Updates**: React Query for efficient data fetching
- **Export Capabilities**: Export reports to PDF, Excel, and Word
- **Interactive Charts**: Visualize data with Chart.js and Recharts
- **Form Validation**: Robust validation with React Hook Form and Yup
- **Optimized Performance**: Next.js optimizations with SWC compiler

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.5 (React 18)
- **Language**: TypeScript
- **UI Library**: Ant Design 5.19
- **Styling**: Tailwind CSS 3.4
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Yup validation
- **Charts**: Chart.js, React-Chartjs-2, Recharts
- **Internationalization**: next-intl
- **HTTP Client**: Axios
- **Date Handling**: Day.js, date-fns
- **Animations**: Framer Motion
- **Icons**: Ant Design Icons, Lucide React
- **Document Generation**: 
  - jsPDF (PDF generation)
  - jsPDF-AutoTable (PDF tables)
  - docx (Word documents)
  - xlsx (Excel spreadsheets)

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn package manager
- Running backend API (see backend README)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3001
   
   # Environment
   NODE_ENV=development
   ```

4. **Configure API Proxy**
   
   The `next.config.js` is already configured to proxy API requests to the backend:
   ```javascript
   async rewrites() {
     return [
       {
         source: '/api/:path*',
         destination: 'http://localhost:3001/:path*',
       },
     ];
   }
   ```

## 🚦 Running the Application

### Development Mode
```bash
npm run dev
```

The application will start on `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## 🎨 UI/UX Features

### Design System
- **Ant Design Components**: Professional, enterprise-grade UI components
- **Tailwind CSS**: Utility-first CSS framework for custom styling
- **Responsive Grid**: Mobile-first responsive design
- **Consistent Theming**: Centralized theme configuration

### User Experience
- **Intuitive Navigation**: Role-based menu structure
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Toast notifications for actions
- **Search & Filters**: Advanced filtering on data tables
- **Pagination**: Efficient data loading
- **Export Options**: Multiple export formats (PDF, Excel, Word)

## 🌍 Internationalization (i18n)

The application supports multiple languages using next-intl:

- **English** (en)
- **Arabic** (ar) - with RTL support

Language files are located in `src/messages/`:
```
messages/
├── en.json
└── ar.json
```

To add a new language:
1. Create a new JSON file in `src/messages/`
2. Update `i18next/routing.ts` to include the new locale
3. Add translations for all keys

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── [locale]/          # Internationalized routes
│   │   │   ├── admin/         # Admin pages
│   │   │   ├── manager/       # Manager pages
│   │   │   ├── employee/      # Employee pages
│   │   │   ├── login/         # Login page
│   │   │   └── layout.tsx     # Root layout
│   │   └── api/               # API route handlers (if needed)
│   ├── components/            # Reusable components
│   │   ├── admin/            # Admin-specific components
│   │   ├── employee/         # Employee-specific components
│   │   ├── manager/          # Manager-specific components
│   │   ├── shared/           # Shared components
│   │   └── ui/               # UI components
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication context
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   └── useApi.ts        # API hook
│   ├── lib/                  # Utility libraries
│   │   └── api.ts           # API client configuration
│   ├── types/                # TypeScript type definitions
│   │   ├── user.ts
│   │   ├── attendance.ts
│   │   ├── leave.ts
│   │   └── ...
│   ├── utils/                # Utility functions
│   │   ├── exportUtils.ts   # Export functionality
│   │   ├── dateUtils.ts     # Date formatting
│   │   └── validators.ts    # Form validators
│   ├── messages/             # i18n translation files
│   │   ├── en.json
│   │   └── ar.json
│   └── styles/               # Global styles
│       └── globals.css
├── public/                    # Static assets
│   ├── images/
│   └── icons/
├── i18next/                   # i18n configuration
│   ├── request.ts
│   └── routing.ts
├── middleware.ts              # Next.js middleware
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 🔐 Authentication & Authorization

### Authentication Flow
1. User enters credentials on login page
2. Frontend sends POST request to `/auth/login`
3. Backend validates and returns JWT token
4. Token is stored in cookies (httpOnly)
5. Token is included in all subsequent API requests
6. Protected routes check for valid token

### Role-Based Access Control
- **Admin**: Full system access
- **Manager**: Department and team management
- **Employee**: Personal information and actions

### Protected Routes
Routes are protected using middleware and authentication context:

```typescript
// middleware.ts checks authentication
// AuthContext provides user info and role
// Route components verify user role
```

## 📊 Data Management

### React Query (TanStack Query)
Efficient data fetching and caching:

```typescript
// Example: Fetch employees
const { data, isLoading, error } = useQuery({
  queryKey: ['employees'],
  queryFn: () => api.get('/api/admin/employees'),
});
```

### Form Handling
React Hook Form with Yup validation:

```typescript
const schema = yup.object().shape({
  fullName: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: yupResolver(schema),
});
```

## 📈 Charts & Visualization

The application uses multiple charting libraries:

### Chart.js (via React-Chartjs-2)
- Bar charts
- Line charts
- Pie charts
- Doughnut charts

### Recharts
- Area charts
- Composed charts
- Responsive containers

Example usage:
```typescript
import { Bar } from 'react-chartjs-2';

const data = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{
    label: 'Attendance',
    data: [65, 59, 80],
  }],
};

<Bar data={data} options={options} />
```

## 📄 Export Functionality

### PDF Export (jsPDF)
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const exportToPDF = (data) => {
  const doc = new jsPDF();
  autoTable(doc, {
    head: [['Name', 'Department', 'Status']],
    body: data,
  });
  doc.save('report.pdf');
};
```

### Excel Export (xlsx)
```typescript
import * as XLSX from 'xlsx';

const exportToExcel = (data) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'report.xlsx');
};
```

### Word Export (docx)
```typescript
import { Document, Packer, Paragraph, Table } from 'docx';

const exportToWord = (data) => {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph('Report Title'),
        new Table({ /* table config */ }),
      ],
    }],
  });
  
  Packer.toBlob(doc).then(blob => {
    saveAs(blob, 'report.docx');
  });
};
```

## 🎯 Performance Optimizations

### Next.js Optimizations
- **SWC Compiler**: Faster minification and compilation
- **Tree Shaking**: Optimized imports for Ant Design and icons
- **Image Optimization**: Next/Image with AVIF and WebP support
- **CSS Optimization**: Critters for critical CSS
- **Code Splitting**: Automatic page-based splitting
- **Production Build**: Console logs removed in production

### Configuration Highlights
```javascript
// next.config.js
{
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['antd', '@ant-design/icons', 'recharts'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}
```

## 🌐 Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables for Production
Set these in your hosting platform:
- `NEXT_PUBLIC_API_URL`: Your backend API URL
- `NODE_ENV`: production

### Build Optimization
```bash
# Create optimized production build
npm run build

# Analyze bundle size (optional)
npm run analyze
```

## 🧪 Testing

The application is ready for testing integration. Recommended testing setup:

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Cypress or Playwright
- **API Tests**: Mock Service Worker (MSW)

## 🔧 Configuration Files

### `next.config.js`
- Module transpilation
- API proxy setup
- Performance optimizations
- Webpack configuration

### `tailwind.config.js`
- Custom theme colors
- Font configuration
- Plugin setup

### `tsconfig.json`
- TypeScript compiler options
- Path aliases
- Module resolution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended configuration
- **Formatting**: Consistent code formatting
- **Naming Conventions**:
  - Components: PascalCase
  - Files: kebab-case
  - Variables/Functions: camelCase

## 🐛 Troubleshooting

### Common Issues

**API Connection Error**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Verify NEXT_PUBLIC_API_URL in .env.local
```

**Build Errors**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

**Module Not Found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Ant Design Components](https://ant.design/components/overview)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 📄 License

This project is licensed under the ISC License.

---

**Built with ❤️ using Next.js and modern web technologies**
#   H r - M a n g m e n t - s y s t e m - f r o n t e n d  
 #   H r - M a n g m e n t - s y s t e m - f  
 