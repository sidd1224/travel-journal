// static/js/navigation.js

let waypoints = [];

function addWaypoint(location) {
    const waypoint = new google.maps.Marker({
        position: location,
        map: map,
        title: "Waypoint",
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    });
    waypoints.push(waypoint);
    calculateRouteWithWaypoints();
}

function removeWaypoint(waypointMarker) {
    waypointMarker.setMap(null);
    waypoints = waypoints.filter(marker => marker !== waypointMarker);
    calculateRouteWithWaypoints();
}

function calculateRouteWithWaypoints() {
    if (routeMarkers.length < 2) return;

    const waypointsArray = waypoints.map(marker => {
        return { location: marker.getPosition(), stopover: true };
    });

    const request = {
        origin: routeMarkers[0],
        destination: routeMarkers[1],
        waypoints: waypointsArray,
        travelMode: 'DRIVING',
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
        } else {
            alert("Unable to calculate route with waypoints.");
        }
    });
}
