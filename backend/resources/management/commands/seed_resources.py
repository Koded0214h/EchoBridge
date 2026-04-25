import json  # not strictly needed here, kept if you want to load from JSON later
from django.core.management.base import BaseCommand
from resources.models import Category, Resource

INITIAL_DATA = {
    "categories": [
        {"name": "Loneliness", "slug": "loneliness", "icon": "💬", "order": 1},
        {"name": "Food Assistance", "slug": "food", "icon": "🍲", "order": 2},
        {"name": "Visual Aid", "slug": "visual", "icon": "👁", "order": 3},
        {"name": "General Support", "slug": "general-support", "icon": "🆘", "order": 4},
    ],
    "resources": [
        {
            "category": "loneliness",
            "title": "Warmline – Talk to Someone",
            "description": "A free, confidential phone line for emotional support. Open 7 days a week.",
            "contact_info": "Call 1-800-932-4616",
            "keywords": "lonely, alone, sad, need someone to talk, isolated"
        },
        {
            "category": "food",
            "title": "Local Food Bank Locator",
            "description": "Find your nearest food bank. You can pick up groceries or get a delivery.",
            "contact_info": "Visit foodbank.org or call 211",
            "keywords": "hungry, need food, food bank, can't afford groceries"
        },
        {
            "category": "visual",
            "title": "Be My Eyes App",
            "description": "Volunteers describe your surroundings via video call.",
            "contact_info": "Download from App Store / Google Play",
            "keywords": "can't see, blind, vision, need eyes, read this"
        },
        {
            "category": "loneliness",
            "title": "Peer Support Chat",
            "description": "Join a text-based chat with people who understand.",
            "contact_info": "Visit peersupport.com/chat",
            "keywords": "lonely, depressed, need a friend, talk"
        },
        {
            "category": "general-support",
            "title": "Crisis Text Line",
            "description": "Free, 24/7 support via text. Trained counselors available.",
            "contact_info": "Text HOME to 741741",
            "keywords": "crisis, emergency, urgent help, suicidal"
        }
    ]
}

class Command(BaseCommand):
    help = 'Seed the database with initial resources for EchoBridge MVP'

    def handle(self, *args, **options):
        for cat_data in INITIAL_DATA["categories"]:
            cat, created = Category.objects.get_or_create(
                slug=cat_data["slug"],
                defaults=cat_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created category: {cat.name}"))

        for res_data in INITIAL_DATA["resources"]:
            cat = Category.objects.get(slug=res_data.pop("category"))
            Resource.objects.get_or_create(
                title=res_data["title"],
                defaults={**res_data, "category": cat}
            )
        self.stdout.write(self.style.SUCCESS("Seed data loaded successfully."))