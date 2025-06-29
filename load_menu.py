import pandas as pd
from order.models import MenuItem
from django.utils.text import slugify

df = pd.read_excel('data/menu.xlsx')

for row in df.to_dict(orient='records'):
    name = row["title"]
    MenuItem.objects.create(
        title=name,
        price=row["price"],
        slug=slugify(name),
        desc=row.get("desc", ""),
        img=row["img"]
    )



