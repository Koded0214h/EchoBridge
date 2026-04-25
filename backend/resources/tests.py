from django.test import TestCase
from .models import Category, Resource

class ResourceModelTest(TestCase):
    def setUp(self):
        self.cat = Category.objects.create(name="Test", slug="test")
        Resource.objects.create(
            category=self.cat,
            title="Test Resource",
            description="desc",
            keywords="help, test"
        )

    def test_resource_creation(self):
        r = Resource.objects.get(title="Test Resource")
        self.assertEqual(r.category.slug, "test")