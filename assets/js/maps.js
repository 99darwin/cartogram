// ============================== TABLE OF CONTENTS ==============================
// 01. Weather Functions
// 02. Toolbar Animations
// 03. Farmers Market Functions
// 04. Places Functions
// ============================== TABLE OF CONTENTS ==============================

// -------- 01. WEATHER FUNCTIONS --------
function getWeather() {
    var api_key = "e1d9840d8542ded69ac25a4b5ffc320b";
    navigator.geolocation.getCurrentPosition(function (position) {
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        // Set easily referenced variables for lat and lng
        var lat = pos.lat;
        var lng = pos.lng;
        // Structure query URL
        var queryURL = 'https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lng + '&appid=' + api_key;
        // Set data object
        var data = {
            'coord': {
                'lon': lng,
                'lat': lat
            },
            'weather': []
        };
        // Begin AJAX call
        $.ajax({
            url: queryURL,
            method: 'GET',
            data: data
        }).done(function (response) {
            // Loop through JSON response object
            for (var i = 0; i < response.weather.length; i++) {
                //Weather Icon Code
                var weatherIcon = response.weather[i].icon;
                //Weather Icon Actual Image File
                var iconImage = "https://openweathermap.org/img/w/" + weatherIcon + ".png";
                // Create image div
                var img = $('<img>');
                // Add iconImage class
                img.addClass('iconImage');
                // Give img div src equal to iconImage variable
                img.attr('src', iconImage);
                //Show icon in weather icon area
                $('#weather-icon').html(img);
            }
            // Calculate current temperature in farenheit, round to nearest whole number 
            var currentTemp = Math.round(9 / 5 * (parseInt(response.main.temp) - 273) + 32);
            // Calculate wind speed in MPH, round to nearest whole number
            var windSpeed = Math.round(0.621371 * (response.wind.speed));
            // Write weather data to widget
            var weatherData = '<p><strong>Temperature: </strong>' + currentTemp + '&#8457</p><br>' +
                '<p><strong>Humidity: </strong>' + response.main.humidity + '%</p><br>' + '<p><strong>Wind Speed: </strong>' + windSpeed + ' MPH';
            $('#weatherData').html(weatherData);
        });
    });
}
getWeather();

// -------- 02. TOOLBAR ANIMATIONS --------
// Show / hide toolbars on map click
$('#map')
    // Fade toolbar out on mouse down
    .mousedown(function () {
        // I'm gonna use css transitions for this because jQuery fades have built in timeouts that we don't want
        $('.blue-ish').css('background-color', 'rgba(84, 110, 122, 0.35)');
        $("#login-options, #settings-options").fadeOut();
    });
// Fade toolbar in on mouse up - even if mouse up event isn't over map
$(document).mouseup(function () {
    $('.blue-ish').css('background-color', '');
});

// -------- 03. FARMERS MARKET FUNCTIONS --------
function getFarmers(lat, lng) {
    navigator.geolocation.getCurrentPosition(function (position) {
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        var lat = pos.lat;
        var lng = pos.lng;
        var queryURL = 'https://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat=' + lat + '&lng=' + lng;
        $.ajax({
            method: 'GET',
            contentType: 'application/json; charset=utf-8',
            url: queryURL,
            dataType: 'jsonp',
            jsonpCallback: 'detailResultsHandler'
        }).done(function (response) {
            for (var i = 0; i < 3; i++) {
                var markets = response.results[i].marketname;
                $('#farmersData').append('<p style="color: black;"><strong>Miles: </strong></p>' + markets + '<br>');
            }
        });
    });
}
getFarmers();

// -------- 04. PLACES (PINS) FUNCTIONS --------
// Display address in widget
function populateLocationWidget(pos) {
    var google_places_api_key = 'AIzaSyBYvm6i_3YLimMJdS6BAHLKWLW9g723m8o';
    // Structure URL
    var latlng = pos.lat + ',' + pos.lng;
    var queryURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
        latlng + '&result_type=street_address' + '&key=' + google_places_api_key;
    $.ajax({
        url: queryURL,
        method: 'GET'
    }).done(function (response) {
        // Loop through JSON object to retrieve desired response result
        for (var i = 0; i < response.results.length; i++) {
            // Define address using JSON object
            var address = response.results[i].formatted_address;
            // Write address to page
            $('#location').html(address);
        }
    });
}

// Map with pins
function initMapLocationPlaces() {
    navigator.geolocation.getCurrentPosition(function (position) {
        var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        populateLocationWidget(pos);
        map = new google.maps.Map(document.getElementById('map'), {
            center: pos,
            zoom: 15,
            mapTypeId: 'terrain'
        });

        infowindow = new google.maps.InfoWindow();
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch({
            location: pos,
            radius: 500,
            type: ['store', 'restaurant']
        }, callback);
    });
}

function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
    }
}

var gmarkers = [];

function createMarker(place) {
    var marker;
    var placeLoc = place.geometry.location;
    marker = new google.maps.Marker({
        map: map,
        position: placeLoc
    });

    function toggleBounce() {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    }
    marker.setMap(map);
    marker.addListener('click', toggleBounce);
    gmarkers.push(marker);
    google.maps.event.addListener(marker, 'click', function () {
        var content = "<div>";
        if (place.hasOwnProperty('name')) {
            content += '<strong>' + place.name + '</strong><br>';
        }
        if (place.hasOwnProperty('opening_hours')) {
            var openNow = place.opening_hours.open_now ? "yes" : "no";
            content += 'Open Now: ' + openNow + '<br>';
        }
        /*
        if(place.hasOwnProperty('icon')) {
            content += '<img src="' + place.icon + '"><br>';
        }
        */
        if (place.hasOwnProperty('vicinity')) {
            var typs = place.vicinity;
            content += 'Address:' + place.vicinity;
        }
        content += "</div>";
        infowindow.setContent(content);
        infowindow.open(map, this);
    });
    // marker.setMap(map);
}

function clearMarkers() {
    for (var i = 0; i < gmarkers.length; i++) {
        if (gmarkers[i].setMap) {
            gmarkers[i].setMap(null);
        }
    }
    gmarkers = [];
}
// Search submit listeners
$('#submit').on('click', function (event) {
    event.preventDefault();
    var keyword = $('#pac-input').val().trim();
    addHistory(keyword);
    searchFor(keyword);
});
$("#history-bar").on("click", "p", function(){
    searchFor( $(this).attr("data-search") );
});

// Search result function
function searchFor(keyword){
    clearMarkers();
    var pos;
    var queryURL;
    var api_key = 'AIzaSyBYvm6i_3YLimMJdS6BAHLKWLW9g723m8o';
    var apiURL = 'https://proxy-cbc.herokuapp.com/proxy';
    var radius = 5000;
    var type = ['restaurant', 'store'];
    navigator.geolocation.getCurrentPosition(function (position) {
        pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        queryURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + pos.lat + ',' + pos.lng +
            '&radius=' + radius + '&type=' + type + '&keyword=' + keyword + '&key=' + api_key;

        $.ajax({
            url: apiURL,
            data: {
                url: queryURL
            },
            dataType: 'json',
            method: 'POST'

        }).done(function (response) {
            map.setZoom(12);

            for (var i = 0; i < response.data.results.length; i++) {
                createMarker(response.data.results[i]);
            }

        });
    });
    $('#pac-input').val('');
}

// Map Marker Recenter Function
$('.mapMarker').on('click', function () {
    initMapLocationPlaces();
});

// side nav setup
$('.button-collapse').sideNav({
    menuWidth: 90,
    edge: 'left',
    closeOnClick: true, // Closes side-nav on <a> clicks
    draggable: true, // drag to open on touch screens,
});
$('.button-collapse').on("click", function(){
    $("#settings-options, #login-options, .searchbar").fadeOut();
});