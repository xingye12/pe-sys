import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/DataBoard.vue')
      },
      {
        path: 'class-manage',
        name: 'ClassManage',
        component: () => import('@/views/admin/ClassManage.vue')
      },
      {
        path: 'student-manage',
        name: 'AdminStudentManage',
        component: () => import('@/views/admin/StudentManagement.vue')
      },
      {
        path: 'video-manage',
        name: 'VideoManage',
        component: () => import('@/views/admin/VideoManage.vue')
      }
    ]
  },
  {
    path: '/teacher',
    component: () => import('@/layouts/TeacherLayout.vue'),
    redirect: '/teacher/overview',
    children: [
      {
        path: 'overview',
        name: 'ClassOverview',
        component: () => import('@/views/teacher/ClassOverview.vue')
      },
      {
        path: 'students',
        name: 'TeacherStudentManage',
        component: () => import('@/views/teacher/StudentManage.vue')
      }
    ]
  },
  {
    path: '/student',
    component: () => import('@/layouts/StudentLayout.vue'),
    redirect: '/student/scores',
    children: [
      {
        path: 'scores',
        name: 'MyScores',
        component: () => import('@/views/student/MyScores.vue')
      },
      {
        path: 'resources',
        name: 'LearningResources',
        component: () => import('@/views/student/LearningResources.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.path === '/login') {
    next()
  } else if (!token) {
    next('/login')
  } else {
    next()
  }
})

export default router
