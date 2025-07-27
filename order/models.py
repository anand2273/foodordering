from django.db import models
from django.utils.text import slugify
from django.utils import timezone
import uuid

class Business(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    logo = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.name

class Item(models.Model):
    title = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    slug = models.SlugField(max_length=100, unique=True, blank=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

class MenuItem(Item):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="menu_items")
    desc = models.TextField(blank=True)
    img = models.URLField(blank=True)

    def serialize(self):
        return {
            "title": self.title,
            "price": float(self.price),
            "slug": self.slug,
            "desc": self.desc,
            "img": self.img,
            "customization_groups": [
                {
                    "name": group.name,
                    "required": group.required,
                    "max_choices": group.max_choices,
                    "options": [
                        {
                            "name": option.name,
                            "extra_cost": option.extra_cost
                        }
                        for option in group.options.all()
                    ]
                }
                for group in self.customization_groups.all()
            ]
        }

class CustomizationGroup(models.Model):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name="customization_groups")
    name = models.CharField(max_length=100)
    required = models.BooleanField(default=False)
    max_choices = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.menu_item.title} - {self.name}"

class CustomizationOption(models.Model):
    group = models.ForeignKey(CustomizationGroup, on_delete=models.CASCADE, related_name="options")
    name = models.CharField(max_length=100)
    extra_cost = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_name = models.CharField(max_length=100)
    timestamp = models.DateTimeField(default=timezone.now)
    ready = models.BooleanField(default=False)
    fulfilled = models.BooleanField(default=False)
    business = models.ForeignKey(Business, on_delete=models.CASCADE)

    def serialize(self):
        return {
            "id": str(self.id),
            "student_name": self.student_name,
            "timestamp": self.timestamp.isoformat(),
            "items": [item.serialize() for item in self.items.all()],
            "ready": self.ready,
            "fulfilled": self.fulfilled
        }

class OrderItem(models.Model):
    menuItem = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', null=True, blank=True)

    def serialize(self):
        menu = self.menuItem
        return {
            "quantity": self.quantity,
            "title": menu.title,
            "price": float(menu.price),
            "slug": menu.slug,
            "customizations": [
                {
                    "group": sc.option.group.name,
                    "option": sc.option.name,
                    "extra_cost": float(sc.option.extra_cost),
                } for sc in self.selected_customizations.all()
            ]
        }

    
class SelectedCustomization(models.Model):
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name="selected_customizations")
    option = models.ForeignKey(CustomizationOption, on_delete=models.CASCADE)

