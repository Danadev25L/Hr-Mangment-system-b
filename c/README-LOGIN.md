# HR System - Login & Authentication

## 🔐 Login System

This Next.js application includes a complete authentication system integrated with your existing backend.

### Features

✅ **Secure Authentication**
- JWT token-based authentication
- Password visibility toggle
- Form validation
- Error handling with user-friendly messages
- Auto-redirect based on user role

✅ **Role-Based Access Control**
- Admin Dashboard
- Manager Dashboard  
- Employee Dashboard
- Protected routes with auth guards

✅ **Security Features**
- HTTPS/TLS support
- Token stored in localStorage and Zustand
- Automatic token validation
- 401/403 error handling
- Request timeout (30s)
- CORS protection

✅ **User Experience**
- Loading states
- Error messages
- Success notifications
- Responsive design
- Ant Design UI components

## 🚀 Getting Started

### 1. Start the Backend

```bash
cd thesis-fullstack
npm start
```

Backend should run on: `http://localhost:3001`

### 2. Start the Frontend

```bash
cd c
npm run dev
```

Frontend runs on: `http://localhost:3000`

### 3. Login

Navigate to `http://localhost:3000/login`

**Test with your database credentials:**
- Username: (from your database)
- Password: (from your database)

## 📁 File Structure

```
c/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Protected dashboard layout
│   │   ├── admin/page.tsx      # Admin dashboard
│   │   ├── manager/page.tsx    # Manager dashboard
│   │   └── employee/page.tsx   # Employee dashboard
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Home page (redirects)
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Role-based sidebar
│   │   │   ├── DashboardHeader.tsx   # Header with user menu
│   │   │   └── DashboardLayout.tsx   # Main layout wrapper
│   │   ├── Providers.tsx             # React Query & Ant Design providers
│   │   └── RoleSwitcher.tsx          # Dev tool for testing roles
│   │
│   ├── store/
│   │   └── useAuthStore.ts           # Zustand auth store
│   │
│   ├── services/
│   │   └── auth.service.ts           # Auth API calls
│   │
│   ├── hooks/
│   │   └── useLogin.ts               # Login mutation hook
│   │
│   ├── middleware/
│   │   └── auth.ts                   # Auth guards & hooks
│   │
│   ├── lib/
│   │   ├── api.ts                    # Axios instance & interceptors
│   │   └── menuConfig.tsx            # Role-based menu items
│   │
│   └── types/
│       └── index.ts                  # TypeScript types
│
└── .env.local                        # Environment variables
```

## 🔄 Authentication Flow

1. **User visits app** → Redirected to `/login` if not authenticated
2. **User submits credentials** → POST `/auth/login`
3. **Backend validates** → Returns JWT token + user data
4. **Frontend stores** → Token in localStorage + Zustand store
5. **User redirected** → To appropriate dashboard based on role
6. **Protected routes** → Token validated on each request
7. **Token expires** → User auto-redirected to login

## 🔌 API Integration

### Backend Endpoints Used

```javascript
POST /auth/login                    // Login
GET  /checkToken                    // Validate token
GET  /api/admin/*                   // Admin endpoints
GET  /api/manager/*                 // Manager endpoints
GET  /api/employee/*                // Employee endpoints
GET  /api/shared/*                  // Shared endpoints
```

### Request Headers

All authenticated requests include:
```
Authorization: Bearer <JWT_TOKEN>
```

## 🎨 Customization

### Change API URL

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://your-backend-url:3001
```

### Customize Theme

Edit `src/components/Providers.tsx`:
```typescript
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#667eea',  // Change primary color
      borderRadius: 6,           // Change border radius
    },
  }}
>
```

### Add More Menu Items

Edit `src/lib/menuConfig.tsx` and add items based on backend routes.

## 🛡️ Security Best Practices

✅ **Implemented:**
- JWT tokens with 24h expiration
- Password hashing (bcrypt on backend)
- HTTPS ready
- CORS configuration
- Request/Response interceptors
- Auth guards on protected routes
- Token validation on mount
- Secure cookie storage ready

⚠️ **Production Checklist:**
- [ ] Use HTTPS in production
- [ ] Set secure HttpOnly cookies for tokens
- [ ] Implement CSRF protection
- [ ] Add rate limiting
- [ ] Enable MFA (Multi-Factor Auth)
- [ ] Regular security audits
- [ ] Environment-specific configs

## 🐛 Troubleshooting

### Login fails with "Network Error"
- Check backend is running: `http://localhost:3001`
- Verify `.env.local` has correct API URL
- Check browser console for CORS errors

### 401 Unauthorized after login
- Token might be expired
- Check localStorage has `token` key
- Verify backend JWT_SECRET is configured

### Redirects to login repeatedly
- Clear browser localStorage
- Check token validation endpoint `/checkToken`
- Verify backend middleware is working

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Ant Design](https://ant.design/components/overview/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)

## 👨‍💻 Development

Created by Dana - HR Management System
