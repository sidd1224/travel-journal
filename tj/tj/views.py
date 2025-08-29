from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib import messages
from .forms import CustomUserCreationForm, LoginForm
from .models import Journey
from django.conf import settings
from django.core.files.storage import FileSystemStorage, default_storage
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from .models import PinnedLocation
from django.http import JsonResponse
import json
from django.db import connection
from django.core.files.storage import FileSystemStorage
import os
import requests

# View for handling user login
def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('home-page')  # Replace with actual slug
            else:
                return render(request, 'login.html', {'form': form, 'error': 'Invalid credentials'})
    else:
        form = LoginForm()

    return render(request, 'login.html', {'form': form})

# View for user registration
def register_view(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Registration successful!")
            return redirect("login/") 
        else:
            messages.error(request, "There was an error in your registration.")
    else:
        form = CustomUserCreationForm()
    
    return render(request, "register.html", {"form": form})

# View for the map page
def map_view(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT uuid FROM tj_journey
            ORDER BY created_at DESC
            LIMIT 1
        """)
        result = cursor.fetchone()

    # If no journey is found, return an error
    if not result:
        return JsonResponse({'status': 'error', 'message': 'No journey found'})

    # Get the uuid from the latest journey
    uuid = result[0]

    # Pass the UUID to the template
    return render(request, 'map.html', {
        'google_maps_api_key_1': settings.GOOGLE_MAPS_API_KEY_1,
        'uuid': uuid
    })






def get_location_from_coords(latitude, longitude):
   
    api_key = "AIzaSyA-btImNVHnpfrG6ZpFT1-YxU4ekWcERNUY"  # Replace with your Google Maps API key
    url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key={api_key}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if data["results"]:
            return data["results"][0]["formatted_address"]
        else:
            return "No results found"
    else:
        return "Error in fetching location"
 # Assuming you have the utility function



def homepage(request):
    username = request.user.username  # Fetch the logged-in username
    journeys = []

    # Step 1: Fetch the user's UUIDs from tj_journey where username matches
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT uuid, title, created_at
            FROM tj_journey
            WHERE username = %s
            ORDER BY created_at DESC
        """, [username])
        rows = cursor.fetchall()

    # Step 2: Process rows to create a list of journeys
    for row in rows:
        journey_uuid, title, created_at = row
        journeys.append({
            "id": journey_uuid,
            "title": title,
            "date": created_at
        })

    # Step 3: Pass the journeys to the template
    return render(request, 'homepage.html', {'journeys': journeys})




def navigation_view(request):
    if request.user.is_authenticated:
        # Check if there's an existing journey for the user
        journey = Journey.objects.filter(username=request.user).last()
        if not journey or not journey.created_at.date() == timezone.now().date():
            journey = Journey.objects.create(username=request.user)
        return render(request, 'Navbutton.html', {'uuid': journey.uuid,'google_maps_api_key_2': settings.GOOGLE_MAPS_API_KEY_2})
    else:
        return render(request, 'Navbutton.html', {'error': 'User not logged in'})


def journal_view(request):
    return render(request, 'journal.html')


def save_view(request):
    if request.method == 'GET':
        return render(request, 'savetitle.html')

    if request.method == 'POST':
        title = request.POST.get('title')
        # Save the title (handle your database logic here)
        if title:
            # Simulate saving successfully
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'error', 'message': 'Title is required'})


@csrf_exempt


def confirm_route(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            locations = data.get('locations')  # List of pinned locations
            

            # Step 1: Fetch the latest uuid from tj_journey table
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT uuid FROM tj_journey
                    ORDER BY created_at DESC
                    LIMIT 1
                """)
                result = cursor.fetchone()

            # If no journey is found, return an error
            if not result:
                return JsonResponse({'status': 'error', 'message': 'No journey found'})

            # Get the uuid from the latest journey
            uuid = result[0]


            # Step 2: Insert the locations into tj_pinnedlocation table
            with connection.cursor() as cursor:
                for location in locations:
                    # Assuming that 'created_at' is a field in tj_pinnedlocation and it gets the current timestamp
                    cursor.execute("""
                        INSERT INTO tj_pinnedlocation (uuid, latitude, longitude, type, created_at)
                        VALUES (%s, %s, %s, %s, NOW())
                    """, [uuid, location['latitude'], location['longitude'], location['type']])

            return JsonResponse({'status': 'success'})

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os

@csrf_protect  # CSRF protection enabled for security
def save_journal(request):
    if request.method == 'POST':
        try:
            # Step 1: Extract data from POST request
            title = request.POST.get('journalTitle')
            journal_text = request.POST.get('journalText')
            images = request.FILES.getlist('images')
            
            username = request.user.username  # Assumes user is authenticated

            
        # Fetch UUIDs for the current user and get the most recent one
            with connection.cursor() as cursor:
                    cursor.execute("""
                SELECT uuid 
                FROM tj_journey 
                WHERE username = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, [username])
            result = cursor.fetchone()

        # If no journey is found for the user, return an error
            if not result:
              return JsonResponse({'status': 'error', 'message': 'No journey found for the current user'})

        # Get the uui d from the latest journey for the user
            journey_uuid = result[0]

            # Validate inputs
            if title:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT title
                        FROM tj_journey
                        WHERE uuid = %s
                        """,
                        [journey_uuid]
                    )
                    existing_title = cursor.fetchone()

                # Only update the title if it's not already set
                if not existing_title or not existing_title[0]:
                    with connection.cursor() as cursor:
                        cursor.execute(
                            """
                            UPDATE tj_journey
                            SET title = %s
                            WHERE uuid = %s
                            """,
                            [title, journey_uuid]
                        )
            if not journal_text and not images:
                return JsonResponse({'status': 'error', 'message': 'Please write something or upload images!'})

            # Step 2: Update journey title
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE tj_journey
                    SET title = %s
                    WHERE uuid = %s
                    """,
                    [title, journey_uuid]
                )

            # Step 3: Insert journal text
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO tj_journaltext (uuid, journalText, created_at, updated_at)
                    VALUES (%s, %s, NOW(), NOW())
                    """,
                    [journey_uuid, journal_text]
                )

            # Step 4: Save uploaded images
            fs = FileSystemStorage(location=settings.MEDIA_ROOT)
            for image in images:
                file_path = fs.save(image.name, image)
                image_url = fs.url(file_path)

                # Save image details in the database
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO tj_journalimage (uuid, image_path, uploaded_at)
                        VALUES (%s, %s, NOW())
                        """,
                        [journey_uuid, image_url]
                    )

            return JsonResponse({'status': 'success', 'message': 'Journal saved successfully!'})

        except Exception as e:
            # Handle unexpected errors
            return JsonResponse({'status': 'error', 'message': str(e)})

    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})


@csrf_exempt
def save_title(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            title = data.get('title')
            
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT uuid FROM tj_journey
                    ORDER BY created_at DESC
                    LIMIT 1
                """)
                result = cursor.fetchone()

            # If no journey is found, return an error
            if not result:
                return JsonResponse({'status': 'error', 'message': 'No journey found'})

            # Get the uuid from the latest journey
            uuid = result[0]
            # Update the title in the tj_journey table
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE tj_journey
                    SET title = %s
                    WHERE uuid = %s
                """, [title, uuid])

            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})

    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

from django.shortcuts import render, get_object_or_404
from django.db import connection
from uuid import UUID
from .models import PinnedLocation  # Assuming the model for PinnedLocation is defined


    # Ensure UUID is valid by checking for the latest journey if no UUID is passed
    
def view_map(request, uuid=None):
    # Get the currently logged-in username
    username = request.user.username  # Assumes user is authenticated

    if not uuid:
        # Fetch UUIDs for the current user and get the most recent one
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT uuid 
                FROM tj_journey 
                WHERE username = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, [username])
            result = cursor.fetchone()

        # If no journey is found for the user, return an error
        if not result:
            return JsonResponse({'status': 'error', 'message': 'No journey found for the current user'})

        # Get the uuid from the latest journey for the user
        uuid = result[0]

    # Raw SQL to fetch pinned locations by UUID
    query = """
        SELECT  latitude, longitude, type
        FROM tj_pinnedlocation
        WHERE uuid = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [uuid])
        pinned_locations = cursor.fetchall()

    # Pass the pinned locations to the template
    context = {
        'uuid': uuid,
        'pinned_locations': pinned_locations,
        "GOOGLE_MAPS_API_KEY": settings.GOOGLE_MAPS_API_KEY_2
    }
    return render(request, 'openmap.html', context)


def open_journal(request, uuid, location_id):
    # Fetch the pinned location details using the location_id
    location = get_object_or_404(PinnedLocation, id=location_id, map_uuid=uuid)

    # Render the journal page with location data
    context = {
        'uuid': uuid,
        'location': location,
    }
    return render(request, 'journal.html', context)

from django.shortcuts import render
from django.db import connection

def get_journal_data(request):
    try:
        username = request.user.username  # Assumes user is authenticated

        # Fetch UUIDs for the current user and get the most recent one
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT uuid 
                FROM tj_journey 
                WHERE username = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, [username])
            result = cursor.fetchone()

        # If no journey is found for the user, return an error message
        if not result:
            return render(request, 'getjournal.html', {'error': 'No journey found for the current user'})

        # Get the uuid from the latest journey
        journey_uuid = result[0]

        # Fetch journal entries
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT journalText, updated_at 
                FROM tj_journaltext 
                WHERE uuid = %s 
                ORDER BY updated_at DESC
            """, [journey_uuid])
            journal_entries = cursor.fetchall()

        # Fetch images
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT image_path, uploaded_at 
                FROM tj_journalimage 
                WHERE uuid = %s 
                ORDER BY uploaded_at DESC
            """, [journey_uuid])
            images = cursor.fetchall()

        # Prepare data for rendering
        data = {
            "journalEntries": [
                {"text": entry[0], "updated_at": entry[1]} for entry in journal_entries
            ],
            "images": [{"url": image[0], "uploaded_at": image[1]} for image in images],
        }

        # Render the getjournal.html template with data
        return render(request, 'getjournal.html', {'data': data})

    except Exception as e:
        # Render the template with an error message
        return render(request, 'getjournal.html', {'error': str(e)})
