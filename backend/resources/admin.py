from django.contrib import admin
from .models import Category, Resource


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'order']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']
    ordering = ['order']


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_active', 'updated_at']
    list_filter = ['category', 'is_active']
    search_fields = ['title', 'description', 'keywords']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['is_active']
