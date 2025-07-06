from django.db import models
from django.utils.text import slugify
from django.utils import timezone
import uuid

# Create your models here.
class Item(models.Model):
    title = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    slug = models.SlugField(max_length=100, unique=True, blank=True)

    class Meta:
        abstract = True;

    def save(self, *args, **kwargs):
    # Only generate slug if not already set
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

class MenuItem(Item):
    desc = models.TextField() 
    img = models.URLField()


    def serialize(self):
        return {
            "title": self.title,
            "price": float(self.price),
            "slug": self.slug,
            "desc": self.desc,
            "img": self.img
        }
    
class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_name = models.CharField(max_length=100)
    timestamp = models.DateTimeField(default=timezone.now)
    ready = models.BooleanField(default=False)
    fulfilled = models.BooleanField(default=False)

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
            "price": menu.price,
            "slug": menu.slug
        }
    