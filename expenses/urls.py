# expenses/urls.py
from django.urls import path
from .views import RegisterView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

     path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Expense CRUD
    path('expenses/', views.ExpenseListCreateView.as_view(), name='expense_list_create'),
    path('expenses/<int:pk>/', views.ExpenseDetailView.as_view(), name='expense_detail'),

    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    #path('logout/', views.LogoutView.as_view(), name='auth_logout'),
]
