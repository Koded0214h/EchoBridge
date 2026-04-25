from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Emoji or CSS class for frontend")
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Resource(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=200)
    description = models.TextField()
    contact_info = models.CharField(max_length=300, blank=True, help_text="Phone, URL, etc.")
    audio_fallback_text = models.TextField(blank=True, help_text="Alternative read-aloud text")
    keywords = models.CharField(max_length=300, blank=True, help_text="Comma-separated trigger words")

    def __str__(self):
        return self.title