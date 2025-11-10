import baseApiClient from './base'

export class AttendanceApi {
  // Employee attendance methods
  async checkIn(data: { location?: string; ipAddress?: string; deviceInfo?: string; notes?: string }) {
    const response = await baseApiClient.httpClient.post('/api/employee/attendance/check-in', data)
    return response.data
  }

  async checkOut(data?: { notes?: string }) {
    const response = await baseApiClient.httpClient.post('/api/employee/attendance/check-out', data || {})
    return response.data
  }

  async getMyAttendance(params?: { startDate?: string; endDate?: string; month?: number; year?: number }) {
    const response = await baseApiClient.httpClient.get('/api/employee/attendance', { params })
    return response.data
  }

  async getTodayAttendance() {
    const response = await baseApiClient.httpClient.get('/api/employee/attendance/today')
    return response.data
  }

  async getMyAttendanceSummary(params?: { month?: number; year?: number }) {
    const response = await baseApiClient.httpClient.get('/api/employee/attendance/summary', { params })
    return response.data
  }

  async requestAttendanceCorrection(data: {
    date: string;
    correctCheckIn?: string;
    correctCheckOut?: string;
    reason: string;
  }) {
    const response = await baseApiClient.httpClient.post('/api/employee/attendance/corrections', data)
    return response.data
  }

  async getMyCorrectionRequests() {
    const response = await baseApiClient.httpClient.get('/api/employee/attendance/corrections')
    return response.data
  }

  // Manager attendance methods
  async getTeamAttendance(params?: {
    date?: string;
    departmentId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await baseApiClient.httpClient.get('/api/manager/attendance/team', { params })
    return response.data
  }

  async getTodayTeamAttendance() {
    const response = await baseApiClient.httpClient.get('/api/manager/attendance/team/today')
    return response.data
  }

  async getTeamAttendanceSummary(params?: { month?: number; year?: number }) {
    const response = await baseApiClient.httpClient.get('/api/manager/attendance/team/summary', { params })
    return response.data
  }

  async getPendingCorrections() {
    const response = await baseApiClient.httpClient.get('/api/manager/attendance/corrections/pending')
    return response.data
  }

  async approveCorrection(id: number, reviewNotes?: string) {
    const response = await baseApiClient.httpClient.put(`/api/manager/attendance/corrections/${id}/approve`, { reviewNotes })
    return response.data
  }

  async rejectCorrection(id: number, reviewNotes: string) {
    const response = await baseApiClient.httpClient.put(`/api/manager/attendance/corrections/${id}/reject`, { reviewNotes })
    return response.data
  }

  // Admin attendance methods
  async getAllAttendance(params?: {
    date?: string;
    departmentId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await baseApiClient.httpClient.get('/api/admin/attendance', { params })
    return response.data
  }

  async getAllAttendanceSummaries(params?: { month?: number; year?: number; departmentId?: number }) {
    const response = await baseApiClient.httpClient.get('/api/admin/attendance/summaries', { params })
    return response.data
  }

  async getAllCorrectionRequests(params?: { status?: string }) {
    const response = await baseApiClient.httpClient.get('/api/admin/attendance/corrections', { params })
    return response.data
  }

  async createManualAttendance(data: {
    employeeId: number;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.post('/api/admin/attendance', data)
    return response.data
  }

  async updateAttendance(id: number, data: {
    checkInTime?: string;
    checkOutTime?: string;
    status?: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.put(`/api/admin/attendance/${id}`, data)
    return response.data
  }

  async deleteAttendance(id: number) {
    const response = await baseApiClient.httpClient.delete(`/api/admin/attendance/${id}`)
    return response.data
  }

  async generateMonthlySummaries(data: { month: number; year: number }) {
    const response = await baseApiClient.httpClient.post('/api/admin/attendance/generate-summaries', data)
    return response.data
  }

  // Advanced admin attendance methods
  async getAllEmployeesWithAttendance(params?: {
    date?: string;
    departmentId?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await baseApiClient.httpClient.get('/api/admin/attendance/employees', { params })
    return response.data
  }

  async getEmployeeAttendanceDetails(params: { userId: number; date: string }) {
    const response = await baseApiClient.httpClient.get('/api/admin/attendance/employee/details', { params })
    return response.data
  }

  async getEmployeeAttendanceStats(employeeId: number, month: number, year: number) {
    const response = await baseApiClient.httpClient.get(`/api/admin/attendance/employee/${employeeId}/details`, {
      params: { month, year }
    })
    return response.data
  }

  // Check-in/Check-out marking
  async markEmployeeCheckIn(data: {
    employeeId: number;
    checkInTime: string;
    date?: string;
    expectedCheckInTime?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.post('/api/admin/attendance/checkin', data)
    return response.data
  }

  async markEmployeeCheckOut(data: {
    employeeId: number;
    checkOutTime: string;
    date?: string;
    expectedCheckOutTime?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.post('/api/admin/attendance/checkout', data)
    return response.data
  }

  async markEmployeeAbsent(data: {
    employeeId: number;
    date: string;
    reason?: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.post('/api/admin/attendance/mark-absent', data)
    return response.data
  }

  async checkEmployeeLeave(employeeId: number, date: string) {
    const response = await baseApiClient.httpClient.get('/api/admin/attendance/check-leave', {
      params: { employeeId, date }
    })
    return response.data
  }

  // Attendance management
  async getAttendanceReport(params: {
    startDate: string;
    endDate: string;
    departmentId?: number;
    employeeId?: number;
    format?: 'json' | 'csv';
  }) {
    const response = await baseApiClient.httpClient.get('/api/admin/attendance/report', { params })
    return response.data
  }

  async exportAttendanceCSV(params: {
    startDate: string;
    endDate: string;
    departmentId?: number;
    employeeId?: number;
  }) {
    const response = await baseApiClient.httpClient.get('/api/admin/attendance/export/csv', { params })
    return response.data
  }

  // Latency and early departure
  async addLatency(data: {
    employeeId: number;
    date: string;
    lateMinutes: number;
    reason?: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.post('/api/admin/attendance/add-latency', data)
    return response.data
  }

  async addEarlyDeparture(data: {
    employeeId: number;
    date: string;
    earlyMinutes: number;
    reason?: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.post('/api/admin/attendance/add-early-departure', data)
    return response.data
  }

  // Break management
  async addBreakDuration(data: {
    employeeId: number;
    date: string;
    breakDuration: number;
    reason?: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.post('/api/admin/attendance/add-break', data)
    return response.data
  }

  async editBreakDuration(data: {
    attendanceId: number;
    breakDuration: number;
    reason?: string;
  }) {
    const response = await baseApiClient.httpClient.put('/api/admin/attendance/edit-break', data)
    return response.data
  }

  // Overtime management
  async addAttendanceOvertime(data: {
    employeeId: number;
    date: string;
    overtimeHours: number;
    reason?: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.put('/api/admin/attendance/add-overtime', data)
    return response.data
  }

  // Time editing
  async editCheckInTime(data: {
    attendanceId: number;
    newCheckInTime: string;
    reason?: string;
  }) {
    const response = await baseApiClient.httpClient.put('/api/admin/attendance/edit-checkin', data)
    return response.data
  }

  async editCheckOutTime(data: {
    attendanceId: number;
    newCheckOutTime: string;
    reason?: string;
  }) {
    const response = await baseApiClient.httpClient.put('/api/admin/attendance/edit-checkout', data)
    return response.data
  }

  // Bulk operations
  async bulkMarkAttendance(data: {
    date: string;
    employeeIds: number[];
    status: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.post('/api/admin/attendance/bulk-mark', data)
    return response.data
  }

  // Partial leave
  async addPartialLeave(data: {
    employeeId: number;
    date: string;
    leaveType: 'half_day' | 'partial_hours';
    leaveHours?: number;
    reason: string;
    notes?: string;
  }) {
    const response = await baseApiClient.httpClient.post('/api/admin/attendance/add-partial-leave', data)
    return response.data
  }
}

export const attendanceApi = new AttendanceApi()