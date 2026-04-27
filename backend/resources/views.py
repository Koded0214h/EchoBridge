from rest_framework import generics
from .models import Category, Resource
from .serializers import CategorySerializer, CategorySummarySerializer, ResourceSerializer


class CategoryList(generics.ListAPIView):
    serializer_class = CategorySerializer
    pagination_class = None  # return all categories in one response

    def get_queryset(self):
        return Category.objects.prefetch_related('resources').all()


class ResourceList(generics.ListAPIView):
    serializer_class = ResourceSerializer

    def get_queryset(self):
        queryset = Resource.objects.select_related('category').filter(is_active=True)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        return queryset


class ResourceDetail(generics.RetrieveAPIView):
    serializer_class = ResourceSerializer
    queryset = Resource.objects.select_related('category').filter(is_active=True)
