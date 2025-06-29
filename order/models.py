from django.db import models
from django.utils.text import slugify

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
            "price": self.price,
            "slug": self.slug,
            "desc": self.desc,
            "img": self.img
        }

class OrderItem(models.Model):
    menuItem = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.IntegerField()

    def serialize(self):
        return {
            "title": self.title,
            "price": self.price,
            "slug": self.slug,
            "quantity": self.quantity
        }






