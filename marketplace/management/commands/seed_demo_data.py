from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from marketplace.models import Category, Product, Review


class Command(BaseCommand):
    help = "Create demo users, categories, products, and reviews."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing demo products, demo reviews, and demo users before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()

        if options["reset"]:
            Product.objects.filter(seller__username="demo_seller").delete()
            Review.objects.filter(author__username="demo_buyer").delete()
            User.objects.filter(username__in=["demo_seller", "demo_buyer"]).delete()

        seller, seller_created = User.objects.get_or_create(
            username="demo_seller",
            defaults={"email": "seller@example.com"},
        )
        if seller_created:
            seller.set_password("DemoSeller123!")
            seller.save(update_fields=["password"])

        buyer, buyer_created = User.objects.get_or_create(
            username="demo_buyer",
            defaults={"email": "buyer@example.com"},
        )
        if buyer_created:
            buyer.set_password("DemoBuyer123!")
            buyer.save(update_fields=["password"])

        categories = {}
        for name, slug in [
            ("Electronics", "electronics"),
            ("Mobility", "mobility"),
            ("Home", "home"),
            ("Apparel", "apparel"),
        ]:
            category, _ = Category.objects.get_or_create(
                slug=slug,
                defaults={"name": name},
            )
            categories[slug] = category

        products = [
            {
                "title": "Orbital Backpack",
                "description": "Minimal everyday backpack with structured storage and weather resistant shell.",
                "price": Decimal("189.00"),
                "stock": 14,
                "category": categories["apparel"],
            },
            {
                "title": "Carbon Desk Lamp",
                "description": "Low profile aluminum desk lamp with adjustable temperature and clean industrial lines.",
                "price": Decimal("249.00"),
                "stock": 8,
                "category": categories["home"],
            },
            {
                "title": "Vector Headphones",
                "description": "Wireless headphones with active noise cancellation and 40 hour battery life.",
                "price": Decimal("329.00"),
                "stock": 11,
                "category": categories["electronics"],
            },
            {
                "title": "Model X Travel Mug",
                "description": "Insulated steel travel mug built for long commutes and clean cup holders.",
                "price": Decimal("42.00"),
                "stock": 36,
                "category": categories["mobility"],
            },
            {
                "title": "Docking Station Pro",
                "description": "Compact USB-C dock with HDMI, Ethernet, card reader, and 100W pass-through charging.",
                "price": Decimal("159.00"),
                "stock": 19,
                "category": categories["electronics"],
            },
        ]

        created_products = []
        for item in products:
            product, _ = Product.objects.update_or_create(
                seller=seller,
                title=item["title"],
                defaults={
                    "description": item["description"],
                    "price": item["price"],
                    "stock": item["stock"],
                    "category": item["category"],
                    "is_active": True,
                },
            )
            created_products.append(product)

        for product in created_products[:3]:
            Review.objects.update_or_create(
                product=product,
                author=buyer,
                defaults={
                    "rating": 5,
                    "text": "Clean design, solid quality, fast delivery.",
                },
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
        self.stdout.write("Demo seller: demo_seller / DemoSeller123!")
        self.stdout.write("Demo buyer: demo_buyer / DemoBuyer123!")
