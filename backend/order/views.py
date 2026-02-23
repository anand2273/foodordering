from django.http import JsonResponse, Http404
import json
from django.views.decorators.csrf import csrf_exempt
from .models import MenuItem, OrderItem, Order, Business, CustomizationOption, SelectedCustomization, Location
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

def get_business_or_404(slug):
    try:
        return Business.objects.get(slug=slug)
    except:
        raise Http404("Business not found")


# API HANDLERS

# To fetch the entire menu
def api_menu(request, business_slug):
    biz = get_business_or_404(business_slug)
    items = MenuItem.objects.filter(business=biz)
    data = [item.serialize() for item in items]
    return JsonResponse(data, safe=False)

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def api_locations(request, business_slug):
    business = get_business_or_404(business_slug)
    locations = Location.objects.filter(business=business)
    data = [{"id": location.id, "name": location.name} for location in locations]
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
    location_id = data.get("location_id")

    if not student_name or not items or not location_id:
        return JsonResponse({"error": "Missing name, items, or location"}, status=400)

    business = get_business_or_404(business_slug)
    
    try:
        location = Location.objects.get(id=location_id, business=business)
    except Location.DoesNotExist:
        return JsonResponse({"error": "Invalid location"}, status=400)

    order = Order.objects.create(student_name=student_name, business=business, location=location)

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
    location_id = request.query_params.get('location_id')
    if location_id:
        orders = orders.filter(location_id=location_id)
    data = [order.serialize() for order in orders]
    return JsonResponse(data, safe=False)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def fulfill_location(request, business_slug, location_id):
    business = get_business_or_404(business_slug)
    try:
        Order.objects.filter(location_id=location_id, business=business).update(fulfilled=True)
        return JsonResponse({"message": "Orders for location marked as fulfilled."})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

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
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
def toggle_order_fulfilled(request, order_id, business_slug):
    business = get_business_or_404(business_slug)
    try:
        order = Order.objects.get(id=order_id, business=business)
        order.fulfilled = request.data.get("fulfilled", not order.fulfilled)
        order.save()
        return JsonResponse({"message": "Order updated", "fulfilled": order.fulfilled})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found"}, status=404)

