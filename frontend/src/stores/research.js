import { defineStore } from "pinia";
import axios from "axios";

// 创建axios实例
const api = axios.create({
  baseURL: "http://localhost:4000/api"
});

// 动态设置token的函数
function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// 初始化时设置token
const token = localStorage.getItem("academic_light_token");
if (token) {
  setAuthToken(token);
}

export const useResearchStore = defineStore("research", {
  state: () => ({
    projects: [],
    loading: false,
    error: "",
    applicantsByProject: {},
    myApplications: {}
  }),
  actions: {
    // 更新认证token
    updateToken(token) {
      setAuthToken(token);
    },

    async fetchProjects() {
      this.loading = true;
      this.error = "";
      try {
        const { data } = await api.get("/research-projects");
        this.projects = data;
      } catch (error) {
        this.error = error.response?.data?.message || "获取科研项目失败";
      } finally {
        this.loading = false;
      }
    },
    async createProject(payload) {
      this.error = "";
      try {
        const { data } = await api.post("/research-projects", payload);
        this.projects.unshift(data.project);
        return { success: true, message: data.message, project: data.project };
      } catch (error) {
        const message = error.response?.data?.message || "发布项目失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async updateProject(id, payload) {
      this.error = "";
      try {
        const { data } = await api.put(`/research-projects/${id}`, payload);
        const idx = this.projects.findIndex((item) => item.id === id);
        if (idx !== -1) {
          this.projects[idx] = data.project;
        }
        return { success: true, message: data.message, project: data.project };
      } catch (error) {
        const message = error.response?.data?.message || "更新项目失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async deleteProject(id) {
      this.error = "";
      try {
        const { data } = await api.delete(`/research-projects/${id}`);
        this.projects = this.projects.filter((item) => item.id !== id);
        delete this.applicantsByProject[id];
        delete this.myApplications[id];
        return { success: true, message: data.message };
      } catch (error) {
        const message = error.response?.data?.message || "删除项目失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async applyToProject(id, payload) {
      this.error = "";
      try {
        const { data } = await api.post(`/research-projects/${id}/apply`, payload);
        if (data.application) {
          this.myApplications[id] = data.application;
        }
        return { success: true, message: data.message, application: data.application };
      } catch (error) {
        const message = error.response?.data?.message || "申请项目失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async fetchMyApplication(id) {
      this.error = "";
      try {
        const { data } = await api.get(`/research-projects/${id}/my-application`);
        if (data.application) {
          this.myApplications[id] = data.application;
        } else {
          delete this.myApplications[id];
        }
        return { success: true, application: data.application };
      } catch (error) {
        const message = error.response?.data?.message || "获取申请失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async updateMyApplication(id, payload) {
      this.error = "";
      try {
        const { data } = await api.put(`/research-projects/${id}/my-application`, payload);
        if (data.application) {
          this.myApplications[id] = data.application;
        }
        return { success: true, message: data.message, application: data.application };
      } catch (error) {
        const message = error.response?.data?.message || "更新申请失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async deleteMyApplication(id) {
      this.error = "";
      try {
        const { data } = await api.delete(`/research-projects/${id}/my-application`);
        delete this.myApplications[id];
        return { success: true, message: data.message };
      } catch (error) {
        const message = error.response?.data?.message || "删除申请失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async fetchApplicants(id) {
      this.error = "";
      try {
        const { data } = await api.get(`/research-projects/${id}/applicants`);
        this.applicantsByProject[id] = data;
        return { success: true, applicants: data };
      } catch (error) {
        const message = error.response?.data?.message || "获取申请者失败";
        this.error = message;
        return { success: false, message };
      }
    }
  }
});
