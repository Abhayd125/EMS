import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../utils/api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/notifications');
      return data.notifications;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
      return data.notification;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await apiRequest('/notifications/mark-all-read', { method: 'PUT' });
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    loading: false,
    error: null
  },
  reducers: {
    addNotificationLocal: (state, action) => {
      state.list.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const index = state.list.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.list[index].isRead = true;
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.list = state.list.map(n => ({ ...n, isRead: true }));
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.list = state.list.filter(n => n.id !== action.payload);
      });
  }
});

export const { addNotificationLocal } = notificationSlice.actions;
export default notificationSlice.reducer;
