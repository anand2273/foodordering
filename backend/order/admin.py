from django.contrib import admin
from .models import MenuItem, Order, OrderItem, Business, CustomizationGroup, CustomizationOption

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'student_name', 'timestamp', 'ready', 'fulfilled')
    list_filter = ('ready', 'fulfilled')
    search_fields = ('student_name',)

# Register your models here.
admin.site.register(MenuItem)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem)
admin.site.register(Business)
admin.site.register(CustomizationGroup)
admin.site.register(CustomizationOption)
