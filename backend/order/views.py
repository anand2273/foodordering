from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.http import JsonResponse, Http404
import json
from django.views.decorators.csrf import csrf_exempt
from .models import MenuItem, OrderItem, Order, Business, CustomizationOption, SelectedCustomization
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

def get_business_or_404(slug):
    try:
        return Business.objects.get(slug=slug)
    except:
        raise Http404("Business not found")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def merchant_orders(request):
    # You'll probably want to filter orders here
    return Response({"message": f"Hello, {request.user.username}, here are your orders."})


# API HANDLERS

# To fetch the entire menu
def api_menu(request, business_slug):
    biz = get_business_or_404(business_slug)
    items = MenuItem.objects.filter(business=biz)
    data = [item.serialize() for item in items]
    return JsonResponse(data, safe=False)

# To fetch data pertaining to a particular item
def item(request, slug, business_slug):
    biz = get_business_or_404(business_slug)
    try:
        item = MenuItem.objects.filter(business=biz).get(slug=slug)
    except MenuItem.DoesNotExist:
        return JsonResponse({"error": "item not found"}, status=400)
    
    if request.method == "GET":
        return JsonResponse(item.serialize())
    else:
        return JsonResponse({"error": "GET required"}, status=400)
    
@csrf_exempt
def place_order(request, business_slug):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."})
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON."}, status=400)
    
    student_name = data.get("student_name")
    items = data.get("items", [])

    if not student_name or not items:
        return JsonResponse({"error": "Missing name or items"}, status=400)

    business = get_business_or_404(business_slug)
    
    order = Order.objects.create(student_name=student_name, business=business)

    for item in items:
        slug = item.get("slug")
        quantity = item.get("quantity")
        selected = item.get("selectedOptions", {})

        try:
            menu_item = MenuItem.objects.get(slug=slug, business=business)
            order_item = OrderItem.objects.create(menuItem=menu_item, quantity=quantity, order=order)

            for group_name, options in selected.items():
                for option in options:
                    try:
                        opt_obj = CustomizationOption.objects.get(
                            name=option["name"],
                            group__menu_item=menu_item,
                            group__name=group_name
                        )
                        SelectedCustomization.objects.create(order_item=order_item, option=opt_obj)
                    except CustomizationOption.DoesNotExist:
                        continue
        except MenuItem.DoesNotExist:
            continue

    return JsonResponse({
        "message":"Order placed successfully.",
        "order_id": str(order.id),
        "timestamp": order.timestamp.isoformat()
        }, status=200)

@api_view(["GET"])
@permission_classes([AllowAny])
def display_orders(request, business_slug):
    business = get_business_or_404(business_slug)
    orders = Order.objects.filter(business=business)
    data = [order.serialize() for order in orders]
    return JsonResponse(data, safe=False)

@api_view(["GET"])
@permission_classes([AllowAny]) 
def get_order_by_id(request, order_id, business_slug):
    business = get_business_or_404(business_slug)
    try:
        order = Order.objects.get(id=order_id, business=business)
        return JsonResponse(order.serialize())
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)
    
@api_view(["PATCH"])
def toggle_order_ready(request, order_id, business_slug):
    business = get_business_or_404(business_slug)
    try:
        order = Order.objects.get(id=order_id, business=business)
        order.ready = request.data.get("ready", not order.ready)
        order.save()
        return JsonResponse({"message": "Order updated", "ready": order.ready})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)

@api_view(["PATCH"])
def toggle_order_fulfilled(request, order_id, business_slug):
    business = get_business_or_404(business_slug)
    try:
        order = Order.objects.get(id=order_id, business=business)
        order.fulfilled = request.data.get("fulfilled", not order.ready)
        order.save()
        return JsonResponse({"message": "Order updated", "fulfilled": order.fulfilled})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)


