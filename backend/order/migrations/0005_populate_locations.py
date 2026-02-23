from django.db import migrations

LOCATIONS = [
    "Hall 4",
    "Hall 10/11",
    "Hall 9",
    "Hall 16",
    "Hall 12",
    "Hall 13",
    "Hall 14",
    "Tamarind",
    "North Hill",
    "Pioneer",
]

def populate_locations(apps, schema_editor):
    Location = apps.get_model('order', 'Location')
    for name in LOCATIONS:
        Location.objects.create(name=name)

class Migration(migrations.Migration):

    dependencies = [
        ('order', '0004_location_order_location'),
    ]

    operations = [
        migrations.RunPython(populate_locations),
    ]