from django.db import migrations, models
import django.db.models.deletion


def assign_business_to_locations(apps, schema_editor):
    Location = apps.get_model('order', 'Location')
    Business = apps.get_model('order', 'Business')
    try:
        business = Business.objects.get(slug='its-bubblin')
        Location.objects.filter(business__isnull=True).update(business=business)
    except Business.DoesNotExist:
        pass


class Migration(migrations.Migration):

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
