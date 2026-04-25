from django.urls import path
from . import views

urlpatterns = [
    path('api/categories/', views.CategoryList.as_view(), name='category-list'),
    path('api/resources/', views.ResourceList.as_view(), name='resource-list'),
    path('api/resources/<int:pk>/', views.ResourceDetail.as_view(), name='resource-detail'),
]