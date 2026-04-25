from rest_framework import generics
from .models import Category, Resource
from .serializers import CategorySerializer, ResourceSerializer

class CategoryList(generics.ListAPIView):
    queryset = Category.objects.all().prefetch_related('resources')
    serializer_class = CategorySerializer

class ResourceDetail(generics.RetrieveAPIView):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer

class ResourceList(generics.ListAPIView):
    serializer_class = ResourceSerializer

    def get_queryset(self):
        queryset = Resource.objects.all()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        return queryset