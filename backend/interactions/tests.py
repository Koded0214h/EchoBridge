from django.test import TestCase
from rest_framework.test import APIClient
from resources.models import Category, Resource

class MatchAPITest(TestCase):
    def setUp(self):
        cat = Category.objects.create(name="General Support", slug="general-support")
        Resource.objects.create(
            category=cat,
            title="Crisis Line",
            description="desc",
            keywords="emergency, crisis"
        )
        self.client = APIClient()

    def test_match_returns_resource(self):
        response = self.client.post('/api/match/', {'query': 'I have an emergency'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Crisis Line')