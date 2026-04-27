from django.test import TestCase
from .models import Category, Resource


class CategoryModelTest(TestCase):
    def test_slug_auto_generated(self):
        cat = Category.objects.create(name="Mental Health")
        self.assertEqual(cat.slug, "mental-health")

    def test_explicit_slug_not_overwritten(self):
        cat = Category.objects.create(name="Food Help", slug="food")
        self.assertEqual(cat.slug, "food")


class ResourceModelTest(TestCase):
    def setUp(self):
        self.cat = Category.objects.create(name="Test", slug="test")

    def test_resource_creation(self):
        r = Resource.objects.create(
            category=self.cat,
            title="Test Resource",
            description="desc",
            keywords="help, test",
        )
        self.assertEqual(r.category.slug, "test")

    def test_audio_fallback_defaults_to_description(self):
        r = Resource.objects.create(
            category=self.cat,
            title="No Fallback",
            description="This is the description.",
        )
        self.assertEqual(r.audio_fallback_text, "This is the description.")

    def test_audio_fallback_explicit_value_preserved(self):
        r = Resource.objects.create(
            category=self.cat,
            title="With Fallback",
            description="desc",
            audio_fallback_text="Custom read-aloud text.",
        )
        self.assertEqual(r.audio_fallback_text, "Custom read-aloud text.")

    def test_is_active_default_true(self):
        r = Resource.objects.create(category=self.cat, title="Active", description="d")
        self.assertTrue(r.is_active)

    def test_inactive_excluded_from_active_filter(self):
        Resource.objects.create(category=self.cat, title="Hidden", description="d", is_active=False)
        self.assertEqual(Resource.objects.filter(is_active=True).count(), 0)
