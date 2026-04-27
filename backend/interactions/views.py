import re
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from resources.models import Resource, Category
from resources.serializers import ResourceSerializer, CategorySerializer

_TOKEN_RE = re.compile(r'\w+')
MAX_QUERY_LENGTH = 500


class MatchQueryView(APIView):
    def post(self, request, format=None):
        query = request.data.get('query', '').strip().lower()

        if not query:
            return Response({"error": "No query provided."}, status=status.HTTP_400_BAD_REQUEST)

        if len(query) > MAX_QUERY_LENGTH:
            return Response(
                {"error": f"Query too long (max {MAX_QUERY_LENGTH} characters)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        query_tokens = set(_TOKEN_RE.findall(query))

        best_resource = None
        best_score = 0

        for resource in Resource.objects.filter(is_active=True):
            resource_keywords = set(_TOKEN_RE.findall(resource.keywords.lower()))
            score = len(query_tokens & resource_keywords)
            if score > best_score:
                best_score = score
                best_resource = resource

        if best_resource:
            return Response(ResourceSerializer(best_resource).data)

        try:
            fallback = Category.objects.prefetch_related('resources').get(slug='general-support')
            return Response(CategorySerializer(fallback).data)
        except Category.DoesNotExist:
            return Response(
                {"message": "No match found. Please browse resources."},
                status=status.HTTP_200_OK,
            )
