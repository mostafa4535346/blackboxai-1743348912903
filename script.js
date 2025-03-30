// Global variables
let map;
let service;
let infowindow;
let markers = [];
const whatsappNumber = '01033022988';

// Show loading spinner
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<div class="loading-spinner"></div>';
}

// Hide loading spinner
function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container.firstChild?.classList?.contains('loading-spinner')) {
        container.innerHTML = '';
    }
}

// Initialize the application
function initApp() {
    // Check if we're on the map page
    if (document.getElementById('map-container')) {
        initMapPage();
    } else {
        initSearchPage();
    }
}

// Initialize the search page
function initSearchPage() {
    // Initialize map
    const mapElement = document.getElementById('map');
    if (mapElement) {
        map = new google.maps.Map(mapElement, {
            center: { lat: 30.0444, lng: 31.2357 }, // Default to Cairo
            zoom: 12
        });
    }

    // Setup autocomplete
    const input = document.getElementById('search-input');
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);

    // Event listeners
    document.getElementById('search-btn').addEventListener('click', searchPlaces);
    document.getElementById('nearby-btn').addEventListener('click', searchNearby);
    document.getElementById('place-type').addEventListener('change', searchPlaces);
}

// Initialize the map page
function initMapPage() {
    const mapContainer = document.getElementById('map-container');
    map = new google.maps.Map(mapContainer, {
        center: { lat: 30.0444, lng: 31.2357 }, // Default to Cairo
        zoom: 12
    });

    // Setup search box
    const input = document.getElementById('map-search-input');
    const searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Listen for search results
    searchBox.addListener('places_changed', () => {
        showLoading('map-results');
        const places = searchBox.getPlaces();
        if (places.length === 0) {
            hideLoading('map-results');
            return;
        }
        
        // Clear previous markers
        clearMarkers();
        
        // For each place, add a marker and create result card
        places.forEach(place => {
            createMarker(place);
            createResultCard(place, 'map-results');
        });
        hideLoading('map-results');
    });
}

// Search for places based on input
function searchPlaces() {
    const input = document.getElementById('search-input');
    const query = input.value;
    const type = document.getElementById('place-type').value;
    const resultsContainer = document.getElementById('results');
    
    if (!query) {
        resultsContainer.innerHTML = '<p class="text-gray-500 p-4">Please enter a search term</p>';
        return;
    }

    showLoading('results');
    
    const request = {
        query: query,
        fields: ['name', 'geometry', 'formatted_address', 'place_id']
    };

    if (type) {
        request.type = type;
    }

    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, (results, status) => {
        hideLoading('results');
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            displayResults(results);
        } else {
            alert('Search failed: ' + status);
        }
    });
}

// Search for nearby places
function searchNearby() {
    if (navigator.geolocation) {
        showLoading('results');
        navigator.geolocation.getCurrentPosition(position => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            map.setCenter(pos);
            
            const request = {
                location: pos,
                radius: '1000',
                type: document.getElementById('place-type').value || 'restaurant'
            };
            
            service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, (results, status) => {
                hideLoading('results');
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    displayResults(results);
                }
            });
        }, () => {
            hideLoading('results');
            alert('Geolocation failed. Using default location.');
            searchPlaces();
        });
    } else {
        alert("Your browser doesn't support geolocation.");
    }
}

// Display search results
function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    clearMarkers();
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="text-gray-500">No results found</p>';
        return;
    }
    
    results.forEach(place => {
        createResultCard(place, 'results');
        createMarker(place);
    });
}

// Create a result card
function createResultCard(place, containerId) {
    const container = document.getElementById(containerId);
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow result-card';
    
    const name = document.createElement('h3');
    name.className = 'text-lg font-bold mb-2';
    name.textContent = place.name;
    
    const address = document.createElement('p');
    address.className = 'text-gray-600 mb-3';
    address.textContent = place.formatted_address || 'Address not available';
    
    const whatsappBtn = document.createElement('a');
    whatsappBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`I'm interested in ${place.name} at ${place.formatted_address}`)}`;
    whatsappBtn.className = 'bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 inline-flex items-center';
    whatsappBtn.innerHTML = '<i class="fab fa-whatsapp mr-2"></i> Contact via WhatsApp';
    whatsappBtn.target = '_blank';
    
    card.appendChild(name);
    card.appendChild(address);
    card.appendChild(whatsappBtn);
    container.appendChild(card);
}

// Create a map marker
function createMarker(place) {
    if (!place.geometry) return;
    
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name
    });
    
    markers.push(marker);
    
    // Add click event to center map and show info window
    marker.addListener('click', () => {
        map.setCenter(marker.getPosition());
        map.setZoom(16);
        
        if (infowindow) infowindow.close();
        infowindow = new google.maps.InfoWindow({
            content: `<strong>${place.name}</strong><br>${place.formatted_address}`
        });
        infowindow.open(map, marker);
    });
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Initialize the app when Google Maps API is loaded
window.initApp = initApp;