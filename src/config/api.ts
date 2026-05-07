import { API_BASE_URL, WHATSAPP_ENGINE_URL } from "./constants";
export { API_BASE_URL, WHATSAPP_ENGINE_URL };

// -------------------------------------------------
// Admin API helper functions
// -------------------------------------------------
import axiosInstance from "./axios";

/** Admin login */
export const adminLogin = async (email: string, password: string) => {
  const response = await axiosInstance.post(`auth/admin-login`, {
    email,
    password,
  });
  // Interceptor in axios.ts handles token headers automatically
  return response.data;
};

/** Admin logout */
export const adminLogout = async () => {
  // Backend simply returns a message; we also clear stored token
  const response = await axiosInstance.post(`admin/logout`);
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("admin_logged_in");
  }
  return response.data;
};

/** Get list of plans (smart routing based on role) */
export const getPlans = async (category?: string) => {
  let url = `admin/plans`;
  
  if (typeof window !== "undefined") {
    const isAdmin = !!localStorage.getItem("admin_logged_in");
    const isReseller = !!localStorage.getItem("resellerToken");
    const isUser = !!localStorage.getItem("token") && !isAdmin;
    
    if (isAdmin) {
      url = `admin/plans`;
    } else if (isReseller) {
      url = `resellers/plans/available`;
    } else if (isUser) {
      url = `busi_users/plans/available`;
    }
  }

  const response = await axiosInstance.get(url, {
    params: category ? { category: category.toUpperCase() } : {}
  });
  return response.data;
};

/** Create a new plan */
export const createPlan = async (plan: {
  name: string;
  price: number;
  credits_offered: number;
  validity_days: number;
  deduction_value: number;
  plan_category: string;
}) => {
  const response = await axiosInstance.post(`admin/plans`, plan);
  return response.data;
};

/** Update an existing plan */
export const updatePlan = async (planId: string, plan: any) => {
  const response = await axiosInstance.put(`admin/plans/${planId}`, plan);
  return response.data;
};

/** Delete a plan */
export const deletePlan = async (planId: string) => {
  const response = await axiosInstance.delete(`admin/plans/${planId}`);
  return response.data;
};

/** Get admin analytics dashboard data */
export const getAdminAnalytics = async (resellerId?: string) => {
  const response = await axiosInstance.get(`admin/analytics`, {
    params: resellerId ? { reseller_id: resellerId } : {}
  });
  return response.data;
};

/** Get reseller hierarchy data */
export const getResellers = async () => {
  const response = await axiosInstance.get(`admin/resellers`);
  return response.data;
};

/** Get Admin Profile data */
export const getAdminProfile = async () => {
  const response = await axiosInstance.get(`admin/profile`);
  return response.data;
};

/** Update Admin Profile data */
export const updateAdminProfile = async (data: { name: string; phone: string; location: string; bio: string }) => {
  const response = await axiosInstance.put(`admin/profile`, data);
  return response.data;
};

/** Upload admin profile image */
export const uploadAdminProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(`admin/profile/upload-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
/** Remove admin profile image */
export const removeAdminProfileImage = async () => {
  const response = await axiosInstance.delete(`admin/profile/image`);
  return response.data;
};

/** Get global user directory */
export const getGlobalUsers = async () => {
  const response = await axiosInstance.get(`admin/users`);
  return response.data;
};

/** Get single platform user globally */
export const getGlobalUserById = async (userId: string) => {
  const response = await axiosInstance.get(`admin/users/${userId}`);
  return response.data;
};

/** Update a platform user in global directory */
export const updateGlobalUser = async (userId: string, data: any) => {
  const response = await axiosInstance.put(`admin/users/${userId}`, data);
  return response.data;
};

/** Delete a platform user from global directory */
export const deleteGlobalUser = async (userId: string) => {
  const response = await axiosInstance.delete(`admin/users/${userId}`);
  return response.data;
};

/** Get global audit logs for Admin */
export const getAdminAuditLogs = async (params: any = {}) => {
  const response = await axiosInstance.get(`admin/audit-logs`, { params });
  return response.data;
};
/** Get global orders for Admin */
export const getAdminOrders = async (params: any = {}) => {
  const response = await axiosInstance.get(`admin/orders`, { params });
  return response.data;
};

// -------------------------------------------------
// Dictionary API helper functions
// -------------------------------------------------

export const getDictionary = async (entityId: string) => {
  const response = await axiosInstance.get(`admin/dictionary`, {
    params: { entity_id: entityId }
  });
  return response.data;
};

export const addDictionaryEntry = async (data: { entity_id: string; entity_type: string; key: string; value: string }) => {
  const response = await axiosInstance.post(`admin/dictionary`, data);
  return response.data;
};

export const updateDictionaryEntry = async (id: string, data: { key?: string; value?: string }) => {
  const response = await axiosInstance.put(`admin/dictionary/${id}`, data);
  return response.data;
};

export const deleteDictionaryEntry = async (id: string) => {
  const response = await axiosInstance.delete(`admin/dictionary/${id}`);
  return response.data;
};
