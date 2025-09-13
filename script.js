// Tourist Safety System JavaScript
// Simulates AI monitoring, geo-fencing, panic button, and real-time features

let currentScreen = 'dashboard';
let safetyScore = 82;
let alerts = [];
let tracking = true;
let panicMode = false;

// Map variables
let map = null;
let mapLayers = {
  tourist: null,
  police: null,
  geofence: null,
  incidents: null
};
let mapMarkers = {
  tourists: [],
  police: [],
  incidents: [],
  user: null
};
let geoFences = [];
let userLocation = null; // Will be set when location is detected

// Expose userLocation to window for HTML access
Object.defineProperty(window, 'userLocation', {
  get: () => userLocation,
  set: (value) => {
    userLocation = value;
    console.log('User location updated via window:', userLocation);
  }
});
let violationAlerts = [];
let isTrackingLocation = false;
let locationWatchId = null;
let currentMapView = 'local';
let worldTourists = [];
let locationSearchTimeout = null;

// Sample tourist data and locations
const touristData = {
  name: 'Sandra Glam',
  location: 'Shillong, Meghalaya',
  digitalId: 'TD-2024-11-001',
  safetyScore: 82,
  emergencyContacts: ['+91-98765-43210', '+91-87654-32109', 'police@meghalaya.gov.in']
};

// Load geo-fences from police dashboard backend
async function loadGeoFencesFromBackend() {
  console.log('🔄 Loading geo-fences from backend...');
  try {
    const response = await fetch('http://localhost:3001/api/geofences');
    console.log('📡 API response status:', response.status);
    
    const result = await response.json();
    console.log('📦 API response data:', result);
    
    if (result.success) {
      // Filter and validate geo-fence data
      geoFences = result.data.filter(fence => {
        // Check if fence is active and has valid coordinates
        const isValid = fence.is_active && 
                       fence.latitude && 
                       fence.longitude && 
                       !isNaN(parseFloat(fence.latitude)) && 
                       !isNaN(parseFloat(fence.longitude));
        
        if (!isValid) {
          console.warn(`⚠️ Skipping invalid geo-fence:`, fence);
        }
        
        return isValid;
      });
      
      console.log('✅ Loaded valid geo-fences from backend:', geoFences.length);
      console.log('📋 Valid geo-fences:', geoFences.map(f => `${f.name} (${f.latitude}, ${f.longitude})`));
      
      // Only update display if map is ready, otherwise wait
      if (map) {
        updateGeoFenceDisplay();
      } else {
        console.log('⏳ Map not ready yet, geo-fences will be displayed when map loads');
      }
    } else {
      console.error('❌ API returned error:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed to load geo-fences:', error);
  }
}

// Manual refresh geo-fences function
window.refreshGeoFences = async function() {
  console.log('Manually refreshing geo-fences...');
  await loadGeoFencesFromBackend();
  addAlert('system', '🔄 Geo-fences refreshed from police dashboard', 'info');
};

// Set map reference from HTML initialization
window.setMapReference = function(mapInstance) {
  console.log('🔗 Syncing map reference from HTML');
  map = mapInstance;
  
  // Create layer groups if they don't exist
  if (!mapLayers.tourist) {
    mapLayers.tourist = L.layerGroup().addTo(map);
  }
  if (!mapLayers.geofence) {
    mapLayers.geofence = L.layerGroup().addTo(map);
  }
  if (!mapLayers.police) {
    mapLayers.police = L.layerGroup().addTo(map);
  }
  if (!mapLayers.incidents) {
    mapLayers.incidents = L.layerGroup();
  }
  
  // Load geo-fences from backend
  loadGeoFencesFromBackend();
};

// Manually request current location
window.requestCurrentLocation = function() {
  if (!navigator.geolocation) {
    showNotification('⚠️ Location services not supported on this device', 'warning');
    return;
  }
  
  console.log('Manually requesting location...');
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = [position.coords.latitude, position.coords.longitude];
      console.log('✅ Manual location detected:', userLocation);
      updateUserLocationOnMap();
      checkGeoFenceViolations();
      sendLocationUpdateToBackend();
      showNotification('📍 Your location has been updated!', 'success');
    },
    (error) => {
      console.error('Manual location error:', error);
      handleLocationError(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    }
  );
};

// Start monitoring user location for geo-fence violations
function startGeoFenceMonitoring() {
  if (!navigator.geolocation) {
    console.log('Geolocation not supported');
    showNotification('⚠️ Location services not supported on this device', 'warning');
    return;
  }
  
  isTrackingLocation = true;
  console.log('Starting location monitoring...');
  
  // Get initial location first
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation = [position.coords.latitude, position.coords.longitude];
      console.log('✅ Initial location detected:', userLocation);
      updateUserLocationOnMap();
      checkGeoFenceViolations();
      showNotification('📍 Location detected successfully!', 'success');
      
      // Start continuous monitoring
      locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = [position.coords.latitude, position.coords.longitude];
          const distance = calculateDistance(userLocation, newLocation);
          
          // Only update if location changed significantly (more than 10 meters)
          if (distance > 10) {
            userLocation = newLocation;
            console.log('📍 Location updated:', userLocation);
            updateUserLocationOnMap();
            checkGeoFenceViolations();
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
          handleLocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );
    },
    (error) => {
      console.error('Initial location error:', error);
      handleLocationError(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    }
  );
}

// Handle location errors
function handleLocationError(error) {
  let message = 'Unable to get your location. ';
  
  switch(error.code) {
    case error.PERMISSION_DENIED:
      message += 'Please allow location access in your browser settings.';
      showNotification('🚫 Location access denied. Please allow location permissions.', 'error');
      break;
    case error.POSITION_UNAVAILABLE:
      message += 'Location information is unavailable.';
      showNotification('⚠️ Location unavailable. Using default location.', 'warning');
      break;
    case error.TIMEOUT:
      message += 'Location request timed out.';
      showNotification('⏰ Location request timed out. Please try again.', 'warning');
      break;
    default:
      message += 'An unknown error occurred.';
      showNotification('❌ Location error occurred.', 'error');
      break;
  }
  
  console.log('Using default location:', userLocation);
  updateUserLocationOnMap();
}

// Update user location marker on map
window.updateUserLocationOnMap = function updateUserLocationOnMap() {
  if (!map || !mapLayers.tourist) {
    console.log('Map not ready yet, location will be updated when map is initialized');
    return;
  }
  
  if (!userLocation) {
    console.log('User location not available yet');
    return;
  }
  
  // Remove existing user marker
  if (mapMarkers.user) {
    mapLayers.tourist.removeLayer(mapMarkers.user);
  }
  
  // Add new user marker
  const userIcon = L.divIcon({
    className: 'user-marker',
    html: '<div style="background:#667eea;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
  
  mapMarkers.user = L.marker(userLocation, {icon: userIcon})
    .addTo(mapLayers.tourist)
    .bindPopup(`<b>Your Location</b><br>Lat: ${userLocation[0].toFixed(6)}<br>Lng: ${userLocation[1].toFixed(6)}<br>Safety Score: ${safetyScore}`);
  
  // Update location display on dashboard
  updateLocationDisplay();
  
  // Update safety score based on new location
  updateSafetyScore();
  
  // Send location update to backend for police dashboard
  sendLocationUpdateToBackend();
}

// Update location display on dashboard
window.updateLocationDisplay = function updateLocationDisplay() {
  // Update the location text on dashboard if it exists
  const locationElement = document.getElementById('userLocation');
  if (locationElement) {
    // Get location name from coordinates (simplified)
    const locationName = getLocationNameFromCoords(userLocation[0], userLocation[1]);
    locationElement.textContent = locationName;
  }
  
  // Call the HTML function to update user state and main page location
  if (typeof updateUserState === 'function') {
    updateUserState(userLocation[0], userLocation[1]);
  }
  
  console.log('📍 Current user location:', userLocation);
}

// Get location name from coordinates (simplified)
function getLocationNameFromCoords(lat, lng) {
  // This is a simplified version - in a real app you'd use reverse geocoding
  if (lat >= 25.5 && lat <= 25.6 && lng >= 91.8 && lng <= 91.9) {
    return 'Shillong, Meghalaya';
  } else if (lat >= 19.0 && lat <= 19.2 && lng >= 72.8 && lng <= 73.0) {
    return 'Mumbai, Maharashtra';
  } else if (lat >= 28.5 && lat <= 28.7 && lng >= 77.0 && lng <= 77.3) {
    return 'New Delhi';
  } else if (lat >= 12.9 && lat <= 13.1 && lng >= 77.5 && lng <= 77.7) {
    return 'Bangalore, Karnataka';
  } else {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// Send location update to backend
window.sendLocationUpdateToBackend = async function sendLocationUpdateToBackend() {
  try {
    const response = await fetch('http://localhost:3001/api/users/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: userLocation[0],
        longitude: userLocation[1],
        timestamp: new Date().toISOString(),
        safety_score: safetyScore
      })
    });
    
    if (response.ok) {
      console.log('Location updated in backend');
    }
  } catch (error) {
    console.error('Failed to update location in backend:', error);
  }
}

// Check if user is inside any restricted geo-fence
function checkGeoFenceViolations() {
  geoFences.forEach(fence => {
    const distance = calculateDistance(
      userLocation[0], userLocation[1],
      parseFloat(fence.latitude), parseFloat(fence.longitude)
    );
    
    if (distance <= fence.radius) {
      // User is inside restricted area
      showViolationAlert(fence);
    }
  });
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Show violation alert to user
function showViolationAlert(fence) {
  const alertId = `violation-${fence.id}`;
  
  // Check if alert already shown
  if (violationAlerts.includes(alertId)) {
    return;
  }
  
  violationAlerts.push(alertId);
  
  // Create alert notification
  const alert = {
    id: alertId,
    type: 'restricted_area',
    title: '🚫 Restricted Area Alert',
    message: `You have entered a restricted area: ${fence.name}. ${fence.description || 'Please leave this area immediately.'}`,
    timestamp: new Date(),
    fence: fence
  };
  
  // Add to alerts array
  alerts.unshift(alert);
  
  // Show notification
  showNotification(alert);
  
  // Update alerts display
  updateAlertsDisplay();
  
  // Auto-remove from violationAlerts after 30 seconds
  setTimeout(() => {
    const index = violationAlerts.indexOf(alertId);
    if (index > -1) {
      violationAlerts.splice(index, 1);
    }
  }, 30000);
}

// Show notification to user
function showNotification(alert) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'violation-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${alert.title && alert.title.includes('🚫') ? '🚫' : '⚠️'}</div>
      <div class="notification-text">
        <div class="notification-title">${alert.title}</div>
        <div class="notification-message">${alert.message}</div>
      </div>
      <button class="notification-close" onclick="closeNotification(this)">×</button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 350px;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// Close notification
function closeNotification(button) {
  button.parentNode.parentNode.remove();
}

// Update geo-fence display on map
function updateGeoFenceDisplay() {
  console.log('🔄 updateGeoFenceDisplay called');
  console.log('Map exists:', !!map);
  console.log('Geo-fences count:', geoFences.length);
  
  if (!map) {
    console.log('❌ Map not initialized yet, skipping geo-fence display');
    return;
  }
  
  if (!mapLayers.geofence) {
    console.log('🔧 Geo-fence layer not created yet, creating it');
    mapLayers.geofence = L.layerGroup().addTo(map);
  }
  
  // Clear existing geo-fence markers
  mapLayers.geofence.clearLayers();
  
  console.log('📍 Displaying', geoFences.length, 'geo-fences on map');
  
  // Add new geo-fences
  geoFences.forEach((fence, index) => {
    console.log(`🔴 Adding geo-fence ${index + 1}:`, fence.name, 'at', fence.latitude, fence.longitude);
    
    // Validate coordinates
    const lat = parseFloat(fence.latitude);
    const lng = parseFloat(fence.longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      console.error(`❌ Invalid coordinates for geo-fence "${fence.name}": lat=${lat}, lng=${lng}`);
      return; // Skip this geo-fence
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error(`❌ Coordinates out of range for geo-fence "${fence.name}": lat=${lat}, lng=${lng}`);
      return; // Skip this geo-fence
    }
    
    const circle = L.circle([lat, lng], {
      radius: fence.radius || 100,
      color: '#ff4444',
      fillColor: '#ff4444',
      fillOpacity: 0.2,
      weight: 2
    }).bindPopup(`
      <strong>${fence.name || 'Unnamed Geo-fence'}</strong><br/>
      ${fence.description || 'Restricted Area'}<br/>
      State: ${fence.state || 'N/A'}<br/>
      City: ${fence.city || 'N/A'}<br/>
      Radius: ${fence.radius || 100}m
    `);
    
    mapLayers.geofence.addLayer(circle);
    console.log(`✅ Added geo-fence: ${fence.name} at [${lat}, ${lng}]`);
  });
  
  // Fit map to show all geo-fences if there are any
  if (geoFences.length > 0) {
    const group = new L.featureGroup(mapLayers.geofence.getLayers());
    if (group.getBounds().isValid()) {
      console.log('🗺️ Fitting map to show all geo-fences');
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }
  
  console.log('✅ Geo-fence display completed');
}

// Sample itinerary/trip plan for today
const todayItinerary = [
  { time: '08:00', place: 'Ward\'s Lake', status: 'current' },
  { time: '12:00', place: 'Elephant Falls', status: 'next' },
  { time: '15:30', place: 'Don Bosco Museum', status: 'planned' },
  { time: '18:00', place: 'Police Bazaar', status: 'planned' },
  { time: '20:30', place: 'Hotel Return', status: 'planned' }
];

// Geo-fence zones with risk levels
const geoFenceZones = [
  { name: 'Ward\'s Lake Area', risk: 'low', message: 'Safe tourist zone' },
  { name: 'Elephant Falls Trail', risk: 'medium', message: 'Caution: Slippery paths' },
  { name: 'Restricted Military Area', risk: 'high', message: 'Entry prohibited' },
  { name: 'Late Night Commercial Areas', risk: 'medium', message: 'Enhanced patrol recommended' }
];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  setupEventListeners();
  startAIMonitoring();
  updateUI();
  
  // Initialize map first (regardless of current screen) with a small delay
  console.log('🗺️ Scheduling map initialization...');
  setTimeout(() => {
    console.log('🗺️ Starting map initialization...');
    initializeMap();
  }, 2000); // 2 second delay to ensure DOM is ready
  
  // Start location monitoring after map is initialized
  console.log('📍 Starting location monitoring...');
  setTimeout(() => {
  startGeoFenceMonitoring();
  }, 1500); // Start location monitoring after map
});

function initializeApp() {
  try {
    populateItinerary();
  } catch (error) {
    console.log('Itinerary population skipped:', error.message);
  }
  updateTime();
  setInterval(updateTime, 30000); // Update time every 30 seconds
  setInterval(aiHealthCheck, 45000); // AI monitoring every 45 seconds
  
  // Initialize location inputs
  initializeLocationInputs();
}

function setupEventListeners() {
  // Note: Most buttons use onclick attributes in HTML, so we don't need to add event listeners here
  // Only add listeners for elements that don't have onclick attributes
  
  console.log('✅ Event listeners setup completed');
  
  // Add swipe/touch gestures for mobile (simplified)
  let startX = 0;
  document.addEventListener('touchstart', function(e) {
    startX = e.touches[0].clientX;
  });
  
  document.addEventListener('touchend', function(e) {
    let endX = e.changedTouches[0].clientX;
    let diff = startX - endX;
    
    if (Math.abs(diff) > 100) { // Minimum swipe distance
      if (diff > 0) {
        // Swipe left - next screen
        navigateScreens('next');
      } else {
        // Swipe right - previous screen
        navigateScreens('prev');
      }
    }
  });
}

function switchScreen(screenName) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show target screen
  const targetScreen = document.getElementById(screenName + 'Screen');
  if (targetScreen) {
    targetScreen.classList.add('active');
    currentScreen = screenName;
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(nav => {
      nav.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`[data-target="${screenName}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
    }
    
    // Screen-specific actions
    if (screenName === 'alerts') {
      populateAlerts();
    } else if (screenName === 'profile') {
      updateProfileData();
    } else if (screenName === 'location' || screenName === 'map') {
      console.log('📍 Switching to location screen, initializing map...');
      
      // Always try to initialize map when switching to location screen
      setTimeout(() => {
        console.log('🗺️ Attempting map initialization...');
        if (!map) {
          console.log('Creating new map instance');
          initializeMap();
        } else {
          console.log('Map exists, refreshing...');
          map.invalidateSize();
          if (userLocation) {
            map.setView(userLocation, 13);
          }
        }
      }, 300);
      
      // Backup initialization attempt
      setTimeout(() => {
        if (!map) {
          console.log('🔄 Backup map initialization attempt');
          initializeMap();
        }
      }, 1000);
    }
  }
}

function navigateScreens(direction) {
  const screens = ['dashboard', 'map', 'alerts', 'profile'];
  const currentIndex = screens.indexOf(currentScreen);
  
  let nextIndex;
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % screens.length;
  } else {
    nextIndex = (currentIndex - 1 + screens.length) % screens.length;
  }
  
  switchScreen(screens[nextIndex]);
}

function populateItinerary() {
  const itineraryBar = document.getElementById('itineraryBar');
  if (!itineraryBar) {
    console.log('Itinerary bar not found, skipping population');
    return;
  }
  itineraryBar.innerHTML = '';
  
  todayItinerary.forEach(item => {
    const itineraryItem = document.createElement('div');
    itineraryItem.className = `calendar-day ${item.status === 'current' ? 'active' : ''}`;
    itineraryItem.innerHTML = `
      <span class="day-name">${item.time}</span>
      <span class="day-number" style="font-size:10px">${item.place.split(' ')[0]}</span>
    `;
    itineraryBar.appendChild(itineraryItem);
  });
}

function updateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  document.querySelector('.time').textContent = timeStr.slice(0, 5); // Remove seconds
}

// AI Monitoring System
function startAIMonitoring() {
  console.log('🤖 AI Tourist Safety Monitoring started');
  addAlert('system', 'AI Monitoring activated for your safety', 'info');
  
  // Simulate AI behavior patterns detection
  setTimeout(() => {
    const scenarios = [
      { type: 'geofence', message: 'Entering medium-risk zone: Elephant Falls area' },
      { type: 'weather', message: 'Weather alert: Light rain expected at 14:00' },
      { type: 'crowd', message: 'High tourist density detected at Ward\'s Lake' },
      { type: 'safety', message: 'Police patrol unit nearby - enhanced safety' }
    ];
    
    // Pick random scenario every few minutes for demo
    setInterval(() => {
      if (!panicMode && Math.random() > 0.7) { // 30% chance every cycle
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        addAlert(scenario.type, scenario.message, 'warning');
        updateSafetyScore();
      }
    }, 60000); // Every minute for demo
  }, 10000); // Start scenarios after 10 seconds
}

function aiHealthCheck() {
  // Simulate AI health monitoring
  const riskFactors = Math.floor(Math.random() * 4);
  let newScore = safetyScore + (Math.random() > 0.5 ? 1 : -1) * riskFactors;
  newScore = Math.max(20, Math.min(100, newScore)); // Keep between 20-100
  
  if (Math.abs(newScore - safetyScore) >= 5) {
    safetyScore = newScore;
    updateSafetyScore();
    
    if (newScore < 60) {
      addAlert('ai', `Safety score dropped to ${newScore}. Enhanced monitoring activated.`, 'danger');
    } else if (newScore > 85) {
      updateSafetySummary('AI monitoring active • Very safe environment');
    }
  }
}

function updateSafetyScore() {
  // Calculate safety score based on location and other factors
  calculateLocationBasedSafetyScore();
  
  const safetyScoreElement = document.getElementById('safetyScore');
  if (safetyScoreElement) {
    safetyScoreElement.textContent = safetyScore;
  }
  
  let summary = '';
  let cardStyle = '';
  
  if (safetyScore >= 80) {
    summary = 'AI monitoring active • Low risk';
    cardStyle = 'background: linear-gradient(135deg,#0ea5e9 0%,#60a5fa 100%);';
  } else if (safetyScore >= 60) {
    summary = 'AI monitoring active • Medium risk';
    cardStyle = 'background: linear-gradient(135deg,#f59e0b 0%,#f97316 100%);';
  } else {
    summary = 'AI monitoring active • High risk detected';
    cardStyle = 'background: linear-gradient(135deg,#ef4444 0%,#dc2626 100%);';
  }
  
  updateSafetySummary(summary);
  // Update challenge card style
  const challengeCard = document.querySelector('.challenge-card');
  if (challengeCard) {
    challengeCard.setAttribute('style', cardStyle);
  }
}

// Calculate safety score based on location and other factors
function calculateLocationBasedSafetyScore() {
  let baseScore = 80; // Base safety score
  
  if (!userLocation) {
    console.log('User location not available, using default safety score');
    safetyScore = baseScore;
    return;
  }
  
  // Check if user is in a restricted area (geo-fence)
  const inRestrictedArea = checkIfInRestrictedArea(userLocation[0], userLocation[1]);
  if (inRestrictedArea) {
    baseScore -= 30; // Major penalty for being in restricted area
  }
  
  // Location-based safety scores for major Indian cities
  const lat = userLocation[0];
  const lng = userLocation[1];
  
  // Mumbai - generally safe but crowded
  if (lat >= 19.0 && lat <= 19.2 && lng >= 72.8 && lng <= 73.0) {
    baseScore += 5; // Mumbai bonus
  }
  // Delhi - moderate safety
  else if (lat >= 28.5 && lat <= 28.7 && lng >= 77.0 && lng <= 77.3) {
    baseScore += 0; // Delhi neutral
  }
  // Bangalore - generally safe
  else if (lat >= 12.9 && lat <= 13.1 && lng >= 77.5 && lng <= 77.7) {
    baseScore += 10; // Bangalore bonus
  }
  // Shillong - generally safe
  else if (lat >= 25.5 && lat <= 25.6 && lng >= 91.8 && lng <= 91.9) {
    baseScore += 15; // Shillong bonus
  }
  // Remote areas - lower safety
  else {
    baseScore -= 10; // Remote area penalty
  }
  
  // Time-based factors (simulate day/night safety)
  const hour = new Date().getHours();
  if (hour >= 22 || hour <= 5) {
    baseScore -= 15; // Night time penalty
  } else if (hour >= 6 && hour <= 8) {
    baseScore += 5; // Morning bonus
  }
  
  // Random variation for realism (±5 points)
  baseScore += (Math.random() - 0.5) * 10;
  
  // Keep score between 20-100
  safetyScore = Math.max(20, Math.min(100, Math.round(baseScore)));
  
  console.log('Safety score calculated:', safetyScore, 'for location:', lat, lng);
}

// Check if user is in a restricted area
function checkIfInRestrictedArea(lat, lng) {
  for (const fence of geoFences) {
    const distance = calculateDistance([lat, lng], [fence.latitude, fence.longitude]);
    if (distance <= fence.radius) {
      console.log('User in restricted area:', fence.name);
      return true;
    }
  }
  return false;
}

function updateSafetySummary(text) {
  const safetySummaryElement = document.getElementById('safetySummary');
  if (safetySummaryElement) {
    safetySummaryElement.textContent = text;
  }
}

// Panic and Emergency Functions
function triggerPanic() {
  panicMode = !panicMode;
  const panicBtn = document.getElementById('panicBtn');
  
  if (panicMode) {
    panicBtn.innerHTML = '<i class="fas fa-times"></i>';
    panicBtn.style.backgroundColor = '#dc2626';
    panicBtn.style.animation = 'pulse 1s infinite';
    
    // Trigger emergency protocol
    addAlert('emergency', '🚨 PANIC BUTTON ACTIVATED - Emergency services notified', 'danger');
    addAlert('emergency', '📍 Live location shared with authorities and emergency contacts', 'danger');
    addAlert('emergency', '📞 Auto-calling nearest police station...', 'danger');
    
    // Simulate emergency response
    setTimeout(() => {
      addAlert('response', '🚔 Police unit dispatched to your location (ETA: 8 minutes)', 'info');
    }, 3000);
    
    setTimeout(() => {
      addAlert('response', '📱 Emergency contact John notified via SMS', 'info');
    }, 5000);
    
    // Auto-update E-FIR
    setTimeout(() => {
      document.getElementById('efirStatus').textContent = 'Filed';
      addAlert('system', '📋 E-FIR automatically generated (Reference: FIR2024001123)', 'info');
    }, 8000);
    
    console.log('🚨 EMERGENCY: Panic button activated');
    
  } else {
    panicBtn.innerHTML = '<i class="fas fa-siren-on"></i>';
    panicBtn.style.backgroundColor = '';
    panicBtn.style.animation = '';
    
    addAlert('system', 'Panic mode deactivated', 'info');
    console.log('✅ Panic mode deactivated');
  }
}

function shareLiveLocation() {
  addAlert('location', '📍 Live location shared with family and authorities', 'info');
  updateLastLocation();
  
  // Simulate location sharing
  const locations = ['Ward\'s Lake', 'Elephant Falls', 'Police Bazaar', 'Don Bosco Museum'];
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  
  setTimeout(() => {
    addAlert('location', `📍 Current location: ${randomLocation} (Lat: 25.5788, Long: 91.8933)`, 'info');
  }, 2000);
}

function callPolice() {
  addAlert('emergency', '📞 Calling Meghalaya Police Emergency: 100', 'info');
  
  // Simulate call connection
  setTimeout(() => {
    addAlert('emergency', '✅ Connected to Police Control Room', 'info');
    addAlert('emergency', '🗣️ "Tourist Sandra at Ward\'s Lake requires assistance"', 'info');
  }, 3000);
}

// Alert System
function addAlert(type, message, severity = 'info') {
  const alert = {
    id: Date.now() + Math.random(),
    type: type,
    message: message,
    severity: severity,
    timestamp: new Date().toLocaleTimeString(),
    read: false
  };
  
  alerts.unshift(alert); // Add to beginning
  
  // Limit to 20 alerts
  if (alerts.length > 20) {
    alerts = alerts.slice(0, 20);
  }
  
  updateActiveAlertsCount();
  
  // Show notification if not on alerts screen
  if (currentScreen !== 'alerts') {
    showNotificationBadge();
  }
}

function populateAlerts() {
  const alertsList = document.getElementById('alertsList');
  alertsList.innerHTML = '';
  
  if (alerts.length === 0) {
    alertsList.innerHTML = `
      <div class="menu-item">
        <div class="menu-icon"><i class="fas fa-check-circle" style="color: #10b981;"></i></div>
        <div class="menu-content">
          <div class="menu-title">No alerts</div>
          <div class="menu-subtitle">All systems normal</div>
        </div>
      </div>
    `;
    return;
  }
  
  alerts.forEach(alert => {
    const alertElement = document.createElement('div');
    alertElement.className = `menu-item ${alert.read ? '' : 'unread-alert'}`;
    
    let iconClass = 'fas fa-info-circle';
    let iconColor = '#6b7280';
    
    switch (alert.severity) {
      case 'danger':
        iconClass = 'fas fa-exclamation-triangle';
        iconColor = '#ef4444';
        break;
      case 'warning':
        iconClass = 'fas fa-exclamation-circle';
        iconColor = '#f59e0b';
        break;
      case 'info':
        iconClass = 'fas fa-info-circle';
        iconColor = '#3b82f6';
        break;
    }
    
    alertElement.innerHTML = `
      <div class="menu-icon">
        <i class="${iconClass}" style="color: ${iconColor};"></i>
      </div>
      <div class="menu-content">
        <div class="menu-title">${alert.message}</div>
        <div class="menu-subtitle">${alert.timestamp} • ${alert.type}</div>
      </div>
    `;
    
    alertElement.addEventListener('click', () => {
      alert.read = true;
      alertElement.classList.remove('unread-alert');
      updateActiveAlertsCount();
    });
    
    alertsList.appendChild(alertElement);
  });
}

function clearAlerts() {
  alerts = [];
  updateActiveAlertsCount();
  populateAlerts();
  addAlert('system', 'All alerts cleared', 'info');
}

function updateActiveAlertsCount() {
  const unreadCount = alerts.filter(alert => !alert.read).length;
  const activeAlertsElement = document.getElementById('activeAlerts');
  if (activeAlertsElement) {
    activeAlertsElement.textContent = unreadCount;
  }
}

function showNotificationBadge() {
  const bellIcon = document.querySelector('.search-btn i');
  bellIcon.style.animation = 'pulse 2s infinite';
  
  setTimeout(() => {
    bellIcon.style.animation = '';
  }, 5000);
}

function openAlerts() {
  switchScreen('alerts');
}

// Geo-fencing Functions
function toggleTracking() {
  tracking = !tracking;
  const geoStatus = document.getElementById('geoStatus');
  const trackingBtn = document.querySelector('.settings-btn i');
  
  if (tracking) {
    geoStatus.textContent = 'Geo-fencing: enabled • No alerts';
    trackingBtn.className = 'fas fa-satellite-dish';
    addAlert('system', 'Real-time tracking enabled', 'info');
  } else {
    geoStatus.textContent = 'Geo-fencing: disabled';
    trackingBtn.className = 'fas fa-satellite-dish-off';
    addAlert('system', 'Real-time tracking disabled', 'warning');
  }
}

// Profile and Data Updates
function updateProfileData() {
  // Update any dynamic profile data
  const lastLocationEl = document.getElementById('lastLocation');
  updateLastLocation();
}

function updateLastLocation() {
  const locations = ['Ward\'s Lake', 'Elephant Falls', 'Police Bazaar', 'Hotel Pine Borough'];
  const randomLocation = locations[Math.floor(Math.random() * locations.length)];
  
  setTimeout(() => {
    document.getElementById('lastLocation').textContent = randomLocation;
  }, 1000);
}

function updateUI() {
  // Update any UI elements that need regular refresh
  updateActiveAlertsCount();
  updateTime();
}

// Utility Functions
function showToast(message, type = 'info') {
  // Simple toast notification (you could enhance this)
  console.log(`${type.toUpperCase()}: ${message}`);
}

// Language switching (placeholder)
function switchLanguage(lang) {
  console.log(`Language switched to: ${lang}`);
  addAlert('system', `Language changed to ${lang}`, 'info');
}

// Add CSS for unread alerts
const style = document.createElement('style');
style.textContent = `
  .unread-alert {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%) !important;
    border-left: 4px solid #3b82f6 !important;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
  }
`;
document.head.appendChild(style);

// Map Functions
function initializeMap() {
  console.log('🗺️ initializeMap called');
  if (map) {
    console.log('✅ Map already initialized, skipping');
    return; // Already initialized
  }
  
  // Show loading
  const mapContainer = document.getElementById('map');
  const loadingSpinner = document.getElementById('mapLoading');
  
  console.log('📦 Map container found:', !!mapContainer);
  console.log('🔄 Loading spinner found:', !!loadingSpinner);
  console.log('🌍 Leaflet available:', typeof L !== 'undefined');
  
  if (!mapContainer) {
    console.log('❌ Map container not found');
    return;
  }
  
  if (typeof L === 'undefined') {
    console.log('❌ Leaflet library not loaded');
    addAlert('system', 'Map library not loaded. Please refresh the page.', 'error');
    return;
  }
  
  // Check if map container is visible
  const containerRect = mapContainer.getBoundingClientRect();
  console.log('📐 Map container dimensions:', containerRect);
  
  if (containerRect.width === 0 || containerRect.height === 0) {
    console.log('❌ Map container has no dimensions, waiting...');
    setTimeout(() => initializeMap(), 1000);
    return;
  }
  
  if (loadingSpinner) loadingSpinner.style.display = 'block';
  
  try {
    // Clear any existing map instances
    if (window._leaflet_map) {
      console.log('🧹 Clearing existing map');
      window._leaflet_map.remove();
      window._leaflet_map = null;
    }
    
    if (map) {
      console.log('🧹 Clearing existing map instance');
      map.remove();
      map = null;
    }
    
    // Clear map container content to prevent reuse issues
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.innerHTML = '';
      console.log('🧹 Cleared map container content');
    }
    
    // Initialize Leaflet map centered on India (default location)
    const defaultLocation = userLocation || [20.5937, 78.9629]; // India center
    console.log('📍 Initializing map with location:', defaultLocation);
    console.log('🗺️ Creating Leaflet map instance...');
    
    map = L.map('map').setView(defaultLocation, 5);
    window._leaflet_map = map; // Also store globally for compatibility
    
    console.log('✅ Map object created:', !!map);
    console.log('✅ Map container element:', map.getContainer());
    console.log('✅ Map initialized successfully');
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Create layer groups
    mapLayers.tourist = L.layerGroup().addTo(map);
    mapLayers.police = L.layerGroup().addTo(map);
    mapLayers.geofence = L.layerGroup().addTo(map);
    mapLayers.incidents = L.layerGroup();
    
    // Add sample data
    addSampleMapData();
    
    // Update user location on map if already detected
    updateUserLocationOnMap();
    
    // Display geo-fences if they were loaded before map initialization
    if (geoFences.length > 0) {
      console.log('📍 Displaying previously loaded geo-fences');
      updateGeoFenceDisplay();
    } else {
      // Load and display geo-fences from backend
      loadGeoFencesFromBackend();
    }
    
    // Hide loading
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    
    addAlert('system', '🗺️ Interactive map loaded with real-time tracking', 'info');
    
  } catch (error) {
    console.error('Map initialization error:', error);
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    
    // Show error message in map container
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #6b7280; text-align: center; padding: 20px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; color: #ef4444;"></i>
          <h3>Map Loading Failed</h3>
          <p>Unable to load the interactive map. Please check your internet connection and try refreshing the page.</p>
          <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
            <i class="fas fa-refresh" style="margin-right: 8px;"></i>Refresh Page
          </button>
        </div>
      `;
    }
    
    addAlert('system', 'Map loading failed. Please check connection and refresh the page.', 'error');
  }
}

function addSampleMapData() {
  // Only add user location marker if location is available
  if (userLocation) {
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: '<div style="background:#667eea;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);"></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    
    mapMarkers.user = L.marker(userLocation, {icon: userIcon})
      .addTo(mapLayers.tourist)
      .bindPopup(`<b>Your Location</b><br>Sandra Glam<br>Safety Score: ${safetyScore}`);
  }
  
  // Add other tourists
  const touristLocations = [
    {lat: 25.5790, lng: 91.8930, name: 'Tourist A', score: 85},
    {lat: 25.5785, lng: 91.8940, name: 'Tourist B', score: 78},
    {lat: 25.5795, lng: 91.8925, name: 'Tourist C', score: 92}
  ];
  
  touristLocations.forEach(tourist => {
    const icon = L.divIcon({
      className: 'tourist-marker',
      html: '<div style="background:#10b981;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.2);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    const marker = L.marker([tourist.lat, tourist.lng], {icon: icon})
      .addTo(mapLayers.tourist)
      .bindPopup(`<b>${tourist.name}</b><br>Safety Score: ${tourist.score}`);
    
    mapMarkers.tourists.push(marker);
  });
  
  // Add police stations
  const policeStations = [
    {lat: 25.5800, lng: 91.8920, name: 'Shillong Police Station', unit: 'PS-001'},
    {lat: 25.5770, lng: 91.8950, name: 'Laitumkhrah Police Station', unit: 'PS-002'}
  ];
  
  policeStations.forEach(station => {
    const icon = L.divIcon({
      className: 'police-marker',
      html: '<div style="background:#dc2626;width:18px;height:18px;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(220,38,38,0.4);"><i class="fas fa-shield-alt" style="color:white;font-size:8px;margin-top:1px;margin-left:1px;"></i></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    
    const marker = L.marker([station.lat, station.lng], {icon: icon})
      .addTo(mapLayers.police)
      .bindPopup(`<b>${station.name}</b><br>Unit: ${station.unit}<br>Status: Active`);
    
    mapMarkers.police.push(marker);
  });
  
  // Add geo-fence zones
  const geoFenceData = [
    {
      center: [25.5788, 91.8933],
      radius: 500,
      name: 'Ward\'s Lake Safe Zone',
      risk: 'low',
      color: '#10b981',
      fillColor: '#10b981'
    },
    {
      center: [25.5820, 91.8960],
      radius: 300,
      name: 'Elephant Falls Caution Zone',
      risk: 'medium',
      color: '#f59e0b',
      fillColor: '#f59e0b'
    },
    {
      center: [25.5750, 91.8900],
      radius: 200,
      name: 'Restricted Military Area',
      risk: 'high',
      color: '#ef4444',
      fillColor: '#ef4444'
    }
  ];
  
  geoFenceData.forEach(zone => {
    const circle = L.circle(zone.center, {
      color: zone.color,
      fillColor: zone.fillColor,
      fillOpacity: 0.2,
      radius: zone.radius,
      weight: 2
    }).addTo(mapLayers.geofence)
      .bindPopup(`<b>${zone.name}</b><br>Risk Level: ${zone.risk}<br>Radius: ${zone.radius}m`);
    
    geoFences.push({circle: circle, data: zone});
  });
  
  // Add sample incidents
  const incidents = [
    {lat: 25.5805, lng: 91.8945, type: 'Minor Injury', time: '2 hours ago', status: 'resolved'},
    {lat: 25.5765, lng: 91.8915, type: 'Lost Tourist', time: '30 minutes ago', status: 'investigating'}
  ];
  
  incidents.forEach(incident => {
    const color = incident.status === 'resolved' ? '#6b7280' : '#f59e0b';
    const icon = L.divIcon({
      className: 'incident-marker',
      html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.3);"><i class="fas fa-exclamation" style="color:white;font-size:6px;margin-top:1px;margin-left:1px;"></i></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    
    const marker = L.marker([incident.lat, incident.lng], {icon: icon})
      .addTo(mapLayers.incidents)
      .bindPopup(`<b>${incident.type}</b><br>Time: ${incident.time}<br>Status: ${incident.status}`);
    
    mapMarkers.incidents.push(marker);
  });
  
  updateMapLastUpdate();
}

function toggleLayer(layerName) {
  const button = document.querySelector(`[onclick="toggleLayer('${layerName}')"]`);
  
  if (!map || !mapLayers[layerName] || !button) return;
  
  if (button.classList.contains('active')) {
    map.removeLayer(mapLayers[layerName]);
    button.classList.remove('active');
  } else {
    map.addLayer(mapLayers[layerName]);
    button.classList.add('active');
  }
}

function centerOnUser() {
  if (!map || !mapMarkers.user) return;
  
  map.setView(userLocation, 15);
  mapMarkers.user.openPopup();
  addAlert('location', '📍 Map centered on your current location', 'info');
}

function updateMapData() {
  if (!map) return;
  
  // Simulate real-time updates
  const rand = Math.random() * 0.002;
  userLocation[0] += (Math.random() - 0.5) * rand;
  userLocation[1] += (Math.random() - 0.5) * rand;
  
  if (mapMarkers.user) {
    mapMarkers.user.setLatLng(userLocation);
  }
  
  updateMapLastUpdate();
}

function updateMapLastUpdate() {
  const element = document.getElementById('mapLastUpdate');
  if (element) {
    element.textContent = 'just now';
  }
}

// Start real-time map updates
setInterval(() => {
  if (map && (currentScreen === 'map' || currentScreen === 'location')) {
    updateMapData();
  }
}, 30000); // Update every 30 seconds

// Location Setting Functions
function initializeLocationInputs() {
  // Set current coordinates in inputs
  const latInput = document.getElementById('latInput');
  const lngInput = document.getElementById('lngInput');
  
  if (latInput && lngInput) {
    latInput.value = userLocation[0].toFixed(6);
    lngInput.value = userLocation[1].toFixed(6);
  }
  
  // Add search input listener
  const searchInput = document.getElementById('locationSearch');
  if (searchInput) {
    searchInput.addEventListener('input', handleLocationSearch);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchLocation();
      }
    });
  }
}

function handleLocationSearch() {
  const query = document.getElementById('locationSearch').value.trim();
  
  if (locationSearchTimeout) {
    clearTimeout(locationSearchTimeout);
  }
  
  if (query.length < 3) return;
  
  locationSearchTimeout = setTimeout(() => {
    // Show suggestions (simplified)
    console.log(`Searching for: ${query}`);
  }, 300);
}

async function searchLocation() {
  const query = document.getElementById('locationSearch').value.trim();
  
  if (!query) {
    addAlert('location', 'Please enter a location to search', 'warning');
    return;
  }
  
  try {
    // Show loading
    const searchBtn = document.querySelector('button[onclick="searchLocation()"]');
    const originalHtml = searchBtn.innerHTML;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    searchBtn.disabled = true;
    
    // Use Nominatim (OpenStreetMap) geocoding API
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const results = await response.json();
    
    if (results && results.length > 0) {
      const location = results[0];
      const lat = parseFloat(location.lat);
      const lng = parseFloat(location.lon);
      
      // Update location
      updateUserLocation(lat, lng, location.display_name);
      addAlert('location', `Location set to: ${location.display_name}`, 'success');
      
      // Clear search input
      document.getElementById('locationSearch').value = '';
    } else {
      addAlert('location', 'Location not found. Please try a different search.', 'warning');
    }
    
    // Restore button
    searchBtn.innerHTML = originalHtml;
    searchBtn.disabled = false;
    
  } catch (error) {
    console.error('Location search error:', error);
    addAlert('location', 'Search failed. Please check your connection.', 'error');
    
    // Restore button
    const searchBtn = document.querySelector('button[onclick="searchLocation()"]');
    searchBtn.innerHTML = '<i class="fas fa-search"></i>';
    searchBtn.disabled = false;
  }
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    addAlert('location', 'Geolocation is not supported by this browser', 'warning');
    return;
  }
  
  const gpsBtn = document.querySelector('button[onclick="getCurrentLocation()"]');
  const originalHtml = gpsBtn.innerHTML;
  gpsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  gpsBtn.disabled = true;
  
  navigator.geolocation.getCurrentPosition(
    function(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      updateUserLocation(lat, lng, 'Your GPS Location');
      addAlert('location', `GPS location acquired: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
      
      // Restore button
      gpsBtn.innerHTML = originalHtml;
      gpsBtn.disabled = false;
    },
    function(error) {
      let errorMessage = 'Failed to get location';
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location permissions.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }
      
      addAlert('location', errorMessage, 'warning');
      
      // Restore button
      gpsBtn.innerHTML = originalHtml;
      gpsBtn.disabled = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function setManualLocation() {
  const latInput = document.getElementById('latInput');
  const lngInput = document.getElementById('lngInput');
  
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);
  
  if (isNaN(lat) || isNaN(lng)) {
    addAlert('location', 'Please enter valid latitude and longitude values', 'warning');
    return;
  }
  
  if (lat < -90 || lat > 90) {
    addAlert('location', 'Latitude must be between -90 and 90', 'warning');
    return;
  }
  
  if (lng < -180 || lng > 180) {
    addAlert('location', 'Longitude must be between -180 and 180', 'warning');
    return;
  }
  
  updateUserLocation(lat, lng, 'Manual Location');
  addAlert('location', `Location set manually: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'success');
}

function updateUserLocation(lat, lng, displayName = null) {
  userLocation = [lat, lng];
  
  // Update input fields
  const latInput = document.getElementById('latInput');
  const lngInput = document.getElementById('lngInput');
  
  if (latInput) latInput.value = lat.toFixed(6);
  if (lngInput) lngInput.value = lng.toFixed(6);
  
  // Update map if initialized
  if (map && mapMarkers.user) {
    mapMarkers.user.setLatLng([lat, lng]);
    
    if (displayName) {
      mapMarkers.user.setPopupContent(`<b>${displayName}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}<br>Safety Score: ${safetyScore}`);
    }
    
    // Center map on new location
    map.setView([lat, lng], currentMapView === 'world' ? 8 : 13);
  }
  
  // Update location display in UI
  updateLocationDisplay(lat, lng, displayName);
}

async function updateLocationDisplay(lat, lng, displayName = null) {
  if (!displayName) {
    try {
      // Reverse geocoding to get location name
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      if (data && data.display_name) {
        displayName = data.display_name.split(',').slice(0, 3).join(', ');
      } else {
        displayName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      displayName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
  
  // Update header location
  const locationElement = document.getElementById('userLocation');
  if (locationElement) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    locationElement.textContent = `${displayName} • ${dateStr}`;
  }
}

// Map View Functions
function switchMapView(viewType) {
  if (!map) return;
  
  currentMapView = viewType;
  
  // Update button states
  document.querySelectorAll('.map-view-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[onclick="switchMapView('${viewType}')"]`).classList.add('active');
  
  if (viewType === 'world') {
    // Switch to world view
    map.setView([20, 0], 2); // World view centered
    addWorldTouristData();
    addAlert('map', '🌍 Switched to world view - showing global tourists', 'info');
  } else {
    // Switch to local view
    map.setView(userLocation, 13);
    clearWorldTouristData();
    addAlert('map', '🗺️ Switched to local view - showing nearby data', 'info');
  }
}

function addWorldTouristData() {
  // Add tourists from different countries
  const worldTouristData = [
    {lat: 40.7128, lng: -74.0060, name: 'Tourist NYC', country: 'USA', score: 88},
    {lat: 51.5074, lng: -0.1278, name: 'Tourist London', country: 'UK', score: 92},
    {lat: 35.6762, lng: 139.6503, name: 'Tourist Tokyo', country: 'Japan', score: 85},
    {lat: -33.8688, lng: 151.2093, name: 'Tourist Sydney', country: 'Australia', score: 90},
    {lat: 48.8566, lng: 2.3522, name: 'Tourist Paris', country: 'France', score: 86},
    {lat: 55.7558, lng: 37.6173, name: 'Tourist Moscow', country: 'Russia', score: 78},
    {lat: 39.9042, lng: 116.4074, name: 'Tourist Beijing', country: 'China', score: 82},
    {lat: -23.5505, lng: -46.6333, name: 'Tourist São Paulo', country: 'Brazil', score: 79},
    {lat: 19.4326, lng: -99.1332, name: 'Tourist Mexico City', country: 'Mexico', score: 75},
    {lat: 30.0444, lng: 31.2357, name: 'Tourist Cairo', country: 'Egypt', score: 73}
  ];
  
  worldTouristData.forEach(tourist => {
    const icon = L.divIcon({
      className: 'world-tourist-marker',
      html: `<div style="background:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    
    const marker = L.marker([tourist.lat, tourist.lng], {icon: icon})
      .addTo(mapLayers.tourist)
      .bindPopup(`<b>${tourist.name}</b><br>Country: ${tourist.country}<br>Safety Score: ${tourist.score}`);
    
    worldTourists.push(marker);
  });
}

function clearWorldTouristData() {
  worldTourists.forEach(marker => {
    mapLayers.tourist.removeLayer(marker);
  });
  worldTourists = [];
}

// Popular Location Selection
function setPopularLocation(lat, lng, name) {
  updateUserLocation(lat, lng, name);
  
  // Switch to appropriate view based on location
  if (currentMapView === 'world') {
    map.setView([lat, lng], 8);
  } else {
    switchMapView('local');
  }
  
  addAlert('location', `📍 Location set to ${name}`, 'success');
}

// Export functions for global access
window.switchScreen = switchScreen;
window.triggerPanic = triggerPanic;
window.shareLiveLocation = shareLiveLocation;
window.callPolice = callPolice;
window.openAlerts = openAlerts;
window.clearAlerts = clearAlerts;
window.toggleTracking = toggleTracking;
window.toggleLayer = toggleLayer;
window.centerOnUser = centerOnUser;
window.searchLocation = searchLocation;
window.getCurrentLocation = getCurrentLocation;
window.setManualLocation = setManualLocation;
window.switchMapView = switchMapView;
window.setPopularLocation = setPopularLocation;

// Guide contact functions
window.callGuide = function(phoneNumber, guideName) {
  console.log(`📞 Calling guide: ${guideName} at ${phoneNumber}`);
  
  // Create a phone call link
  const callLink = `tel:${phoneNumber}`;
  
  // Show confirmation dialog
  const confirmCall = confirm(`Call ${guideName} at ${phoneNumber}?`);
  
  if (confirmCall) {
    // Open phone dialer
    window.location.href = callLink;
    
    // Add to recent calls
    addAlert('guide', `📞 Calling ${guideName}...`, 'info');
  }
};

window.messageGuide = function(guideName) {
  console.log(`💬 Messaging guide: ${guideName}`);
  
  // Show messaging options
  const messageOptions = [
    `Hello ${guideName}! I'm a tourist visiting your area and would like to book a tour.`,
    `Hi ${guideName}, I'm interested in your guide services. What are your rates?`,
    `Hello! I'm looking for a local guide in your area. Are you available today?`,
    `Hi ${guideName}, I'd like to know more about your tours and availability.`
  ];
  
  const randomMessage = messageOptions[Math.floor(Math.random() * messageOptions.length)];
  
  // For demo purposes, show the message in an alert
  alert(`Message for ${guideName}:\n\n"${randomMessage}"\n\n(In a real app, this would open WhatsApp/SMS)`);
  
  // Add to recent messages
  addAlert('guide', `💬 Messaged ${guideName}`, 'info');
};

// Profile Management Functions
function editProfile() {
  console.log('📝 Opening profile editor...');
  
  // Get current user data from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // Create profile editing modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3><i class="fas fa-user-edit" style="margin-right: 10px; color: #3b82f6;"></i>Edit Profile</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <form id="profileForm" onsubmit="saveProfile(event)">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="profileName" class="form-input" value="${currentUser.name || ''}" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="profileEmail" class="form-input" value="${currentUser.email || ''}" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="profilePhone" class="form-input" value="${currentUser.phone || ''}" placeholder="+91-XXXXXXXXXX">
          </div>
          
          <div class="form-group">
            <label class="form-label">Nationality</label>
            <select id="profileNationality" class="form-select">
              <option value="Indian" ${currentUser.nationality === 'Indian' ? 'selected' : ''}>Indian</option>
              <option value="American" ${currentUser.nationality === 'American' ? 'selected' : ''}>American</option>
              <option value="British" ${currentUser.nationality === 'British' ? 'selected' : ''}>British</option>
              <option value="Canadian" ${currentUser.nationality === 'Canadian' ? 'selected' : ''}>Canadian</option>
              <option value="Australian" ${currentUser.nationality === 'Australian' ? 'selected' : ''}>Australian</option>
              <option value="German" ${currentUser.nationality === 'German' ? 'selected' : ''}>German</option>
              <option value="French" ${currentUser.nationality === 'French' ? 'selected' : ''}>French</option>
              <option value="Japanese" ${currentUser.nationality === 'Japanese' ? 'selected' : ''}>Japanese</option>
              <option value="Chinese" ${currentUser.nationality === 'Chinese' ? 'selected' : ''}>Chinese</option>
              <option value="Other" ${currentUser.nationality === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Emergency Contact Name</label>
            <input type="text" id="emergencyName" class="form-input" value="${currentUser.emergencyContact || ''}" placeholder="Emergency contact person">
          </div>
          
          <div class="form-group">
            <label class="form-label">Emergency Contact Phone</label>
            <input type="tel" id="emergencyPhone" class="form-input" value="${currentUser.emergencyPhone || ''}" placeholder="+91-XXXXXXXXXX">
          </div>
          
          <div class="form-group">
            <label class="form-label">Current Location</label>
            <input type="text" id="currentLocation" class="form-input" value="${currentUser.location || ''}" placeholder="Your current city">
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Profile</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function saveProfile(event) {
  event.preventDefault();
  console.log('💾 Saving profile...');
  
  // Get form data
  const formData = {
    name: document.getElementById('profileName').value,
    email: document.getElementById('profileEmail').value,
    phone: document.getElementById('profilePhone').value,
    nationality: document.getElementById('profileNationality').value,
    emergencyContact: document.getElementById('emergencyName').value,
    emergencyPhone: document.getElementById('emergencyPhone').value,
    location: document.getElementById('currentLocation').value,
    lastUpdated: new Date().toISOString()
  };
  
  // Save to localStorage
  localStorage.setItem('currentUser', JSON.stringify(formData));
  
  // Update UI elements
  updateProfileUI(formData);
  
  // Close modal
  const modal = event.target.closest('.modal');
  modal.remove();
  
  // Show success message
  addAlert('profile', '✅ Profile updated successfully!', 'success');
  
  console.log('✅ Profile saved:', formData);
}

function updateProfileUI(userData) {
  // Update greeting
  const greeting = document.getElementById('userGreeting');
  if (greeting) {
    greeting.textContent = `Namaste! Welcome, ${userData.name}`;
  }
  
  // Update location
  const location = document.getElementById('userLocation');
  if (location) {
    location.textContent = userData.location || 'Location not set';
  }
  
  console.log('🔄 Profile UI updated');
}

// Document Management Functions
function manageDocuments() {
  console.log('📄 Opening document manager...');
  
  // Get current documents from localStorage
  const documents = JSON.parse(localStorage.getItem('userDocuments') || '[]');
  
  // Create document management modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px; max-height: 80vh;">
      <div class="modal-header">
        <h3><i class="fas fa-id-card" style="margin-right: 10px; color: #10b981;"></i>Travel Documents</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
        <div class="document-actions" style="margin-bottom: 20px;">
          <button class="btn btn-primary" onclick="closeCurrentModalAndAddDocument()">
            <i class="fas fa-plus" style="margin-right: 8px;"></i>Add Document
          </button>
        </div>
        
        <div id="documentsList" class="documents-container">
          ${documents.length > 0 ? documents.map(doc => `
            <div class="document-item" data-doc-id="${doc.id}">
              <div class="document-icon">
                <i class="fas ${getDocumentIcon(doc.type)}"></i>
              </div>
              <div class="document-info">
                <h4>${doc.name}</h4>
                <p>Type: ${doc.type}</p>
                <p>Number: ${doc.number}</p>
                <p>Expires: ${doc.expiryDate}</p>
                <span class="document-status ${doc.status}">${doc.status}</span>
              </div>
              <div class="document-actions">
                <button class="action-btn edit-btn" onclick="editDocument('${doc.id}')">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteDocument('${doc.id}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('') : `
            <div class="empty-state">
              <i class="fas fa-file-alt" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;"></i>
              <h3>No Documents Added</h3>
              <p>Add your travel documents to keep them organized and accessible.</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function getDocumentIcon(type) {
  const icons = {
    'Passport': 'fa-passport',
    'Visa': 'fa-stamp',
    'ID Card': 'fa-id-card',
    'Driver License': 'fa-id-badge',
    'Travel Insurance': 'fa-shield-alt',
    'Flight Ticket': 'fa-plane',
    'Hotel Booking': 'fa-bed',
    'Other': 'fa-file-alt'
  };
  return icons[type] || 'fa-file-alt';
}

function closeCurrentModalAndAddDocument() {
  // Close the current documents modal
  const currentModal = document.querySelector('.modal');
  if (currentModal) {
    currentModal.remove();
  }
  // Open the add document modal
  addNewDocument();
}

function addNewDocument() {
  console.log('📄 Adding new document...');
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3><i class="fas fa-plus" style="margin-right: 10px; color: #10b981;"></i>Add Document</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <form id="documentForm" onsubmit="saveDocument(event)">
          <div class="form-group">
            <label class="form-label">Document Type</label>
            <select id="docType" class="form-select" required>
              <option value="">Select Document Type</option>
              <option value="Passport">Passport</option>
              <option value="Visa">Visa</option>
              <option value="ID Card">ID Card</option>
              <option value="Driver License">Driver License</option>
              <option value="Travel Insurance">Travel Insurance</option>
              <option value="Flight Ticket">Flight Ticket</option>
              <option value="Hotel Booking">Hotel Booking</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Document Name</label>
            <input type="text" id="docName" class="form-input" placeholder="e.g., Indian Passport" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Document Number</label>
            <input type="text" id="docNumber" class="form-input" placeholder="Document number or reference" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Issue Date</label>
            <input type="date" id="issueDate" class="form-input" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Expiry Date</label>
            <input type="date" id="expiryDate" class="form-input" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Issuing Authority</label>
            <input type="text" id="issuingAuthority" class="form-input" placeholder="e.g., Government of India">
          </div>
          
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea id="docNotes" class="form-textarea" placeholder="Additional notes about this document"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Document</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function saveDocument(event) {
  event.preventDefault();
  console.log('💾 Saving document...');
  
  const documentData = {
    id: Date.now().toString(),
    type: document.getElementById('docType').value,
    name: document.getElementById('docName').value,
    number: document.getElementById('docNumber').value,
    issueDate: document.getElementById('issueDate').value,
    expiryDate: document.getElementById('expiryDate').value,
    issuingAuthority: document.getElementById('issuingAuthority').value,
    notes: document.getElementById('docNotes').value,
    status: getDocumentStatus(document.getElementById('expiryDate').value),
    addedDate: new Date().toISOString()
  };
  
  // Get existing documents
  const documents = JSON.parse(localStorage.getItem('userDocuments') || '[]');
  documents.push(documentData);
  
  // Save to localStorage
  localStorage.setItem('userDocuments', JSON.stringify(documents));
  
  // Close modal and refresh documents list
  const modal = event.target.closest('.modal');
  modal.remove();
  
  // Show success message
  addAlert('documents', '✅ Document added successfully!', 'success');
  
  console.log('✅ Document saved:', documentData);
  
  // Refresh the documents list by reopening the manage documents modal
  setTimeout(() => {
    manageDocuments();
  }, 100);
}

function getDocumentStatus(expiryDate) {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) {
    return 'expired';
  } else if (daysUntilExpiry <= 30) {
    return 'expiring';
  } else {
    return 'valid';
  }
}

function editDocument(docId) {
  console.log('📝 Editing document:', docId);
  // Implementation for editing documents
  alert('Document editing feature coming soon!');
}

function deleteDocument(docId) {
  console.log('🗑️ Deleting document:', docId);
  
  const confirmDelete = confirm('Are you sure you want to delete this document?');
  if (confirmDelete) {
    // Get existing documents
    const documents = JSON.parse(localStorage.getItem('userDocuments') || '[]');
    const updatedDocuments = documents.filter(doc => doc.id !== docId);
    
    // Save updated documents
    localStorage.setItem('userDocuments', JSON.stringify(updatedDocuments));
    
    // Show success message
    addAlert('documents', '✅ Document deleted successfully!', 'success');
    
    console.log('✅ Document deleted');
    
    // Refresh the documents list
    setTimeout(() => {
      manageDocuments();
    }, 100);
  }
}

// Expose map initialization function globally
window.initializeMapScript = initializeMap;

// Force map initialization function
window.forceInitializeMap = function() {
  console.log('🔄 Force initializing map...');
  
  // Clear existing map instances completely
  if (map) {
    try {
      map.remove();
    } catch (e) {
      console.log('Error removing map:', e);
    }
    map = null;
  }
  
  if (window._leaflet_map) {
    try {
      window._leaflet_map.remove();
    } catch (e) {
      console.log('Error removing _leaflet_map:', e);
    }
    window._leaflet_map = null;
  }
  
  // Clear map container completely
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.innerHTML = '';
    console.log('🧹 Cleared map container for force initialization');
  }
  
  // Reset map layers
  mapLayers = {
    tourist: null,
    police: null,
    geofence: null,
    incidents: null
  };
  
  // Clear any existing markers
  mapMarkers = {
    tourists: [],
    police: [],
    incidents: [],
    user: null
  };
  
  // Force initialization after clearing everything
  setTimeout(() => {
    console.log('🔄 Starting fresh map initialization...');
    initializeMap();
  }, 500);
};

console.log('🌟 Bon Voyage System loaded successfully!');
