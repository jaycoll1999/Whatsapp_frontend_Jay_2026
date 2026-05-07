import axiosInstance from "@/config/axios";

export const getMe = async () => {
    try {
        const response = await axiosInstance.get(`auth/me`);
        return response.data;
    } catch (error: any) {
        console.error("AxiosError in getMe:");
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
            console.error("Response headers:", error.response.headers);
        } else if (error.request) {
            console.error("Request made but no response:", error.request);
        } else {
            console.error("Error setting up request:", error.message);
        }
        throw error;
    }
};

export const logout = async () => {
    // We can call specific logout endpoints if needed, 
    // but the most important part is clearing the local state.
    try {
        await axiosInstance.post(`auth/logout`);
    } catch (error) {
        // Ignore error on logout
    }
};

const authService = {
    getMe,
    logout
};

export default authService;
