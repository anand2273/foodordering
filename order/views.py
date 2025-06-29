from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from .models import MenuItem

# Create your views here.
def index(request):
    return render(request, "order/index.html")

def menu(request):
    return render(request, "order/menu.html")

def menu_item(request, slug):
    return render(request, "order/menu_item.html", {
        "slug": slug
    })

def cart(request):
    return render(request, "order/cart.html")

# API HANDLERS

def api_menu(request):
    items = MenuItem.objects.all()
    data = [item.serialize() for item in items]
    return JsonResponse(data, safe=False)

def item(request, slug):
    try:
        item = MenuItem.objects.get(slug=slug)
    except MenuItem.DoesNotExist:
        return JsonResponse({"error": "item not found"}, status=400)
    
    if request.method == "GET":
        return JsonResponse(item.serialize())
    else:
        return JsonResponse({"error": "GET required"}, status=400)
