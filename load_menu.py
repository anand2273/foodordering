import pandas as pd
from order.models import MenuItem
from django.utils.text import slugify

df = pd.read_excel('data/menu.xlsx')

for row in df.to_dict(orient='records'):
    name = row["title"]
    MenuItem.objects.create(
        title=name,
        desc=row.get("desc", ""),
        price=row["price"],
        img=row["img"],
        slug=slugify(name)
    )



