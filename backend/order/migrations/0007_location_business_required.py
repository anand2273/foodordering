from django.db import migrations, models
import django.db.models.deletion


def assign_business_to_locations(apps, schema_editor):
    Location = apps.get_model('order', 'Location')
    Business = apps.get_model('order', 'Business')
    try:
        business = Business.objects.get(slug='its-bubblin')
        Location.objects.filter(business__isnull=True).update(business=business)
    except Business.DoesNotExist:
        # Fresh database — no business exists yet. Remove orphaned locations;
        # they will be recreated when load_menu.py is run.
        Location.objects.filter(business__isnull=True).delete()


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ('order', '0006_location_business_nullable'),
    ]

    operations = [
        migrations.RunPython(assign_business_to_locations, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='location',
            name='business',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to='order.business',
            ),
        ),
    ]
