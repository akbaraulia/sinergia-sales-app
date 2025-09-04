import axios from 'axios';

const erpClient = axios.create({
  baseURL: process.env.ERP_BASE_URL,
  timeout: 15000,
});

// ERPNext specific interceptors
erpClient.interceptors.request.use(
  (config) => {
    // Add ERPNext API key or session
    config.headers['X-Frappe-CSRF-Token'] = process.env.ERP_CSRF_TOKEN;
    return config;
  }
);

export default erpClient;