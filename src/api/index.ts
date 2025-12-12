import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 管理员接口
export const adminApi = {
  // 班级管理
  getClassList: () => request.get('/admin/classes'),
  getClassDetail: (classId: string) => request.get(`/admin/classes/${classId}`),
  getClassStudents: (classId: string) => request.get(`/admin/classes/${classId}/students`),

  // 班级增删改
  createClass: (data: any) => request.post('/admin/classes', data),
  updateClass: (classId: string, data: any) => request.put(`/admin/classes/${classId}`, data),
  deleteClass: (classId: string) => request.delete(`/admin/classes/${classId}`),

  // 教师管理
  getTeacherList: () => request.get('/admin/teachers'),
  
  // 任务发布
  publishTask: (data: any) => request.post('/admin/tasks', data),
  getTaskList: (params?: any) => request.get('/admin/tasks', { params }),
  getTaskDetail: (taskId: string) => request.get(`/admin/tasks/${taskId}`),
  
  // 视频管理
  uploadVideos: (formData: FormData) => request.post('/admin/videos/upload', formData),
  getVideoList: (params?: any) => request.get('/admin/videos', { params }),
  analyzeVideo: (videoId: string) => request.post(`/admin/videos/${videoId}/analyze`),
  
  // 数据看板
  getDashboardData: () => request.get('/admin/dashboard'),
  getClassStatistics: (classId: string) => request.get(`/admin/statistics/class/${classId}`),

  // 学生管理
  getStudentList: (params?: any) => request.get('/admin/students', { params }),
  createStudent: (data: any) => request.post('/admin/students', data),
  updateStudent: (studentId: string, data: any) => request.put(`/admin/students/${studentId}`, data),
  deleteStudent: (studentId: string) => request.delete(`/admin/students/${studentId}`),
  batchCreateStudents: (students: any[]) => request.post('/admin/students/batch', students)
}

// 教师接口
export const teacherApi = {
  // 班级总览
  getClassOverview: () => request.get('/teacher/class/overview'),
  getClassStatistics: () => request.get('/teacher/class/statistics'),
  
  // 学生成绩管理
  getStudentList: (params?: any) => request.get('/teacher/students', { params }),
  getStudentDetail: (studentId: string) => request.get(`/teacher/students/${studentId}`),
  getStudentScores: (studentId: string) => request.get(`/teacher/students/${studentId}/scores`),
  
  // 导出功能
  exportClassData: () => request.get('/teacher/export/class', { responseType: 'blob' }),
  exportStudentData: (studentId: string) => request.get(`/teacher/export/student/${studentId}`, { responseType: 'blob' })
}

// 学生接口
export const studentApi = {
  // 个人成绩
  getMyScores: () => request.get('/student/scores'),
  getScoreDetail: (scoreId: string) => request.get(`/student/scores/${scoreId}`),
  
  // 历史追踪
  getScoreHistory: () => request.get('/student/scores/history'),
  getProgressAnalysis: () => request.get('/student/progress'),
  
  // 学习资源
  getLearningResources: () => request.get('/student/resources'),
  getVideoResources: (category?: string) => request.get('/student/resources/videos', { params: { category } })
}

export default request
