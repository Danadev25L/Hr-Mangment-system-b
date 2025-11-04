# Dashboard API Integration Plan

## Overview
Replace all mock/static data in the admin dashboard with real API calls and add event creation capability to the calendar.

## Phase 1: Backend API Endpoints (To Create)

### Calendar Events API
Create: `backend/modules/admin/controllers/calendar.admin.controller.js`

```javascript
// GET /api/admin/calendar-events
export const getCalendarEvents = async (req, res) => {
  // Fetch all calendar events from database
}

// POST /api/admin/calendar-events
export const createCalendarEvent = async (req, res) => {
  // Create new calendar event
  // Fields: title, type, date, time, description
}

// PUT /api/admin/calendar-events/:id
export const updateCalendarEvent = async (req, res) => {
  // Update existing event
}

// DELETE /api/admin/calendar-events/:id
export const deleteCalendarEvent = async (req, res) => {
  // Delete event
}
```

### Dashboard Statistics API (Enhance Existing)
Update: `backend/modules/shared/controllers/dashboard.controller.js`

Add these new endpoints:
- `/api/dashboard/employee-growth` - Monthly employee growth data
- `/api/dashboard/attendance-weekly` - Weekly attendance statistics
- `/api/dashboard/expenses-trend` - Monthly expense trends
- `/api/dashboard/attendance-today` - Today's attendance stats

## Phase 2: Database Schema

### Calendar Events Table
```sql
CREATE TABLE calendar_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- meeting, deadline, holiday, birthday, training, review
  date DATE NOT NULL,
  time TIME,
  description TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Phase 3: Frontend Integration

### API Client Updates
File: `frontend/src/lib/api.ts`

Add methods:
```typescript
// Calendar Events
async getCalendarEvents() {
  const response = await this.client.get('/api/admin/calendar-events')
  return response.data
}

async createCalendarEvent(data: any) {
  const response = await this.client.post('/api/admin/calendar-events', data)
  return response.data
}

async updateCalendarEvent(id: number, data: any) {
  const response = await this.client.put(`/api/admin/calendar-events/${id}`, data)
  return response.data
}

async deleteCalendarEvent(id: number) {
  const response = await this.client.delete(`/api/admin/calendar-events/${id}`)
  return response.data
}

// Dashboard Charts
async getEmployeeGrowthData(params?: { period: string }) {
  const response = await this.client.get('/api/dashboard/employee-growth', { params })
  return response.data
}

async getAttendanceWeekly() {
  const response = await this.client.get('/api/dashboard/attendance-weekly')
  return response.data
}

async getExpensesTrend(params?: { period: string }) {
  const response = await this.client.get('/api/dashboard/expenses-trend', { params })
  return response.data
}

async getTodayAttendanceStats() {
  const response = await this.client.get('/api/dashboard/attendance-today')
  return response.data
}
```

### Dashboard Component Updates
File: `frontend/src/app/[locale]/admin/dashboard/page.tsx`

Changes needed:
1. Add Form component imports for event creation
2. Add useQuery hooks for all chart data
3. Add useMutation hooks for calendar CRUD
4. Update onDateSelect to always open modal
5. Add event form with validation
6. Replace all mock data variables with API data

## Phase 4: Translation Keys

Already added in previous work:
- `calendar.eventCreated`
- `calendar.eventCreateFailed`
- `calendar.eventUpdated`
- `calendar.eventUpdateFailed`
- `calendar.eventDeleted`
- `calendar.eventDeleteFailed`
- `calendar.confirmDelete`
- `calendar.confirmDeleteDesc`

## Implementation Order

1. ✅ Create backend calendar events table (schema)
2. ✅ Create backend calendar events controller
3. ✅ Create backend calendar events routes
4. ✅ Add dashboard statistics endpoints
5. ✅ Update frontend API client
6. ✅ Update dashboard component with event creation
7. ✅ Replace mock data with API calls
8. ✅ Test all functionality

## Testing Checklist

- [ ] Can create calendar event by clicking any date
- [ ] Can view existing events
- [ ] Can edit events
- [ ] Can delete events
- [ ] Employee growth chart shows real data
- [ ] Department pie chart shows real data
- [ ] Attendance bar chart shows real data
- [ ] Expense line chart shows real data
- [ ] Stats cards show real numbers
- [ ] All API calls handle errors gracefully
