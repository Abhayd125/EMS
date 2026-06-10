import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../utils/api';

export const checkIn = createAsyncThunk(
  'attendance/checkIn',
  async (notes, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ notes })
      });
      return data.attendance;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkOut = createAsyncThunk(
  'attendance/checkOut',
  async (notes, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ notes })
      });
      return data.attendance;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTodayStatus = createAsyncThunk(
  'attendance/fetchTodayStatus',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/attendance/today', { method: 'GET' });
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMyAttendanceLogs = createAsyncThunk(
  'attendance/fetchMyLogs',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/attendance/my-logs', { method: 'GET' });
      return data.logs;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAttendanceRegistry = createAsyncThunk(
  'attendance/fetchRegistry',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/attendance/registry${queryParams ? `?${queryParams}` : ''}`;
      const data = await apiRequest(endpoint, { method: 'GET' });
      return data.logs;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  today: {
    checkedIn: false,
    checkedOut: false,
    attendance: null,
    loading: false,
    error: null
  },
  myLogs: {
    list: [],
    loading: false,
    error: null
  },
  registry: {
    list: [],
    loading: false,
    error: null
  },
  actionLoading: false,
  actionError: null,
  actionSuccess: false
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceActions: (state) => {
      state.actionError = null;
      state.actionSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Today Status
      .addCase(fetchTodayStatus.pending, (state) => {
        state.today.loading = true;
        state.today.error = null;
      })
      .addCase(fetchTodayStatus.fulfilled, (state, action) => {
        state.today.loading = false;
        state.today.checkedIn = action.payload.checkedIn;
        state.today.checkedOut = action.payload.checkedOut;
        state.today.attendance = action.payload.attendance || null;
      })
      .addCase(fetchTodayStatus.rejected, (state, action) => {
        state.today.loading = false;
        state.today.error = action.payload;
      })

      // Check In
      .addCase(checkIn.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = false;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = true;
        state.today.checkedIn = true;
        state.today.checkedOut = false;
        state.today.attendance = action.payload;
        state.myLogs.list.unshift(action.payload);
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // Check Out
      .addCase(checkOut.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = false;
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = true;
        state.today.checkedOut = true;
        state.today.attendance = action.payload;
        // Update in history list
        const index = state.myLogs.list.findIndex(log => log.id === action.payload.id);
        if (index !== -1) {
          state.myLogs.list[index] = action.payload;
        }
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })

      // Fetch My Logs
      .addCase(fetchMyAttendanceLogs.pending, (state) => {
        state.myLogs.loading = true;
        state.myLogs.error = null;
      })
      .addCase(fetchMyAttendanceLogs.fulfilled, (state, action) => {
        state.myLogs.loading = false;
        state.myLogs.list = action.payload;
      })
      .addCase(fetchMyAttendanceLogs.rejected, (state, action) => {
        state.myLogs.loading = false;
        state.myLogs.error = action.payload;
      })

      // Fetch Registry (Admin/HR)
      .addCase(fetchAttendanceRegistry.pending, (state) => {
        state.registry.loading = true;
        state.registry.error = null;
      })
      .addCase(fetchAttendanceRegistry.fulfilled, (state, action) => {
        state.registry.loading = false;
        state.registry.list = action.payload;
      })
      .addCase(fetchAttendanceRegistry.rejected, (state, action) => {
        state.registry.loading = false;
        state.registry.error = action.payload;
      });
  }
});

export const { clearAttendanceActions } = attendanceSlice.actions;
export default attendanceSlice.reducer;
