let map, geocoder, markerStart, markerEnd, routeMarkers = [], directionsService, directionsRenderer;

function initMap() {
    geocoder = new google.maps.Geocoder();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
    });

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 5,
        center: { lat: 20.5937, lng: 78.9629 }, // Default India if location is not available
    });

    // Get User's Location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            map.setCenter(userLocation);
            map.setZoom(12);
        }, () => {
            console.error("Location access denied or unavailable.");
        });
    }

    // Search Box for Place Search
    const input = document.getElementById('search-box');
    const searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        map.setCenter(place.geometry.location);
        placeMarker(place.geometry.location, "start");
    });

    // Recenter Button
    document.getElementById('recenter-btn').addEventListener('click', () => {
        initMap(); // Recents the map
    });

    // Navigation Button
    document.getElementById('navigate-btn').addEventListener('click', () => {
        openNavigationSidebar();
    });
}

function placeMarker(location, type) {
    if (type === "start" && !markerStart) {
        markerStart = new google.maps.Marker({
            position: location,
            map: map,
            title: "Start Location",
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        });
        routeMarkers[0] = location;
    } else if (type === "end" && !markerEnd) {
        markerEnd = new google.maps.Marker({
            position: location,
            map: map,
            title: "End Location",
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        });
        routeMarkers[1] = location;
    } else {
        alert("You can only set two locations.");
    }
}

function openNavigationSidebar() {
    const sidebar = document.getElementById("navigation-sidebar");
    sidebar.style.display = 'block';

    const startAddress = routeMarkers[0] ? routeMarkers[0].toString() : '';
    const endAddress = routeMarkers[1] ? routeMarkers[1].toString() : '';
    sidebar.innerHTML = `<h3>Navigation Steps</h3><p>Start: ${startAddress}</p><p>End: ${endAddress}</p>`;
    calculateRoute();
}

function calculateRoute() {
    if (routeMarkers.length < 2) {
        alert("Please set both start and end locations.");
        return;
    }

    const request = {
        origin: routeMarkers[0],
        destination: routeMarkers[1],
        travelMode: 'DRIVING',
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
        } else {
            alert("Route calculation failed.");
        }
    });
}

// Make sure initMap is globally available
window.initMap = initMap;
