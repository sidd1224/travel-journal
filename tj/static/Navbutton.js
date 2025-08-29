const csrf_token = "{{ csrf_token }}";
let map, markerStart, markerEnd, directionsService, directionsRenderer;
let waypoints = [];
let waypointMarkers = [];
let waypointInputEnabled = false;
let pinnedLocations=[];
let startAddress = '';
let endAddress = '';


function initMap() {
    const defaultLocation = { lat: 20.5937, lng: 78.9629 }; // Default location (India)

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 5,
        center: defaultLocation,
    });
    geocoder = new google.maps.Geocoder();

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
    });

    setupSearchBars();
    setupMapListeners();
}

window.onload = function () {
    console.log("Page loaded.");
    const startInput = document.getElementById('start-location');
    const endInput = document.getElementById('end-location');

    if (startInput && endInput) {
        console.log("Input fields found:", startInput, endInput);
    } else {
        console.error("Input fields not found.");
    }
};

function setupSearchBars() {
    const startLocationInput = document.getElementById('start-location');
    const endLocationInput = document.getElementById('end-location');
    const waypointToggleButton = document.getElementById('waypoint-toggle-btn');

    const startLocationSearchBox = new google.maps.places.SearchBox(startLocationInput);
    const endLocationSearchBox = new google.maps.places.SearchBox(endLocationInput);

    startLocationSearchBox.addListener('places_changed', function () {
        if (waypointInputEnabled) return; // Ignore in waypoint mode

        const places = startLocationSearchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        startAddress = place.formatted_address;
        console.log("Start Address Updated:", startAddress);
        setStartLocation(place.geometry.location);

        if (markerStart && markerEnd) {
            enableWaypointModeButton();
        }
    });

    endLocationSearchBox.addListener('places_changed', function () {
        const places = endLocationSearchBox.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;

        if (waypointInputEnabled) {
            addWaypoint(place.geometry.location);
            console.log("Waypoint Added:", place.geometry.location);
        } else {
            endAddress = place.formatted_address;
            console.log("End Address Updated:", endAddress);
            setEndLocation(place.geometry.location);
        }

        if (markerStart && markerEnd) {
            enableWaypointModeButton();
        }
    });
    waypointToggleButton.addEventListener('click', function () {
        waypointInputEnabled = !waypointInputEnabled;
    
        if (waypointInputEnabled) {
            enableWaypointMode();
            startLocationInput.disabled = true;
            endLocationInput.placeholder = "Click to add waypoints";
            waypointToggleButton.innerText = "Disable Waypoint Mode";
        } else {
            disableWaypointMode();
            startLocationInput.disabled = false;
            disableAllInputsAndButtonsExceptJournal();
            endLocationInput.placeholder = "Enter your destination";
            waypointToggleButton.innerText = "Enable Waypoint Mode";
    
            // Disable all input fields and buttons except "Open Journal"
            
        }
    });
}

function disableAllInputsAndButtonsExceptJournal() {
    const inputs = document.querySelectorAll('input, select, textarea');
    const buttons = document.querySelectorAll('button');
    
    inputs.forEach(input => {
        if (input.id !== 'open-journal-btn') {
            input.disabled = true;
        }
    });

    buttons.forEach(button => {
        if (button.id !== 'open-journal-btn') {
            button.disabled = true;
        }
    });

    console.log("All inputs and buttons except 'Open Journal' are now disabled.");
}

function setupMapListeners() {
    map.addListener('click', function (event) {
        // Only allow adding waypoints when waypointInputEnabled is true
        if (!waypointInputEnabled) return;

        // Add a waypoint at the clicked location
        addWaypoint(event.latLng);
    });
}


function setStartLocation(location) {
    if (markerStart) markerStart.setMap(null);
    markerStart = new google.maps.Marker({
        position: location,
        map: map,
        title: "Start Location",
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' // Red pin
    });

    // Apply long-press listener to the start marker
   
}

function setEndLocation(location) {
    if (markerEnd) markerEnd.setMap(null);
    markerEnd = new google.maps.Marker({
        position: location,
        map: map,
        title: "End Location",
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' // Red pin
    });

    // Apply long-press listener to the end marker
    
}

function addWaypoint(location) {
    
    // Add the waypoint to the waypoints array
    waypoints.push({ location, stopover: true });

    // Create the marker for the waypoint
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: "Waypoint",
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    });



    // Push the waypoint's information (latitude, longitude, type) to the pinnedLocations array
    pinnedLocations.push({
        latitude: location.lat(),
        longitude: location.lng(),
        type: "waypoint",
    });
    console.log(pinnedLocations);

    // Store the marker in the waypointMarkers array
    waypointMarkers.push(marker);
}

function removeWaypoint(marker) {
    const index = waypointMarkers.indexOf(marker);
    if (index !== -1) {
        waypointMarkers[index].setMap(null); // Remove the marker from the map
        waypointMarkers.splice(index, 1);    // Remove the marker from the array
        waypoints.splice(index, 1);         // Remove the waypoint from the waypoints array
        alert("Waypoint removed!");
    }
}





function calculateAndDisplayRoute() {
    if (!markerStart || !markerEnd) {
        alert("Please select both start and end locations.");
        return;
    }

    const request = {
        origin: markerStart.getPosition(),
        destination: markerEnd.getPosition(),
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);
            updateTurnByTurnInstructions(response);
        } else {
            alert("Could not display directions due to: " + status);
        }
    });
}

function updateTurnByTurnInstructions(route) {
    const legs = route.routes[0].legs[0];
    const steps = legs.steps;
    let currentStepIndex = 0;

    // Show turn-by-turn instructions and leg info dynamically
    document.getElementById('turn-instructions').style.display = 'block';

    function showNextTurn() {
        if (currentStepIndex >= steps.length) {
            document.getElementById("next-turn").innerText = "Arrived at Destination";
            document.getElementById("leg-info").innerText = "From: -- | To: --";
            return;
        }

        const step = steps[currentStepIndex];
        const distance = step.distance.text;
        const instruction = step.instructions;
        const from = legs.start_address;
        const to = legs.end_address;

        document.getElementById("next-turn").innerHTML = `Next Turn: ${instruction} (${distance})`;
        document.getElementById("leg-info").innerHTML = `From: ${from} | To: ${to}`;

        currentStepIndex++;
    }

    showNextTurn();
}


function enableWaypointMode() {
    const startLocationInput = document.getElementById('start-location');
    const endLocationInput = document.getElementById('end-location');

    startLocationInput.disabled = true;
    endLocationInput.disabled = false;
    endLocationInput.placeholder = "Click to add waypoints";
    console.log("Waypoint Mode Enabled.");
}

function disableWaypointMode() {
    const startLocationInput = document.getElementById('start-location');
    const endLocationInput = document.getElementById('end-location');

    startLocationInput.disabled = false;
    endLocationInput.disabled = false;
    endLocationInput.placeholder = "Enter your destination";
    console.log("Waypoint Mode Disabled.");
}

function enableWaypointModeButton() {
    const waypointToggleButton = document.getElementById('waypoint-toggle-btn');
    if (markerStart && markerEnd) {
        waypointToggleButton.disabled = false;
    }
}
function geocodeAddress(address, type) {
    return new Promise((resolve, reject) => {
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === "OK") {
                const location = results[0].geometry.location;
                const latitude = location.lat();
                const longitude = location.lng();
                
                // Add pin to the map
                new google.maps.Marker({
                    position: location,
                    map: map,
                    title: type,
                });

                // Update the pinnedLocations array
                pinnedLocations.push({ latitude, longitude, type });

                resolve({ latitude, longitude });
            } else {
                reject(`Geocode failed for ${address}: ${status}`);
            }
        });
    });
}

document.getElementById('confirm-route-btn').addEventListener('click', calculateAndDisplayRoute);
document.getElementById('confirm-route-btn').addEventListener('click', function () {
    const startAddress = document.getElementById("start-location").value;
    const endAddress = document.getElementById("end-location").value;

    // Check if waypoint mode is enabled
    if (typeof waypointInputEnabled !== "undefined" && waypointInputEnabled) {
        console.log("Waypoint mode is enabled.");

        // Ensure pinnedLocations is valid before sending data
        if (!pinnedLocations || pinnedLocations.length === 0) {
            alert("Pinned locations are invalid or empty.");
            return;  // Prevent further processing
        }

        // Example of getting the UUID and pinned locations
        const uuid = "{{ uuid }}"; // Passed from Django context

        // Send data to the backend
        fetch("/confirm-route/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": "{{ csrf_token }}",
            },
            body: JSON.stringify({
                uuid: uuid,
                locations: pinnedLocations,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                alert("Route confirmed and locations saved!");
            } else {
                console.error(data.message);
                alert("Failed to save locations.");
            }
        })
        .catch(error => console.error("Error:", error));
    } else {
        console.log("Waypoint mode is not enabled. Proceeding with geocoding start and end addresses.");

        // Clear the current pinned locations (optional)
        pinnedLocations = [];  // Clear previous locations before geocoding new ones

        // Geocode the start and end addresses, and pin them on the map
        Promise.all([
            geocodeAddress(startAddress, "start"),
            geocodeAddress(endAddress, "end"),
        ])
        .then(() => {
            console.log("Pinned Locations after geocoding:", pinnedLocations);

            // Check if geocoding results are valid
            if (!pinnedLocations || pinnedLocations.length === 0) {
                alert("Pinned locations are invalid or empty after geocoding.");
                return;
            }

            alert("Start and end addresses have been geocoded and pinned on the map.");
        })
        .catch((error) => {
            console.error("Error during geocoding:", error);
        });
    }
});

// Function to get input values

// Add event listener to a button or trigger this function when needed


