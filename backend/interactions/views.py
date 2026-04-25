import re
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from resources.models import Resource, Category
from resources.serializers import ResourceSerializer, CategorySerializer

class MatchQueryView(APIView):
    def post(self, request, format=None):
        query = request.data.get('query', '').strip().lower()
        if not query:
            return Response(
                {"error": "No query provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Simple keyword extraction
        tokens = set(re.findall(r'\w+', query))

        matching_resources = []
        for resource in Resource.objects.all():
            resource_keywords = set(re.findall(r'\w+', resource.keywords.lower()))
            if tokens & resource_keywords:  # intersection
                matching_resources.append(resource)

        if matching_resources:
            # Return first match (can be improved later)
            resource = matching_resources[0]
            serializer = ResourceSerializer(resource)
            return Response(serializer.data)

        # Fallback to "General Support" category if it exists
        try:
            fallback_category = Category.objects.get(slug='general-support')
            serializer = CategorySerializer(fallback_category)
            return Response(serializer.data)
        except Category.DoesNotExist:
            return Response(
                {"message": "No match found. Please browse resources."},
                status=status.HTTP_200_OK
            )