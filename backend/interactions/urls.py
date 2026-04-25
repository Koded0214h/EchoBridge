from django.urls import path
from . import views

urlpatterns = [
    path('api/match/', views.MatchQueryView.as_view(), name='match-query'),
]