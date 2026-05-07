import axios from '@/config/axios';

export interface CampaignCreateRequest {
    sheet_id: string;
    name?: string;
    device_ids: string[];
    templates: {
        content: string;
        media_url?: string;
        media_type?: string;
        delay_override?: number
    }[];
    warm_mode?: boolean;
    scheduled_at?: string;
}

export const campaignService = {
    listCampaigns: async (skip: number = 0, limit: number = 100) => {
        try {
            const response = await axios.get(`campaign/?skip=${skip}&limit=${limit}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to list campaigns');
        }
    },

    createCampaign: async (data: CampaignCreateRequest | FormData) => {
        try {
            const isFormData = data instanceof FormData;
            const response = await axios.post(
                `campaign/create`,
                data,
                {
                    headers: {
                        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to create campaign');
        }
    },

    startCampaign: async (campaignId: string) => {
        try {
            const response = await axios.post(`campaign/${campaignId}/start`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to start campaign');
        }
    },

    pauseCampaign: async (campaignId: string) => {
        try {
            const response = await axios.post(`campaign/${campaignId}/pause`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to pause campaign');
        }
    },

    resumeCampaign: async (campaignId: string) => {
        try {
            const response = await axios.post(`campaign/${campaignId}/resume`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to resume campaign');
        }
    },

    getCampaignStatus: async (campaignId: string) => {
        try {
            const response = await axios.get(`campaign/${campaignId}/status`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to get campaign status');
        }
    },

    getCampaignLogs: async (campaignId: string) => {
        try {
            const response = await axios.get(`campaign/${campaignId}/logs`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to get campaign logs');
        }
    },
    deleteCampaign: async (campaignId: string) => {
        try {
            const response = await axios.delete(`campaign/${campaignId}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to delete campaign');
        }
    }
};
