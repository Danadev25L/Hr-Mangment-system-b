// Main API client that exports all API modules
export { authApi } from './auth'
export { announcementsApi } from './announcements'
export { employeesApi } from './employees'
export { attendanceApi } from './attendance'

// Base API client for advanced usage
import baseApiClient from './base'
export { baseApiClient }

// Legacy export for backward compatibility
const apiClient = {
  // Auth
  login: (credentials: any) => import('./auth').then(m => m.authApi.login(credentials)),
  register: (data: any) => import('./auth').then(m => m.authApi.register(data)),
  logout: () => import('./auth').then(m => m.authApi.logout()),
  getCurrentUser: () => import('./auth').then(m => m.authApi.getCurrentUser()),
  changePassword: (data: any) => import('./auth').then(m => m.authApi.changePassword(data)),

  // Announcements
  getAnnouncements: () => import('./announcements').then(m => m.announcementsApi.getAnnouncements()),
  getAnnouncement: (id: number) => import('./announcements').then(m => m.announcementsApi.getAnnouncement(id)),
  createAnnouncement: (data: any) => import('./announcements').then(m => m.announcementsApi.createAnnouncement(data)),
  updateAnnouncement: (id: number, data: any) => import('./announcements').then(m => m.announcementsApi.updateAnnouncement(id, data)),
  deleteAnnouncement: (id: number) => import('./announcements').then(m => m.announcementsApi.deleteAnnouncement(id)),

  // Employees
  getUsers: (page?: number, limit?: number, filters?: any) =>
    import('./employees').then(m => m.employeesApi.getUsers(page, limit, filters)),
  getUser: (id: number) => import('./employees').then(m => m.employeesApi.getUser(id)),
  createUser: (data: any) => import('./employees').then(m => m.employeesApi.createUser(data)),
  updateUser: (id: number | string, data: any) => import('./employees').then(m => m.employeesApi.updateUser(id, data)),
  deleteUser: (id: number | string) => import('./employees').then(m => m.employeesApi.deleteUser(id)),

  // Departments - Legacy method
  getDepartments: () => import('./employees').then(m => m.employeesApi.getDepartments()),

  // Attendance - Legacy methods for backward compatibility
  markEmployeeCheckIn: (data: any) => import('./attendance').then(m => m.attendanceApi.markEmployeeCheckIn(data)),
  markEmployeeCheckOut: (data: any) => import('./attendance').then(m => m.attendanceApi.markEmployeeCheckOut(data)),
  markEmployeeAbsent: (data: any) => import('./attendance').then(m => m.attendanceApi.markEmployeeAbsent(data)),
  getAllEmployeesWithAttendance: (params?: any) => import('./attendance').then(m => m.attendanceApi.getAllEmployeesWithAttendance(params)),
  checkEmployeeLeave: (employeeId: number, date: string) => import('./attendance').then(m => m.attendanceApi.checkEmployeeLeave(employeeId, date)),
  addLatency: (data: any) => import('./attendance').then(m => m.attendanceApi.addLatency(data)),
  addEarlyDeparture: (data: any) => import('./attendance').then(m => m.attendanceApi.addEarlyDeparture(data)),
  addBreakDuration: (data: any) => import('./attendance').then(m => m.attendanceApi.addBreakDuration(data)),
  editCheckInTime: (data: any) => import('./attendance').then(m => m.attendanceApi.editCheckInTime(data)),
  editCheckOutTime: (data: any) => import('./attendance').then(m => m.attendanceApi.editCheckOutTime(data)),
  editBreakDuration: (data: any) => import('./attendance').then(m => m.attendanceApi.editBreakDuration(data)),
  addAttendanceOvertime: (data: any) => import('./attendance').then(m => m.attendanceApi.addAttendanceOvertime(data)),

  // Direct access to base client
  client: baseApiClient.httpClient,
  httpClient: baseApiClient.httpClient
}

export default apiClient