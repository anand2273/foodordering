from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from .models import MenuItem, OrderItem, Order
from django.contrib.auth import authenticate, login, logout
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

# Merchant Side
def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        name = request.POST["name"]
        password = request.POST["password"]
        user = authenticate(request, username=name, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("orders"))
        else:
            return render(request, "order/merchant/login.html", {
                "message": "Invalid email and/or password."
            })
    else:
        return render(request, "order/merchant/login.html")
    
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))
    
def merchant_index(request):
    if request.user.is_authenticated:
        return render(request, "order/merchant/orders.html")
    else:
        return HttpResponseRedirect(reverse("login"))

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
        quantity = item.get("quantity")
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

def orders(request):
    return render(request, 'order/merchant/orders.html')

def display_orders(request):
    orders = Order.objects.all()
    data = [order.serialize() for order in orders]
    return JsonResponse(data, safe=False)

    
        
