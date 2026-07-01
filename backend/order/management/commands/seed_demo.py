from decimal import Decimal

from django.core.management.base import BaseCommand

from order.models import CustomizationGroup, CustomizationOption, Location, MenuItem


class Command(BaseCommand):
    help = "Create deterministic local demo data."

    def handle(self, *args: object, **options: object) -> None:
        for display_order, name in enumerate(("Hall 4", "Hall 10/11", "North Hill"), start=1):
            Location.objects.update_or_create(
                name=name,
                defaults={"active": True, "display_order": display_order},
            )

        item, _ = MenuItem.objects.update_or_create(
            slug="classic-milk-tea",
            defaults={
                "title": "Classic Milk Tea",
                "price": Decimal("4.50"),
                "description": "Freshly brewed milk tea.",
                "active": True,
            },
        )
        group, _ = CustomizationGroup.objects.update_or_create(
            menu_item=item,
            name="Sugar",
            defaults={"required": True, "max_choices": 1},
        )
        for display_order, name in enumerate(("0%", "50%", "100%"), start=1):
            CustomizationOption.objects.update_or_create(
                group=group,
                name=name,
                defaults={"extra_cost": Decimal("0"), "display_order": display_order},
            )
        self.stdout.write(self.style.SUCCESS("Demo data is ready."))
