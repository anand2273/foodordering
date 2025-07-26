import pandas as pd
import os, django
from order.models import Business, MenuItem, CustomizationGroup, CustomizationOption
from django.utils.text import slugify

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "foodapp.settings")
django.setup()

data = pd.read_excel("data/menu.xlsx", sheet_name=None)
print(data.keys())

businesses_df = data["businesses"]
menu_items_df = data["menu_items"]
groups_df = data["customisation_groups"]
options_df = data["customisation_options"]

# Step 1: Populate businesses
business_map = {}
for _, row in businesses_df.iterrows():
    b, _ = Business.objects.get_or_create(
        slug=slugify(row["name"]),
        defaults={
            "name": row["name"]
        }
    )
    business_map[row["slug"]] = b

print(business_map.keys())

# Step 2: Populate menu items
item_map = {}
for _, row in menu_items_df.iterrows():
    business = business_map[row["business_name"]]
    item, _ = MenuItem.objects.get_or_create(
        title=row["title"],
        business=business,
        defaults={
            "price": row["price"],
            "desc": row["desc"],
            "img": row["img"]
        }
    )
    item_map[row["slug"]] = item

# Step 3: Customization groups
group_map = {}
for _, row in groups_df.iterrows():
    item = item_map[row["menu-item"]]
    group, _ = CustomizationGroup.objects.get_or_create(
        menu_item=item,
        name=row["name"],
        defaults={
            "required": row["required"],
            "max_choices": row["max_choices"]
        }
    )
    group_map[(row["menu-item"], row["name"])] = group

# Step 4: Customization options
for _, row in options_df.iterrows():
    key = (row["menu_item_slug"], row["group_name"])
    group = group_map.get(key)
    if group:
        CustomizationOption.objects.get_or_create(
            group=group,
            name=row["name"],
            defaults={"extra_cost": row.get("extra_cost", 0)}
        )
