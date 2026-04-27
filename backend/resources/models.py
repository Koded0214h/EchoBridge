from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Emoji or CSS class for frontend")
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Resource(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=200)
    description = models.TextField()
    contact_info = models.CharField(max_length=300, blank=True, help_text="Phone, URL, etc.")
    audio_fallback_text = models.TextField(blank=True, help_text="Alternative read-aloud text; defaults to description")
    keywords = models.CharField(max_length=500, blank=True, help_text="Comma-separated trigger words")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category__order', 'title']

    def save(self, *args, **kwargs):
        if not self.audio_fallback_text:
            self.audio_fallback_text = self.description
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
