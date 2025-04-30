from rest_framework import generics, permissions
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, ExpenseSerializer, ExpenseCategorySerializer
from .models import Expense, ExpenseCategory
from rest_framework.permissions import AllowAny
from django.db.models.functions import TruncMonth
from django.db.models import Q
from datetime import datetime

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

# Permissions: only see own expenses
class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

# List & Create Expenses
class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Expense.objects.filter(user=user)

        category = self.request.GET.get('category')
        month = self.request.GET.get('month')  # format: YYYY-MM

        if category:
            queryset = queryset.filter(category__name=category)

        if month:
            try:
                dt = datetime.strptime(month, "%Y-%m")
                queryset = queryset.filter(date__year=dt.year, date__month=dt.month)
            except:
                pass  # Ignore bad format

        return queryset.order_by('-date')
    


    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# Retrieve, Update, Delete Expense
class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    queryset = Expense.objects.all()

# List all Categories
class CategoryListView(generics.ListAPIView):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
