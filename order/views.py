from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from .models import MenuItem, OrderItem, Order
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
    
@csrf_exempt
def place_order(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."})
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON."}, status=400)
    
    print("received data:", data)
    
    student_name = data.get("student_name")
    print(student_name)
    items = data.get("items", [])

    if not student_name or not items:
        return JsonResponse({"error": "Missing name or items"}, status=400)

    order = Order.objects.create(student_name=student_name)
    for item in items:
        slug = item.get("item", {}).get("slug")
        print(slug)
        quantity = item.get("quantity")
        print(quantity)
        if not slug or not quantity:
            continue
        try: 
            menu_item = MenuItem.objects.get(slug=slug)
            OrderItem.objects.create(menuItem=menu_item, quantity=quantity, order=order)
        except MenuItem.DoesNotExist:
            continue

    return JsonResponse({
        "message":"Order placed successfully.",
        "order_id": str(order.id),
        "timestamp": order.timestamp.isoformat()
        }, status=200)

    
        
