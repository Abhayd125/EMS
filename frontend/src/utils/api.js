const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

let accessToken = '';

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

// API Fetch wrapper that handles token attachment and token refreshing
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  // Set default headers
  const headers = { ...options.headers };
  
  // Attach bearer token if present
  if (accessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Determine if we are uploading files (FormData shouldn't have Content-Type: application/json)
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include' // Crucial for reading HTTP-only cookie
  };

  try {
    let response = await fetch(url, fetchOptions);

    // If unauthorized, check if we can refresh the token
    if (response.status === 401) {
      console.log('Unauthorized request. Attempting token refresh...');
      
      // Call refresh token endpoint
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const newAccessToken = refreshData.accessToken;
        
        // Save new token
        setAccessToken(newAccessToken);
        
        // Update authorization header and retry original request
        fetchOptions.headers['Authorization'] = `Bearer ${newAccessToken}`;
        response = await fetch(url, fetchOptions);
      } else {
        // Refresh token expired/invalid, logout user
        console.error('Refresh token invalid. Clearing session...');
        setAccessToken('');
        // We can dispatch logout or redirect in the UI
        throw new Error('SESSION_EXPIRED');
      }
    }

    // Check for success status
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    throw error;
  }
};
