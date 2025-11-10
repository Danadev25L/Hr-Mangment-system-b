import baseApiClient from './base'

export class AnnouncementsApi {
  async getAnnouncements() {
    const userRole = baseApiClient.getUserRole()
    let endpoint: string

    switch (userRole) {
      case 'admin':
        endpoint = '/api/admin/announcements'
        break
      case 'manager':
        endpoint = '/api/manager/announcements'
        break
      default:
        endpoint = '/api/employee/announcements'
        break
    }

    const response = await baseApiClient.httpClient.get(endpoint)
    return response.data
  }

  async getAnnouncement(id: number) {
    const userRole = baseApiClient.getUserRole()
    let endpoint: string

    switch (userRole) {
      case 'admin':
        endpoint = `/api/admin/announcements/${id}`
        break
      case 'manager':
        endpoint = `/api/manager/announcements/${id}`
        break
      default:
        endpoint = `/api/employee/announcements/${id}`
        break
    }

    const response = await baseApiClient.httpClient.get(endpoint)
    return response.data
  }

  async createAnnouncement(data: any) {
    const userRole = baseApiClient.getUserRole()
    let endpoint: string

    switch (userRole) {
      case 'admin':
        endpoint = '/api/admin/announcements'
        break
      case 'manager':
        endpoint = '/api/manager/announcements'
        break
      default:
        endpoint = '/api/employee/announcements'
        break
    }

    const response = await baseApiClient.httpClient.post(endpoint, data)
    return response.data
  }

  async updateAnnouncement(id: number, data: any) {
    const userRole = baseApiClient.getUserRole()
    let endpoint: string

    switch (userRole) {
      case 'admin':
        endpoint = `/api/admin/announcements/${id}`
        break
      case 'manager':
        endpoint = `/api/manager/announcements/${id}`
        break
      default:
        endpoint = `/api/employee/announcements/${id}`
        break
    }

    const response = await baseApiClient.httpClient.put(endpoint, data)
    return response.data
  }

  async deleteAnnouncement(id: number) {
    const userRole = baseApiClient.getUserRole()
    let endpoint: string

    switch (userRole) {
      case 'admin':
        endpoint = `/api/admin/announcements/${id}`
        break
      case 'manager':
        endpoint = `/api/manager/announcements/${id}`
        break
      default:
        endpoint = `/api/employee/announcements/${id}`
        break
    }

    const response = await baseApiClient.httpClient.delete(endpoint)
    return response.data
  }

  async toggleAnnouncementStatus(id: number) {
    const response = await baseApiClient.httpClient.put(`/api/admin/announcements/${id}/toggle`)
    return response.data
  }

  async markAnnouncementAsRead(id: number) {
    const response = await baseApiClient.httpClient.put(`/api/employee/announcements/${id}/read`)
    return response.data
  }

  async toggleAnnouncement(id: string) {
    const response = await baseApiClient.httpClient.put(`/api/admin/announcements/${id}/toggle`)
    return response.data
  }
}

export const announcementsApi = new AnnouncementsApi()