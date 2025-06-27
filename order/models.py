from django.db import models
from django.utils.text import slugify

# Create your models here.
class MenuItem(models.Model):
    title = models.CharField()
    desc = models.TextField()
    price = models.DecimalField(max_digits=6, decimal_places=2)
    in_cart = models.BooleanField(default=False)
    img = models.URLField()
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        # Only generate slug if not already set
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "desc": self.desc,
            "price": self.price,
            "in_cart": self.in_cart,
            "img": self.img,
            "slug": self.slug
        }


class Order(models.Model):
    items = models.ManyToManyField(MenuItem)
    id = models.PositiveIntegerField(primary_key=True, unique=True, null=False, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def serialize(self):
        return {
            "id": self.id,
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            "items": [item.serialize() for item in self.items.all()]
        }






