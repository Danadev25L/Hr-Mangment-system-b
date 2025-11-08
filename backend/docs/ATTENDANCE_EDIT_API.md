# Attendance Edit & Update API Documentation

## ✅ Fixed Issues

All attendance edit endpoints now:
- ✅ Have proper `id` field usage (attendance records have primary key)
- ✅ Support both `attendanceId` OR `employeeId + date` for flexible querying
- ✅ Include comprehensive validation and error handling
- ✅ Recalculate late/early departure/overtime status automatically
- ✅ Create audit logs for all changes
- ✅ Verify user existence before operations
- ✅ Return detailed success/error messages

---

## 🔧 Edit Operations Available

### 1. Edit Check-In Time
**Endpoint:** `PUT /api/admin/attendance/edit-checkin`

**Description:** Updates the check-in time for an attendance record and recalculates late status.

**Request Body:**
```json
{
  // Option 1: Using attendance ID
  "attendanceId": 123,
  
  // Option 2: Using employee + date
  "employeeId": 45,
  "date": "2025-11-06",
  
  // Required
  "checkInTime": "2025-11-06T08:30:00Z",
  
  // Optional
  "expectedCheckInTime": "2025-11-06T08:00:00Z",
  "reason": "Correcting wrong punch time"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check-in time updated successfully",
  "attendance": {
    "id": 123,
    "userId": 45,
    "checkIn": "2025-11-06T08:30:00Z",
    "isLate": true,
    "lateMinutes": 30,
    "status": "late",
    "workingHours": 480,
    "updatedAt": "2025-11-06T10:00:00Z"
  }
}
```

---

### 2. Edit Check-Out Time
**Endpoint:** `PUT /api/admin/attendance/edit-checkout`

**Description:** Updates the check-out time and recalculates working hours, early departure, and overtime.

**Request Body:**
```json
{
  // Option 1: Using attendance ID
  "attendanceId": 123,
  
  // Option 2: Using employee + date
  "employeeId": 45,
  "date": "2025-11-06",
  
  // Required
  "checkOutTime": "2025-11-06T17:30:00Z",
  
  // Optional
  "expectedCheckOutTime": "2025-11-06T17:00:00Z",
  "reason": "Correcting wrong punch time"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check-out time updated successfully",
  "attendance": {
    "id": 123,
    "userId": 45,
    "checkOut": "2025-11-06T17:30:00Z",
    "workingHours": 540,
    "overtimeMinutes": 30,
    "isEarlyDeparture": false,
    "earlyDepartureMinutes": 0,
    "status": "present",
    "updatedAt": "2025-11-06T18:00:00Z"
  }
}
```

---

### 3. Edit Break Duration
**Endpoint:** `PUT /api/admin/attendance/edit-break`

**Description:** Replaces the total break duration (not adding to existing).

**Request Body:**
```json
{
  // Option 1: Using attendance ID
  "attendanceId": 123,
  
  // Option 2: Using employee + date
  "employeeId": 45,
  "date": "2025-11-06",
  
  // Required (in hours)
  "breakDurationHours": 1.5,
  
  // Optional
  "reason": "Updating break duration"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Break duration updated to 1h 30m",
  "attendance": {
    "id": 123,
    "userId": 45,
    "breakDuration": 90,
    "updatedAt": "2025-11-06T18:00:00Z"
  },
  "breakDuration": "1h 30m"
}
```

---

### 4. Update Complete Attendance Record
**Endpoint:** `PUT /api/admin/attendance/update-record`

**Description:** Updates multiple fields of an attendance record at once.

**Request Body:**
```json
{
  // Option 1: Using attendance ID
  "attendanceId": 123,
  
  // Option 2: Using employee + date
  "employeeId": 45,
  "date": "2025-11-06",
  
  // All optional - update only what you need
  "checkInTime": "2025-11-06T08:00:00Z",
  "checkOutTime": "2025-11-06T17:00:00Z",
  "breakDurationHours": 1.0,
  "status": "present",
  "notes": "Corrected attendance record",
  "reason": "Admin correction after review"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance record updated successfully",
  "attendance": {
    "id": 123,
    "userId": 45,
    "date": "2025-11-06T00:00:00Z",
    "checkIn": "2025-11-06T08:00:00Z",
    "checkOut": "2025-11-06T17:00:00Z",
    "workingHours": 540,
    "breakDuration": 60,
    "status": "present",
    "notes": "Corrected attendance record",
    "updatedAt": "2025-11-06T18:00:00Z"
  }
}
```

---

### 5. Delete Attendance Record
**Endpoint:** `DELETE /api/admin/attendance/delete-record`

**Description:** Permanently deletes an attendance record and all related data.

**Request Body:**
```json
{
  // Option 1: Using attendance ID
  "attendanceId": 123,
  
  // Option 2: Using employee + date
  "employeeId": 45,
  "date": "2025-11-06",
  
  // Optional but recommended
  "reason": "Duplicate entry or incorrect data"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance record deleted successfully"
}
```

---

## 🔄 Add Break (Adds to Existing)
**Endpoint:** `POST /api/admin/attendance/add-break`

**Description:** Adds to the existing break duration (doesn't replace it).

**Request Body:**
```json
{
  "employeeId": 45,
  "date": "2025-11-06",
  "breakDurationHours": 0.5,
  "breakType": "Coffee Break",
  "reason": "Additional 30-minute break"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Break of 30m added successfully",
  "attendance": {
    "id": 123,
    "breakDuration": 120,
    "notes": "Previous notes\nBreak: Coffee Break - 30m (Additional 30-minute break)"
  },
  "breakAdded": "30m",
  "totalBreakDuration": 120
}
```

---

## 📊 Key Features

### Automatic Recalculations
When you edit times, the system automatically recalculates:
- ✅ **Working Hours**: Based on check-in and check-out times
- ✅ **Late Status**: Compares check-in with expected time
- ✅ **Early Departure**: Compares check-out with expected time
- ✅ **Overtime**: Calculates minutes beyond expected hours
- ✅ **Status**: Updates based on late/early departure conditions

### Audit Trail
Every edit operation creates an audit log with:
- ✅ Old values before the change
- ✅ New values after the change
- ✅ Who made the change (admin ID)
- ✅ When the change was made
- ✅ Why the change was made (reason)
- ✅ IP address and user agent

### Validation
All endpoints validate:
- ✅ User existence
- ✅ Date formats
- ✅ Time logic (check-in before check-out)
- ✅ Required fields
- ✅ Data types

---

## 🧪 Testing Examples

### Using cURL

**Edit Check-In:**
```bash
curl -X PUT http://localhost:3000/api/admin/attendance/edit-checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "attendanceId": 123,
    "checkInTime": "2025-11-06T08:30:00Z",
    "reason": "Correcting time"
  }'
```

**Edit Check-Out:**
```bash
curl -X PUT http://localhost:3000/api/admin/attendance/edit-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": 45,
    "date": "2025-11-06",
    "checkOutTime": "2025-11-06T17:30:00Z"
  }'
```

**Update Complete Record:**
```bash
curl -X PUT http://localhost:3000/api/admin/attendance/update-record \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "attendanceId": 123,
    "checkInTime": "2025-11-06T08:00:00Z",
    "checkOutTime": "2025-11-06T17:00:00Z",
    "breakDurationHours": 1.0,
    "status": "present",
    "notes": "Corrected by admin"
  }'
```

**Delete Record:**
```bash
curl -X DELETE http://localhost:3000/api/admin/attendance/delete-record \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "attendanceId": 123,
    "reason": "Duplicate entry"
  }'
```

---

## ⚠️ Important Notes

1. **attendanceId vs employeeId + date**: 
   - Use `attendanceId` if you know the exact record ID (faster, more precise)
   - Use `employeeId + date` to find the record for a specific employee on a specific day

2. **Break Duration**:
   - `edit-break` **replaces** the total break duration
   - `add-break` **adds** to the existing break duration

3. **Working Hours Calculation**:
   - Automatically calculated when both check-in and check-out exist
   - In minutes, not hours (e.g., 480 minutes = 8 hours)

4. **Status Values**:
   - `present` - Normal attendance
   - `late` - Checked in late
   - `early_departure` - Left early
   - `absent` - No check-in
   - `on_leave` - Approved leave

5. **Time Format**:
   - Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
   - Example: `2025-11-06T08:30:00Z`

6. **Authorization**:
   - All endpoints require admin authentication
   - Include JWT token in Authorization header

---

## 🎯 Summary

The attendance system is now **fully functional** with:
- ✅ Proper ID field in database schema
- ✅ Complete edit operations for all fields
- ✅ Automatic recalculations
- ✅ Comprehensive validation
- ✅ Full audit trail
- ✅ Flexible query options
- ✅ Error handling

**You can now edit check-ins, check-outs, breaks, and any other attendance field successfully!**
