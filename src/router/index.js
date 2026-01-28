import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    }, {
      path: '/qttest',
      name: 'qttest',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/QtBridgeDemo.vue')
    }, {
      path: '/rostest',
      name: 'rostest',
      component: () => import('../views/RosTestView.vue')
    }
  ]
})

export default router
