import api from '@/shared/services/apiClient';
export const listStaff=()=>api.get('/staff');
export const getRoles=()=>api.get('/staff/roles');
export const createStaff=(data)=>api.post('/staff',data);
export const changeAccountStatus=(id,isActive)=>api.patch(`/staff/${id}/account-status`,{isActive});
