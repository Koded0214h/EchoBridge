from rest_framework import serializers
from .models import Category, Resource


class ResourceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'contact_info',
            'audio_fallback_text', 'keywords', 'category_name',
        ]


class CategorySerializer(serializers.ModelSerializer):
    resources = ResourceSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'resources']


class CategorySummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer — no nested resources. Used in list views."""

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']
