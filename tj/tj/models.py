
import uuid
from django.contrib.auth.models import User
from django.db import models

class UserTable(models.Model):
    username = models.CharField(max_length=150, unique=True, primary_key=True)

    def __str__(self):
        return self.username

class Journey(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username =username = models.ForeignKey(
    User,
    to_field='username',  # Referencing the username field in the user model
    on_delete=models.CASCADE,
    db_column='username'  # Maps to the manual database column
)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tj_journey'
        managed = False  # Preven

class PinnedLocation(models.Model):
    id = models.AutoField(primary_key=True)  # Unique identifier for each location
    uuid = models.UUIDField()  # Journey UUID
    latitude = models.FloatField()  # Latitude of the pinned location
    longitude = models.FloatField()  # Longitude of the pinned location
    type = models.CharField(max_length=50)  # 'start', 'waypoint', or 'destination'
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tj_pinnedlocation'
        managed = False
        

