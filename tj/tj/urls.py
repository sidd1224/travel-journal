"""
URL configuration for tj project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include, re_path
from tj import views
from django.conf import settings
from django.conf.urls.static import static



urlpatterns = [
     path('', views.register_view),
    path('login/', views.login_view,name='login'),
    path('home-page/', views.homepage, name='home-page'),
    path('map/', views.map_view, name='map'),
    path('navigation/', views.navigation_view, name='navigation'),
    path('journal/', views.journal_view, name='journal_view'),  # This handles the case without waypoint_id
    path('confirm-route/', views.confirm_route, name='confirm_route'),
    path('save-journal/', views.save_journal, name='save_journal'),
    path('save-title/', views.save_title, name='save-title'),
    path('title/', views.save_view, name='title'),
    path('openmap/', views.view_map, name='openmap'),
    path('get-journal-data/', views.get_journal_data, name='get_journal_data'),
    
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)