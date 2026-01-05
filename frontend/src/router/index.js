import { createRouter, createWebHistory } from "vue-router";
import AuthView from "../views/AuthView.vue";
import DashboardView from "../views/DashboardView.vue";
import CompetitionCenterView from "../views/CompetitionCenterView.vue";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "auth", component: AuthView, meta: { guestOnly: true } },
    { path: "/dashboard", name: "dashboard", component: DashboardView, meta: { requiresAuth: true } },
    { path: "/profile", name: "profile", component: () => import("../views/ProfileView.vue"), meta: { requiresAuth: true } },
    { path: "/users/:id", name: "userProfile", component: () => import("../views/ProfileView.vue"), meta: { requiresAuth: true }, props: true },
    { path: "/competition-center", name: "competitionCenter", component: CompetitionCenterView, meta: { requiresAuth: true } },
    { path: "/competition-center/:id", name: "competitionDetail", component: () => import("../views/CompetitionDetailView.vue"), meta: { requiresAuth: true }, props: true }
  ]
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  if (auth.token && !auth.user && !auth.loading) {
    await auth.fetchProfile();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: "auth" });
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return next({ name: "dashboard" });
  }

  return next();
});

export default router;
