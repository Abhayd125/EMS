import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import employeeReducer from './slices/employeeSlice';
import departmentReducer from './slices/departmentSlice';
import skillReducer from './slices/skillSlice';
import leaveReducer from './slices/leaveSlice';
import assetReducer from './slices/assetSlice';
import notificationReducer from './slices/notificationSlice';
import userReducer from './slices/userSlice';
import attendanceReducer from './slices/attendanceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer,
    departments: departmentReducer,
    skills: skillReducer,
    leaves: leaveReducer,
    assets: assetReducer,
    notifications: notificationReducer,
    users: userReducer,
    attendance: attendanceReducer
  }
});

export default store;
