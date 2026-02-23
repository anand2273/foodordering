from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('order', '0005_populate_locations'),
    ]

    operations = [
        migrations.AddField(
            model_name='location',
            name='business',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to='order.business',
            ),
        ),
    ]
