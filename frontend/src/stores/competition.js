import { defineStore } from "pinia";
import axios from "axios";

export const useCompetitionStore = defineStore("competitions", {
  state: () => ({
    competitions: [],
    loading: false,
    error: "",
    applicantsByCompetition: {},
    myApplications: {}
  }),
  actions: {
    async fetchCompetitions() {
      this.loading = true;
      this.error = "";
      try {
        const { data } = await axios.get("/api/competitions");
        this.competitions = data;
      } catch (error) {
        this.error = error.response?.data?.message || "获取竞赛信息失败";
      } finally {
        this.loading = false;
      }
    },
    async createCompetition(payload) {
      this.error = "";
      try {
        const { data } = await axios.post("/api/competitions", payload);
        this.competitions.push(data.competition);
        return { success: true, message: data.message };
      } catch (error) {
        const message = error.response?.data?.message || "发布失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async updateCompetition(id, payload) {
      this.error = "";
      try {
        const { data } = await axios.put(`/api/competitions/${id}`, payload);
        const idx = this.competitions.findIndex((item) => item.id === id);
        if (idx !== -1) {
          this.competitions[idx] = data.competition;
        }
        return { success: true, message: data.message, competition: data.competition };
      } catch (error) {
        const message = error.response?.data?.message || "更新失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async deleteCompetition(id) {
      this.error = "";
      try {
        const { data } = await axios.delete(`/api/competitions/${id}`);
        this.competitions = this.competitions.filter((item) => item.id !== id);
        delete this.applicantsByCompetition[id];
        return { success: true, message: data.message };
      } catch (error) {
        const message = error.response?.data?.message || "删除失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async applyToCompetition(id, payload) {
      this.error = "";
      try {
        const { data } = await axios.post(`/api/competitions/${id}/apply`, payload);
        if (data.application) {
          this.myApplications[id] = data.application;
        }
        return { success: true, message: data.message, application: data.application };
      } catch (error) {
        const message = error.response?.data?.message || "报名失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async fetchMyApplication(id) {
      this.error = "";
      try {
        const { data } = await axios.get(`/api/competitions/${id}/my-application`);
        if (data.application) {
          this.myApplications[id] = data.application;
        } else {
          delete this.myApplications[id];
        }
        return { success: true, application: data.application || null };
      } catch (error) {
        const message = error.response?.data?.message || "获取报名信息失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async updateMyApplication(id, payload) {
      this.error = "";
      try {
        const { data } = await axios.put(`/api/competitions/${id}/my-application`, payload);
        if (data.application) {
          this.myApplications[id] = data.application;
        }
        return { success: true, message: data.message, application: data.application };
      } catch (error) {
        const message = error.response?.data?.message || "更新报名失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async deleteMyApplication(id) {
      this.error = "";
      try {
        const { data } = await axios.delete(`/api/competitions/${id}/my-application`);
        delete this.myApplications[id];
        return { success: true, message: data.message };
      } catch (error) {
        const message = error.response?.data?.message || "撤回报名失败";
        this.error = message;
        return { success: false, message };
      }
    },
    async fetchApplicants(id) {
      this.error = "";
      try {
        const { data } = await axios.get(`/api/competitions/${id}/applicants`);
        this.applicantsByCompetition[id] = data;
        return { success: true, applicants: data };
      } catch (error) {
        const message = error.response?.data?.message || "获取报名信息失败";
        this.error = message;
        return { success: false, message };
      }
    }
  }
});
