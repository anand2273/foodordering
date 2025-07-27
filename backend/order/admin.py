from django.contrib import admin
from .models import MenuItem, Order, OrderItem, Business, CustomizationGroup, CustomizationOption

# Register your models here.
admin.site.register(MenuItem)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Business)
admin.site.register(CustomizationGroup)
admin.site.register(CustomizationOption)
