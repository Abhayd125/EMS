import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../../utils/api';

// Async Thunks
export const fetchLeaveBalance = createAsyncThunk(
  'leaves/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/leaves/balance');
      return data.balance;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMyLeaves = createAsyncThunk(
  'leaves/fetchMyHistory',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/leaves/my-leaves');
      return data.leaves;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const applyForLeave = createAsyncThunk(
  'leaves/apply',
  async (leaveData, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/leaves/apply', {
        method: 'POST',
        body: JSON.stringify(leaveData)
      });
      return data.leaveRequest;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPendingApprovals = createAsyncThunk(
  'leaves/fetchPendingApprovals',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/leaves/approvals');
      return data.approvals;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitManagerReview = createAsyncThunk(
  'leaves/submitManagerReview',
  async ({ id, reviewData }, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/leaves/review/manager/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reviewData)
      });
      return { id, status: data.leaveRequest.status, updatedRequest: data.leaveRequest };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitHRReview = createAsyncThunk(
  'leaves/submitHRReview',
  async ({ id, reviewData }, { rejectWithValue }) => {
    try {
      const data = await apiRequest(`/leaves/review/hr/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reviewData)
      });
      return { id, status: data.leaveRequest.status, updatedRequest: data.leaveRequest };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchLeaveStats = createAsyncThunk(
  'leaves/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiRequest('/leaves/stats');
      return data.stats;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial State
const initialState = {
  balance: null,
  history: [],
  approvals: [],
  stats: null,
  loading: false,
  error: null,
  success: false
};

// Create Slice
const leaveSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    resetLeaveStatus: (state) => {
      state.success = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Balance
      .addCase(fetchLeaveBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload;
      })
      .addCase(fetchLeaveBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch History
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        state.history = action.payload;
      })

      // Apply
      .addCase(applyForLeave.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(applyForLeave.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.history.unshift(action.payload);
      })
      .addCase(applyForLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Approvals
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.approvals = action.payload;
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Manager Review
      .addCase(submitManagerReview.fulfilled, (state, action) => {
        state.approvals = state.approvals.filter(app => app.id !== action.payload.id);
        state.success = true;
      })
      .addCase(submitManagerReview.rejected, (state, action) => {
        state.error = action.payload;
      })

      // HR Review
      .addCase(submitHRReview.fulfilled, (state, action) => {
        state.approvals = state.approvals.filter(app => app.id !== action.payload.id);
        state.success = true;
      })
      .addCase(submitHRReview.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Stats
      .addCase(fetchLeaveStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  }
});

export const { resetLeaveStatus } = leaveSlice.actions;
export default leaveSlice.reducer;
