from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from resources.models import Category, Resource


class MatchAPITest(TestCase):
    def setUp(self):
        self.cat = Category.objects.create(name="General Support", slug="general-support")
        Resource.objects.create(
            category=self.cat,
            title="Crisis Line",
            description="24/7 crisis support",
            keywords="emergency, crisis, urgent",
        )
        Resource.objects.create(
            category=self.cat,
            title="Warmline",
            description="Someone to talk to",
            keywords="lonely, alone, sad",
        )
        self.client = APIClient()
        self.url = reverse('match-query')

    def test_match_returns_best_resource(self):
        response = self.client.post(self.url, {'query': 'I have an emergency'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Crisis Line')

    def test_empty_query_returns_400(self):
        response = self.client.post(self.url, {'query': ''}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_missing_query_returns_400(self):
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_query_too_long_returns_400(self):
        response = self.client.post(self.url, {'query': 'a' * 501}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_no_match_falls_back_to_general_support(self):
        response = self.client.post(self.url, {'query': 'xyzzy unrecognised gibberish'}, format='json')
        self.assertEqual(response.status_code, 200)
        # Falls back to general-support category
        self.assertIn('resources', response.data)

    def test_inactive_resource_not_matched(self):
        Resource.objects.filter(title='Crisis Line').update(is_active=False)
        response = self.client.post(self.url, {'query': 'emergency crisis'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.data.get('title'), 'Crisis Line')
