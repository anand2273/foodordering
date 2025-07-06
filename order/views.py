from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from .models import MenuItem, OrderItem, Order
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def merchant_orders(request):
    # You'll probably want to filter orders here
    return Response({"message": f"Hello, {request.user.username}, here are your orders."})


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
        slug = item.get("slug")
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def display_orders(request):
    orders = Order.objects.all()
    data = [order.serialize() for order in orders]
    return JsonResponse(data, safe=False)

@api_view(["GET"])
@permission_classes([AllowAny]) 
def get_order_by_id(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        return JsonResponse(order.serialize())
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)
    
@api_view(["PATCH"])
def toggle_order_ready(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        order.ready = request.data.get("ready", not order.ready)
        order.save()
        return JsonResponse({"message": "Order updated", "ready": order.ready})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)

@api_view(["PATCH"])
def toggle_order_fulfilled(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        order.fulfilled = request.data.get("fulfilled", not order.ready)
        order.save()
        return JsonResponse({"message": "Order updated", "fulfilled": order.fulfilled})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)

    
        
